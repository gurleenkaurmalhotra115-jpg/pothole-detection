import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintsAPI, getImageUrl } from '../api';
import {
  DropZone, SectionHeader, ErrorAlert, Spinner,
  SeverityBadge, StatusBadge, ImagePreview
} from '../components/UI';

export default function VerifyPage() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  const [complaintId, setComplaintId] = useState(paramId || '');
  const [complaint, setComplaint] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Auto-load if ID in URL
  useEffect(() => {
    if (paramId) fetchComplaint(paramId);
  }, [paramId]);

  const fetchComplaint = async (cid) => {
    const id = (cid || complaintId).trim().toUpperCase();
    if (!id) { setError('Enter a complaint ID.'); return; }
    setLookupLoading(true);
    setError('');
    setComplaint(null);
    setResult(null);
    try {
      const { data } = await complaintsAPI.getById(id);
      setComplaint(data);
    } catch {
      setError(`No complaint found with ID: ${id}`);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAfterFile = (f) => {
    setAfterFile(f);
    setError('');
    setAfterPreview(URL.createObjectURL(f));
  };

  const handleVerify = async () => {
    if (!afterFile) { setError('Please upload an after-repair image.'); return; }
    if (!complaint) { setError('No complaint loaded.'); return; }

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('after_image', afterFile);
      const { data } = await complaintsAPI.verify(complaint.id, fd);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', animation: 'slideUp 0.5s ease' }}>
      <SectionHeader
        title="Verify Repair"
        subtitle="Upload an after-repair photo. AI will re-analyse to confirm the pothole is gone."
      />

      {/* Result banner */}
      {result && (
        <div style={{
          padding: 28, borderRadius: 14, marginBottom: 24, textAlign: 'center',
          background: result.verified ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${result.verified ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          animation: 'slideUp 0.4s ease',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{result.verified ? '✅' : '❌'}</div>
          <div style={{
            fontSize: 20, fontFamily: 'Syne, sans-serif', fontWeight: 700,
            color: result.verified ? 'var(--severity-low)' : 'var(--severity-high)',
            marginBottom: 8,
          }}>
            {result.verified ? 'Repair Verified!' : 'Pothole Still Detected'}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>{result.message}</p>
          {result.verified && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/result/${complaint.id}`)}
              style={{ marginTop: 20 }}
            >
              View Full Report →
            </button>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        {/* Complaint ID lookup */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Complaint ID *
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              placeholder="Enter complaint ID (e.g. A1B2C3D4)"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchComplaint()}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fetchComplaint()}
              disabled={lookupLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {lookupLoading ? <Spinner size={16} /> : '🔍 Lookup'}
            </button>
          </div>
        </div>

        {/* Complaint info */}
        {complaint && (
          <div style={{
            padding: '16px 20px', borderRadius: 10, marginBottom: 24,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <SeverityBadge severity={complaint.severity} />
              <StatusBadge status={complaint.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Location</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{complaint.location}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Filed At</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                  {new Date(complaint.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Before image */}
            {complaint.image && (
              <div style={{ marginTop: 14 }}>
                <ImagePreview
                  src={getImageUrl(complaint.annotated_image || complaint.image)}
                  alt="Before repair"
                  label="Before Repair (AI Annotated)"
                />
              </div>
            )}

            {/* Already verified */}
            {complaint.verification_result === 'verified' && (
              <div style={{
                marginTop: 14, padding: '12px 16px', borderRadius: 8,
                background: 'rgba(34,197,94,0.1)', color: 'var(--severity-low)',
                fontWeight: 600, fontSize: 14, textAlign: 'center',
              }}>
                ✅ This complaint is already verified as repaired.
              </div>
            )}
          </div>
        )}

        {/* After image upload */}
        {complaint && complaint.verification_result !== 'verified' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                After-Repair Photo *
              </label>
              <DropZone
                onFile={handleAfterFile}
                preview={afterPreview}
                label="Upload after-repair image for AI verification"
              />
            </div>

            <ErrorAlert message={error} onDismiss={() => setError('')} />

            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={loading || !afterFile}
              style={{ width: '100%', padding: '14px', fontSize: 15 }}
            >
              {loading ? (
                <><Spinner size={18} /> Running AI Verification…</>
              ) : (
                <>🔬 Verify Repair</>
              )}
            </button>
          </>
        )}

        {!complaint && (
          <ErrorAlert message={error} onDismiss={() => setError('')} />
        )}
      </div>

      {/* How it works */}
      <div style={{
        marginTop: 20, padding: '20px 24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 16,
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-muted)',
      }}>
        <div><span style={{ display: 'block', fontSize: 20, marginBottom: 4 }}>1️⃣</span>Enter complaint ID</div>
        <div><span style={{ display: 'block', fontSize: 20, marginBottom: 4 }}>2️⃣</span>Upload post-repair photo</div>
        <div><span style={{ display: 'block', fontSize: 20, marginBottom: 4 }}>3️⃣</span>AI re-analyses & verifies</div>
      </div>
    </div>
  );
}
