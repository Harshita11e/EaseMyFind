import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall, Package, MapPin, UploadSimple,
  X, Lock
} from '@phosphor-icons/react';
import api from '../utils/axios';

const categories = [
  { name: 'Electronics', icon: DeviceMobile },
  { name: 'Documents', icon: FileText },
  { name: 'Keys', icon: Key },
  { name: 'Bags & Wallets', icon: Handbag },
  { name: 'Pets', icon: PawPrint },
  { name: 'Jewellery', icon: Diamond },
  { name: 'Clothes', icon: TShirt },
  { name: 'Books', icon: BookOpen },
  { name: 'Sports', icon: SoccerBall },
  { name: 'Other', icon: Package },
];

export default function PostItem() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    secretDetails: { primary: '', secondary: '', tertiary: '' },
    category: '',
    status: '',
    dateLostOrFound: '',
    location: { address: '', lat: 20.5937, lng: 78.9629 }
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSecretChange = (key, value) => {
    setForm(f => ({ ...f, secretDetails: { ...f.secretDetails, [key]: value } }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(images.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const handleLocationDetect = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          setForm(f => ({
            ...f,
            location: { address: data.display_name || `${lat}, ${lng}`, lat, lng }
          }));
        } catch {
          setForm(f => ({ ...f, location: { address: `${lat}, ${lng}`, lat, lng } }));
        }
      },
      () => setError('Could not detect location. Please enter manually.')
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.status) return setError('Select lost or found');
      if (!form.title.trim()) return setError('Enter a title');
      if (!form.category) return setError('Select a category');
      if (!form.description.trim()) return setError('Enter a description');
      if (!form.secretDetails.primary.trim()) return setError('Enter at least one secret detail');
    }
    if (step === 2) {
      if (!form.dateLostOrFound) return setError('Select a date');
      if (!form.location.address.trim()) return setError('Enter a location');
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('secretDetails.primary', form.secretDetails.primary);
      fd.append('secretDetails.secondary', form.secretDetails.secondary);
      fd.append('secretDetails.tertiary', form.secretDetails.tertiary);
      fd.append('category', form.category);
      fd.append('status', form.status);
      fd.append('dateLostOrFound', form.dateLostOrFound);
      fd.append('location', JSON.stringify(form.location));
      images.forEach(img => fd.append('images', img));
      const res = await api.post('/items', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/items/${res.data.item._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post item');
      setStep(1);
    } finally { setLoading(false); }
  };

  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Photos' }
  ];

  return (
    <div className="post-page">
      <div className="post-container">

        {/* Header */}
        <div style={{marginBottom: '32px'}}>
          <div className="post-title">Post an item</div>
          <div className="post-sub">Report a lost or found item in 3 steps</div>
        </div>

        {/* Progress */}
        <div className="progress-bar" style={{marginBottom: '32px'}}>
          {steps.map((s, i) => (
            <div key={s.num} style={{display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0}}>
              <div className="progress-step">
                <div className={`progress-circle ${step > s.num ? 'done' : step === s.num ? 'active' : ''}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`progress-label ${step >= s.num ? 'active' : ''}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`progress-line ${step > s.num ? 'done' : ''}`}
                  style={{margin: '0 8px', marginBottom: '20px'}}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="post-card">
          {error && <div className="form-error" style={{marginBottom: '20px'}}>{error}</div>}

          {/* Step 1 — Details */}
          {step === 1 && (
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px'}}>
                Item details
              </div>

              {/* Lost / Found toggle */}
              <div className="form-group">
                <label className="form-label">What are you reporting?</label>
                <div className="status-toggle">
                  {['lost', 'found'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`status-btn ${s} ${form.status === s ? 'active' : ''}`}
                    >
                      <span className="status-label">
                        {s === 'lost' ? 'I lost something' : 'I found something'}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: form.status === s
                          ? s === 'lost' ? '#dc2626' : '#16a34a'
                          : 'var(--text3)',
                        marginTop: '2px', display: 'block'
                      }}>
                        {s === 'lost' ? 'Post a lost item' : 'Post a found item'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Item title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Black leather wallet"
                  maxLength={100}
                  className="form-input"
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="cat-grid">
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.name }))}
                      className={`cat-btn ${form.category === cat.name ? 'active' : ''}`}
                    >
                      <cat.icon size={14} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the item — color, brand, size, any visible marks..."
                  rows={3}
                  className="form-input"
                />
              </div>

              {/* Secret Details */}
              <div className="form-group">
                <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <Lock size={12} />
                  Secret details for verification
                </label>
                <div style={{
                  padding: '14px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius)',
                  marginBottom: '8px'
                }}>
                  <p style={{fontSize: '11px', color: '#92400e', marginBottom: '12px', lineHeight: 1.6}}>
                    Add hidden details only the real owner would know. Used to verify ownership claims. Not shown publicly.
                  </p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <input
                      type="text"
                      value={form.secretDetails.primary}
                      onChange={e => handleSecretChange('primary', e.target.value)}
                      placeholder="Detail 1 — required (e.g. has a dog photo inside)"
                      className="form-input"
                      style={{background: 'white', borderColor: '#fde68a', fontSize: '12px'}}
                    />
                    <input
                      type="text"
                      value={form.secretDetails.secondary}
                      onChange={e => handleSecretChange('secondary', e.target.value)}
                      placeholder="Detail 2 — optional (e.g. torn corner on left side)"
                      className="form-input"
                      style={{background: 'white', borderColor: '#fde68a', fontSize: '12px'}}
                    />
                    <input
                      type="text"
                      value={form.secretDetails.tertiary}
                      onChange={e => handleSecretChange('tertiary', e.target.value)}
                      placeholder="Detail 3 — optional (e.g. initials written in marker)"
                      className="form-input"
                      style={{background: 'white', borderColor: '#fde68a', fontSize: '12px'}}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={validateStep}
                className="btn btn-black btn-full"
                style={{padding: '10px'}}
              >
                Next — Location
              </button>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px'}}>
                Location & date
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label">Date lost or found</label>
                <input
                  type="date"
                  name="dateLostOrFound"
                  value={form.dateLostOrFound}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Location</label>
                <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                  <input
                    type="text"
                    value={form.location.address}
                    onChange={e => setForm(f => ({
                      ...f, location: { ...f.location, address: e.target.value }
                    }))}
                    placeholder="Enter address or area..."
                    className="form-input"
                    style={{marginBottom: 0}}
                  />
                  <button
                    type="button"
                    onClick={handleLocationDetect}
                    className="btn btn-ghost"
                    style={{flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px'}}
                  >
                    <MapPin size={14} />
                    Detect
                  </button>
                </div>
                <div className="form-hint">
                  Click "Detect" to use your current GPS location automatically
                </div>
              </div>

              {/* Lat/Lng */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px'}}>
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    value={form.location.lat}
                    step="0.0001"
                    onChange={e => setForm(f => ({
                      ...f, location: { ...f.location, lat: parseFloat(e.target.value) }
                    }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    value={form.location.lng}
                    step="0.0001"
                    onChange={e => setForm(f => ({
                      ...f, location: { ...f.location, lng: parseFloat(e.target.value) }
                    }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-ghost btn-full"
                  style={{padding: '10px'}}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={validateStep}
                  className="btn btn-black btn-full"
                  style={{padding: '10px'}}
                >
                  Next — Photos
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Photos */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '20px'}}>
                Upload photos
              </div>

              {/* Upload area */}
              <label className="upload-area" style={{display: 'block', marginBottom: '16px'}}>
                <UploadSimple
                  size={28}
                  style={{margin: '0 auto 10px', display: 'block', color: 'var(--text3)'}}
                />
                <p style={{fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '3px'}}>
                  Click to upload photos
                </p>
                <p style={{fontSize: '11px', color: 'var(--text3)'}}>
                  JPG, PNG, WEBP up to 5MB · Max 5 photos
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{display: 'none'}}
                />
              </label>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="image-previews" style={{marginBottom: '20px'}}>
                  {previews.map((p, i) => (
                    <div key={i} className="image-preview">
                      <img src={p} alt="" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => removeImage(i)}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                marginBottom: '20px'
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--bg2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  Summary
                </div>
                {[
                  { label: 'Status', value: form.status },
                  { label: 'Title', value: form.title },
                  { label: 'Category', value: form.category },
                  { label: 'Date', value: form.dateLostOrFound },
                  { label: 'Location', value: form.location.address?.split(',')[0] },
                  { label: 'Photos', value: `${images.length} selected` },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px'
                  }}>
                    <span style={{color: 'var(--text3)', fontWeight: '500'}}>{row.label}</span>
                    <span style={{color: 'var(--text)', fontWeight: '500', textTransform: 'capitalize'}}>
                      {row.value || '—'}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-ghost btn-full"
                  style={{padding: '10px'}}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-black btn-full"
                  style={{padding: '10px'}}
                >
                  {loading ? 'Posting...' : 'Post item'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}