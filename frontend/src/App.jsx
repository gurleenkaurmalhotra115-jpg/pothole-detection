import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AdminPage from './pages/AdminPage';
import VerifyPage from './pages/VerifyPage';
import ResultPage from './pages/ResultPage';

const NAV_ITEMS = [
  { to: '/', label: 'Report', icon: '⚠' },
  { to: '/admin', label: 'Admin', icon: '⊞' },
  { to: '/verify', label: 'Verify', icon: '✓' },
];

function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,11,0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 60, gap: 32 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>🕳</div>
              <span style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: 17,
                color: 'var(--text-primary)',
              }}>PotholeAI</span>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {NAV_ITEMS.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent',
                })}>
                  <span>{icon}</span>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}>
        PotholeAI · Smart Road Complaint Management · Built with OpenCV + Gemini AI
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:id" element={<VerifyPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
