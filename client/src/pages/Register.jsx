import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import { ShieldCheck, MagnifyingGlass, MapPin, Lock } from '@phosphor-icons/react';
import api from '../utils/axios';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', confirmPassword: ''
  });
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
    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name, email: form.email,
        phone: form.phone, password: form.password
      });
      dispatch(setCredentials(res.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const strength = form.password.length === 0 ? 0
    : form.password.length < 4 ? 1
    : form.password.length < 7 ? 2
    : form.password.length < 10 ? 3 : 4;

  const strengthColors = ['', '#dc2626', '#f97316', '#3b82f6', '#16a34a'];
  const strengthLabels = ['', 'Too weak', 'Weak', 'Good', 'Strong'];

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-logo">EaseMyFind</div>
        <div className="auth-left-content">
          <h2>Join your<br />community.</h2>
          <p style={{marginTop: '12px'}}>
            Help others find what they lost. Report found items and make a real difference.
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
          <div className="auth-title">Create account</div>
          <div className="auth-sub">Free to use. No hidden charges.</div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className="form-input"
              />
            </div>

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
              <label className="form-label">Phone number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit number"
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
                placeholder="Min. 6 characters"
                required
                className="form-input"
              />
              {form.password && (
                <div style={{marginTop: '6px'}}>
                  <div style={{display: 'flex', gap: '3px', marginBottom: '4px'}}>
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: '2px', borderRadius: '2px',
                          background: strength >= i ? strengthColors[strength] : 'var(--border)',
                          transition: 'background 0.2s'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '500',
                    color: strengthColors[strength]
                  }}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{fontSize: '13px', color: 'var(--text3)'}}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{color: 'var(--text)', fontWeight: '600', textDecoration: 'none'}}
              >
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}