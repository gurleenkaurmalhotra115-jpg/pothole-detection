import React from 'react';

// ── Severity Badge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  if (!severity) return <span className="badge badge-no_detection">Unknown</span>;
  const dot = { high: '●', medium: '◐', low: '○' }[severity] || '·';
  return (
    <span className={`badge badge-${severity}`}>
      {dot} {severity}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const labels = {
    reported: '📋 Reported',
    in_progress: '🔧 In Progress',
    repaired: '✅ Repaired',
    no_detection: '— No Detection',
  };
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] || status}
    </span>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="spinner" style={{ width: size, height: size }} />
      {label && <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>}
    </div>
  );
}

// ── Error Alert ───────────────────────────────────────────────────────────────
export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      animation: 'fadeIn 0.3s ease',
    }}>
      <span style={{ fontSize: 18 }}>⚠</span>
      <div style={{ flex: 1, color: 'var(--severity-high)', fontSize: 14 }}>{message}</div>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 18, padding: 0,
        }}>×</button>
      )}
    </div>
  );
}

// ── Image Preview ─────────────────────────────────────────────────────────────
export function ImagePreview({ src, alt, label }) {
  if (!src) return null;
  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 8,
        }}>{label}</div>
      )}
      <div style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <img src={src} alt={alt || label} style={{
          width: '100%', display: 'block', maxHeight: 320, objectFit: 'contain',
        }} />
      </div>
    </div>
  );
}

// ── Confidence Bar ─────────────────────────────────────────────────────────────
export function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? 'var(--severity-high)' : pct >= 45 ? 'var(--severity-medium)' : 'var(--severity-low)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Detection Confidence</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{
        height: 6, borderRadius: 999, background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: color, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0, marginBottom: 6,
        }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 15 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, icon }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{value ?? '—'}</div>
        </div>
        {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>{icon || '📋'}</div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14 }}>{subtitle}</div>}
    </div>
  );
}

// ── File Drop Zone ────────────────────────────────────────────────────────────
export function DropZone({ onFile, preview, label, accept = "image/*" }) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={`drop-zone ${dragging ? 'active' : ''}`}
      style={{ borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', position: 'relative' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      {preview ? (
        <img src={preview} alt="Preview" style={{
          maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'contain',
        }} />
      ) : (
        <div>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {label || 'Drop image here or click to upload'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>PNG, JPG, JPEG, WEBP · Max 16MB</div>
        </div>
      )}
    </div>
  );
}
