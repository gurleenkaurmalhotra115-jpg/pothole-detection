import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { complaintsAPI, getImageUrl } from '../api';
import {
  SeverityBadge, StatusBadge, ConfidenceBar,
  ImagePreview, SectionHeader, Spinner, ErrorAlert
} from '../components/UI';

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function PipelineVisualizer({ complaint }) {
  const tabs = [
    { id: 'original', label: 'Original', image: complaint.image, desc: 'Raw input photo of the road surface.' },
    { id: 'edges', label: 'Canny Edges', image: complaint.edges_image, desc: 'Boundary tracking via OpenCV Canny edge extraction.' },
    { id: 'closed', label: 'Closing Mask', image: complaint.closed_image, desc: 'Morphological closed binary mask (elliptical kernel) to isolate pothole boundaries.' },
    { id: 'annotated', label: 'Final Contours', image: complaint.annotated_image, desc: 'Extracted contours with bounding box overlay and severity classification.' }
  ].filter(t => t.image);

  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[tabs.length - 1].id : 'original');
  const activeData = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        🔍 OpenCV Pipeline Visualizer
      </div>
      
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 6,
              background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Image Preview */}
      <div style={{ marginBottom: 14 }}>
        <ImagePreview
          src={getImageUrl(activeData.image)}
          alt={activeData.label}
          label={activeData.label}
        />
      </div>

      {/* Code / Algo Context */}
      <div style={{
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        💡 <strong>{activeData.label}</strong>: {activeData.desc}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const [complaint, setComplaint] = useState(state?.result?.complaint || null);
  const [loading, setLoading] = useState(!complaint);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!complaint) {
      complaintsAPI.getById(id)
        .then(({ data }) => setComplaint(data))
        .catch(() => setError('Could not load complaint.'))
        .finally(() => setLoading(false));
    }
  }, [id, complaint]);

  const copyId = () => {
    navigator.clipboard.writeText(complaint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={32} label="Loading complaint…" />
    </div>
  );

  if (error) return <ErrorAlert message={error} />;
  if (!complaint) return null;

  const detected = complaint.detected !== false && complaint.severity;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'slideUp 0.5s ease' }}>
      <SectionHeader
        title={detected ? '🚨 Pothole Detected' : '✅ No Pothole Found'}
        subtitle={`Complaint ID: ${complaint.id}`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={copyId} style={{ fontSize: 13 }}>
              {copied ? '✓ Copied' : '⎘ Copy ID'}
            </button>
            <Link to="/admin" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: 13 }}>
              Admin →
            </Link>
          </div>
        }
      />

      {/* Detection result banner */}
      <div style={{
        padding: '20px 24px',
        borderRadius: 12,
        marginBottom: 24,
        background: detected
          ? complaint.severity === 'high' ? 'rgba(239,68,68,0.08)' : complaint.severity === 'medium' ? 'rgba(249,115,22,0.08)' : 'rgba(34,197,94,0.08)'
          : 'rgba(34,197,94,0.08)',
        border: `1px solid ${detected
          ? complaint.severity === 'high' ? 'rgba(239,68,68,0.2)' : complaint.severity === 'medium' ? 'rgba(249,115,22,0.2)' : 'rgba(34,197,94,0.2)'
          : 'rgba(34,197,94,0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {detected ? (
            <>
              <SeverityBadge severity={complaint.severity} />
              <StatusBadge status={complaint.status} />
            </>
          ) : (
            <span style={{ color: 'var(--severity-low)', fontWeight: 600 }}>No pothole detected in this image.</span>
          )}
        </div>
        {detected && <ConfidenceBar value={complaint.confidence || 0} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Pipeline Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PipelineVisualizer complaint={complaint} />
        </div>

        {/* Right: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Meta */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Complaint Details</div>
            <MetaRow label="ID" value={
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--accent)' }}>{complaint.id}</span>
            } />
            <MetaRow label="Location" value={complaint.location} />
            <MetaRow label="Filed At" value={new Date(complaint.timestamp).toLocaleString()} />
            {detected && (
              <>
                <MetaRow label="Contour Area" value={`${Math.round(complaint.contour_area || 0)} px²`} />
                {complaint.bounding_box && (
                  <MetaRow label="Dimensions" value={`${complaint.bounding_box.width} × ${complaint.bounding_box.height} px`} />
                )}
              </>
            )}
          </div>

          {/* Complaint text */}
          {complaint.complaint_text && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                🤖 AI-Generated Complaint
              </div>
              <p style={{
                fontSize: 14, lineHeight: 1.7,
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                padding: '14px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                margin: 0,
                fontStyle: 'italic',
              }}>
                {complaint.complaint_text}
              </p>
            </div>
          )}

          {/* Verification CTA */}
          {complaint.status === 'repaired' || complaint.verification_result === 'verified' ? (
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600, color: 'var(--severity-low)' }}>Verified as Repaired</div>
              {complaint.verified_at && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(complaint.verified_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : detected ? (
            <Link
              to={`/verify/${complaint.id}`}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', justifyContent: 'center', padding: '14px' }}
            >
              📸 Upload Verification Photo →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
