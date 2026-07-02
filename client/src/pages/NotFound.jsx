import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>❄️</div>
      <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>404</h1>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: 32, fontSize: 16 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary" style={{ background: 'var(--primary)', color: 'white', textDecoration: 'none' }}>
        Go Home
      </Link>
    </div>
  );
}
