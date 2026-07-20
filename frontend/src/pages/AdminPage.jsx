import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintsAPI, getImageUrl } from '../api';
import {
  SeverityBadge, StatusBadge, StatCard,
  SectionHeader, EmptyState, Spinner, ErrorAlert
} from '../components/UI';

const STATUS_OPTIONS = ['', 'reported', 'in_progress', 'repaired', 'no_detection'];
const SEVERITY_OPTIONS = ['', 'high', 'medium', 'low'];
const STATUS_TRANSITIONS = {
  reported: ['in_progress'],
  in_progress: ['repaired'],
  repaired: [],
  no_detection: [],
};

function ComplaintCard({ complaint, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const nextStatuses = STATUS_TRANSITIONS[complaint.status] || [];

  const handleUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusUpdate(complaint.id, newStatus, note);
      setShowNote(false);
      setNote('');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        {complaint.image && (
          <div style={{
            width: 90, height: 70, borderRadius: 8,
            overflow: 'hidden', flexShrink: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <img
              src={getImageUrl(complaint.annotated_image || complaint.image)}
              alt="Pothole"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 4 }}>
              #{complaint.id}
            </span>
            <SeverityBadge severity={complaint.severity} />
            <StatusBadge status={complaint.status} />
          </div>

          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {complaint.location}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            {new Date(complaint.timestamp).toLocaleString()} 
            {complaint.confidence ? ` · ${Math.round(complaint.confidence * 100)}% confidence` : ''}
          </div>

          {complaint.complaint_text && (
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px',
              lineHeight: 1.6, display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {complaint.complaint_text}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to={`/result/${complaint.id}`}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', fontSize: 12, padding: '6px 12px' }}
            >
              View →
            </Link>

            {nextStatuses.map((s) => (
              <button
                key={s}
                className="btn btn-primary"
                disabled={updating}
                onClick={() => {
                  if (s === 'repaired') setShowNote(true);
                  else handleUpdate(s);
                }}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                {updating ? <Spinner size={14} /> : `→ ${s.replace('_', ' ')}`}
              </button>
            ))}

            {complaint.status === 'repaired' && !complaint.verification_result && (
              <Link
                to={`/verify/${complaint.id}`}
                className="btn btn-secondary"
                style={{ textDecoration: 'none', fontSize: 12, padding: '6px 12px' }}
              >
                📸 Verify
              </Link>
            )}

            {complaint.verification_result === 'verified' && (
              <span style={{ fontSize: 12, color: 'var(--severity-low)', fontWeight: 600 }}>✅ Verified</span>
            )}
          </div>

          {/* Note input for repair confirmation */}
          {showNote && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Add a note (optional)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ fontSize: 13 }}
              />
              <button className="btn btn-primary" onClick={() => handleUpdate('repaired')} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                Confirm Repaired
              </button>
              <button className="btn btn-secondary" onClick={() => setShowNote(false)} style={{ fontSize: 13 }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSeverity) params.severity = filterSeverity;
      const { data } = await complaintsAPI.getAll(params);
      setComplaints(data.complaints || []);
      setStats(data.stats || {});
    } catch {
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusUpdate = async (id, status, note) => {
    try {
      await complaintsAPI.updateStatus(id, status, note);
      await fetchData();
    } catch {
      setError('Failed to update status.');
    }
  };

  return (
    <div style={{ animation: 'slideUp 0.5s ease' }}>
      <SectionHeader
        title="Admin Dashboard"
        subtitle="Manage and monitor all pothole complaints."
        action={
          <button className="btn btn-secondary" onClick={fetchData} style={{ fontSize: 13 }}>
            ↻ Refresh
          </button>
        }
      />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total" value={stats.total || 0} icon="📋" />
        <StatCard label="Reported" value={stats.by_status?.reported || 0} color="var(--status-reported)" icon="🚨" />
        <StatCard label="In Progress" value={stats.by_status?.in_progress || 0} color="var(--status-in_progress)" icon="🔧" />
        <StatCard label="Repaired" value={stats.by_status?.repaired || 0} color="var(--status-repaired)" icon="✅" />
        <StatCard label="High Severity" value={stats.by_severity?.high || 0} color="var(--severity-high)" icon="⚠" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: 180 }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          className="input"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{ width: 180 }}
        >
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {(filterStatus || filterSeverity) && (
          <button
            className="btn btn-secondary"
            onClick={() => { setFilterStatus(''); setFilterSeverity(''); }}
            style={{ fontSize: 13 }}
          >
            ✕ Clear
          </button>
        )}

        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>
          {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Complaints list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={28} label="Loading complaints…" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🕳"
            title="No complaints found"
            subtitle={filterStatus || filterSeverity ? 'Try adjusting your filters.' : 'Submit a pothole report to get started.'}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
