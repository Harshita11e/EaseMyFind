import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">EaseMyFind</div>
        <div className="footer-links">
          <Link to="/browse" className="footer-link">Browse</Link>
          <Link to="/map" className="footer-link">Map</Link>
          <Link to="/post-item" className="footer-link">Post Item</Link>
          <Link to="/login" className="footer-link">Login</Link>
          <Link to="/register" className="footer-link">Sign up</Link>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div className="footer-status">
            <span className="status-dot"></span>
            All systems operational
          </div>
          <span style={{fontSize: '12px', color: 'var(--text3)'}}>© 2026 EaseMyFind</span>
        </div>
      </div>
    </footer>
  );
}