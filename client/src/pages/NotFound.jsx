import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '600',
          color: 'var(--text3)', textTransform: 'uppercase',
          letterSpacing: '0.5px', marginBottom: '16px'
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: '32px', fontWeight: '400',
          color: 'var(--text)', letterSpacing: '-0.5px',
          marginBottom: '10px'
        }}>
          Page not found
        </h1>
        <p style={{
          fontSize: '14px', color: 'var(--text3)',
          lineHeight: 1.6, marginBottom: '28px'
        }}>
          Looks like this page got lost too. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-black">Go home</Link>
          <Link to="/browse" className="btn btn-ghost">Browse items</Link>
        </div>
      </div>
    </div>
  );
}