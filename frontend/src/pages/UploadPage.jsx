import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../api';
import { DropZone, SectionHeader, ErrorAlert, Spinner } from '../components/UI';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState('');

  const handleFile = (f) => {
    setFile(f);
    setError('');
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      () => setError('Could not fetch GPS location.')
    );
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please upload an image.'); return; }
    if (!location.trim()) { setError('Please enter or fetch a location.'); return; }

    setLoading(true);
    setError('');

    try {
      setLoadingStep('Analysing image with OpenCV…');
      const fd = new FormData();
      fd.append('image', file);
      fd.append('location', location.trim());

      setLoadingStep('Detecting pothole contours…');
      const { data } = await complaintsAPI.create(fd);

      setLoadingStep('Generating complaint via Gemini AI…');
      navigate(`/result/${data.id}`, { state: { result: data } });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Submission failed.';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', animation: 'slideUp 0.5s ease' }}>
      <SectionHeader
        title="Report a Pothole"
        subtitle="Upload a photo and location — our AI will detect, assess severity, and file a formal complaint automatically."
      />

      <div className="card" style={{ padding: 32 }}>
        {/* Image upload */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pothole Photo *
          </label>
          <DropZone onFile={handleFile} preview={preview} />
          {file && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>

        {/* Location */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Location / GPS Coordinates *
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              placeholder="e.g. MG Road, Bangalore or 12.9716, 77.5946"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={handleGPS}
              style={{ whiteSpace: 'nowrap', minWidth: 110 }}
            >
              📍 Use GPS
            </button>
          </div>
        </div>

        {/* Error */}
        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {/* Submit */}
        <div style={{ marginTop: 28 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '14px 20px', fontSize: 15 }}
          >
            {loading ? (
              <>
                <Spinner size={18} />
                {loadingStep || 'Processing…'}
              </>
            ) : (
              <> 🚨 Detect & File Complaint</>
            )}
          </button>
        </div>

        {/* Info strip */}
        <div style={{
          marginTop: 20,
          padding: '14px 16px',
          borderRadius: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          fontSize: 13,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          <div><span style={{ display: 'block', fontSize: 18 }}>🔍</span>OpenCV Detection</div>
          <div><span style={{ display: 'block', fontSize: 18 }}>🤖</span>Gemini AI Complaint</div>
          <div><span style={{ display: 'block', fontSize: 18 }}>📋</span>Auto-assigned ID</div>
        </div>
      </div>
    </div>
  );
}
