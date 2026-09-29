import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, List, X } from '@phosphor-icons/react';
import api from '../utils/axios';

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const { unreadCount } = useSelector(s => s.notifications);
  const { isDark, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await api.post('/auth/logout');
    dispatch(logout());
    navigate('/');
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="nav">
        {/* Logo */}
        <Link to="/" className="nav-logo">EaseMyFind</Link>

        {/* Desktop links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/browse" className={`nav-link ${isActive('/browse') ? 'active' : ''}`}>Browse</Link>
          <Link to="/map" className={`nav-link ${isActive('/map') ? 'active' : ''}`}>Map</Link>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {user && (
            <Link to="/post-item" className="btn btn-ghost btn-sm">
              + Post item
            </Link>
          )}

          {/* Theme toggle */}
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '5px 10px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)', background: 'none',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  fontSize: '13px', fontWeight: '500', color: 'var(--text)',
                  transition: 'all 0.1s'
                }}
              >
                <div className="avatar avatar-xs" style={{ width: '20px', height: '20px', fontSize: '9px', borderRadius: '50%' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span>{user.name?.split(' ')[0]}</span>
                {unreadCount > 0 && (
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'var(--black)', color: 'var(--bg)',
                    fontSize: '9px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{unreadCount}</span>
                )}
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: '180px', background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                  zIndex: 200,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}>
                  {[
                    { to: '/dashboard', label: 'Dashboard' },
                    ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel' }] : [])
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'block', padding: '10px 14px',
                        fontSize: '13px', color: 'var(--text2)',
                        textDecoration: 'none', transition: 'background 0.1s',
                        fontWeight: '500'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '10px 14px', fontSize: '13px',
                      color: '#dc2626', background: 'none',
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: '500'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-black btn-sm">Sign up</Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            className="icon-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            {menuOpen ? <X size={15} /> : <List size={15} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px 16px',
          display: 'flex', flexDirection: 'column', gap: '2px'
        }}>
          {[
            { to: '/', label: 'Home' },
            { to: '/browse', label: 'Browse' },
            { to: '/map', label: 'Map' },
          ].map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '9px 12px', borderRadius: 'var(--radius)',
                fontSize: '14px', color: 'var(--text2)',
                textDecoration: 'none', fontWeight: '500'
              }}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/post-item" onClick={() => setMenuOpen(false)}
                style={{ padding: '9px 12px', fontSize: '14px', color: 'var(--text)', fontWeight: '600', textDecoration: 'none' }}>
                + Post item
              </Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                style={{ padding: '9px 12px', fontSize: '14px', color: 'var(--text2)', textDecoration: 'none' }}>
                Dashboard
              </Link>
              <button onClick={handleLogout}
                style={{ textAlign: 'left', padding: '9px 12px', fontSize: '14px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                style={{ padding: '9px 12px', fontSize: '14px', color: 'var(--text2)', textDecoration: 'none' }}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                style={{ padding: '9px 12px', fontSize: '14px', color: 'var(--text)', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
            </>
          )}
        </div>
      )}

      {/* Close dropdown on outside click
      {dropdownOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setDropdownOpen(false)}
        />
      )} */}

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .nav-links { display: none !important; }
        }
      `}</style>
    </>
  );
}