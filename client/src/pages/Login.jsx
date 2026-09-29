import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import { ShieldCheck, MagnifyingGlass, MapPin, Lock } from '@phosphor-icons/react';
import api from '../utils/axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      dispatch(setCredentials(res.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-logo">EaseMyFind</div>
        <div className="auth-left-content">
          <h2>Find what<br />you lost.</h2>
          <p style={{marginTop: '12px'}}>
            A secure community platform helping people across India recover their lost belongings.
          </p>
        </div>
        <div className="auth-features">
          {[
            { icon: ShieldCheck, text: 'Secret verification system' },
            { icon: MagnifyingGlass, text: 'Fuzzy typo-tolerant search' },
            { icon: MapPin, text: 'Map-based item discovery' },
            { icon: Lock, text: 'Privacy-first contact reveal' },
          ].map((f, i) => (
            <div key={i} className="auth-feature">
              <div className="auth-feature-icon">
                <f.icon size={14} />
              </div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-title">Welcome back</div>
          <div className="auth-sub">Enter your credentials to sign in</div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-black btn-full"
              style={{padding: '10px', marginTop: '8px'}}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{fontSize: '13px', color: 'var(--text3)'}}>
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{color: 'var(--text)', fontWeight: '600', textDecoration: 'none'}}
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}