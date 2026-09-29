import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall, Package, Lock, ArrowLeft,
  CheckCircle, XCircle, Warning
} from '@phosphor-icons/react';
import api from '../utils/axios';

const categoryIcons = {
  'Electronics': DeviceMobile, 'Documents': FileText,
  'Keys': Key, 'Bags & Wallets': Handbag,
  'Pets': PawPrint, 'Jewellery': Diamond,
  'Clothes': TShirt, 'Books': BookOpen,
  'Sports': SoccerBall, 'Other': Package
};

const badgeClass = {
  lost: 'badge-lost', found: 'badge-found',
  claimed: 'badge-claimed', resolved: 'badge-resolved'
};

const claimStatusStyle = {
  pending: { bg: '#fffbeb', color: '#ca8a04', border: '#fde68a' },
  accepted: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
};

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimForm, setClaimForm] = useState({ proofDescription: '', proofImage: null });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = user && item?.postedBy?._id === user._id;

  useEffect(() => { fetchItem(); }, [id]);
  useEffect(() => { if (isOwner) fetchClaims(); }, [isOwner, item]);

  const fetchItem = async () => {
    try {
      const res = await api.get(`/items/${id}`);
      setItem(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchClaims = async () => {
    try {
      const res = await api.get(`/claims/item/${id}`);
      setClaims(res.data);
    } catch (err) { console.error(err); }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimLoading(true);
    setClaimError('');
    try {
      const fd = new FormData();
      fd.append('proofDescription', claimForm.proofDescription);
      if (claimForm.proofImage) fd.append('proofImage', claimForm.proofImage);
      await api.post(`/claims/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setClaimSuccess(true);
      setShowClaimForm(false);
      fetchItem();
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim');
    } finally { setClaimLoading(false); }
  };

  const handleClaimAction = async (claimId, action) => {
    try {
      await api.patch(`/claims/${claimId}/${action}`);
      fetchClaims();
      fetchItem();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this item?')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/items/${id}`);
      navigate('/dashboard');
    } catch (err) { console.error(err); }
    finally { setDeleteLoading(false); }
  };

  const handleResolve = async () => {
    try {
      await api.patch(`/items/${id}/resolve`);
      fetchItem();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="spinner" />
    </div>
  );

  if (!item) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '12px'
    }}>
      <p style={{fontSize: '14px', color: 'var(--text2)'}}>Item not found</p>
      <Link to="/browse" className="btn btn-ghost btn-sm">← Back to browse</Link>
    </div>
  );

  const Icon = categoryIcons[item.category] || Package;

  return (
    <div style={{minHeight: '100vh', background: 'var(--bg)'}}>

      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        background: 'var(--bg)'
      }}>
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', color: 'var(--text3)',
              background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
      </div>

      <div className="detail-grid">

        {/* Left — Images */}
        <div>
          {/* Main image */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            aspectRatio: '1',
            marginBottom: '8px',
            background: 'var(--bg2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {item.images?.length > 0 ? (
              <img
                src={item.images[activeImage]}
                alt={item.title}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            ) : (
              <Icon size={80} weight="thin" color="var(--border2)" />
            )}
          </div>

          {/* Thumbnails */}
          {item.images?.length > 1 && (
            <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
              {item.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: '56px', height: '56px',
                    border: `1px solid ${activeImage === i ? 'var(--black)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden', padding: 0,
                    cursor: 'pointer', background: 'none'
                  }}
                >
                  <img src={img} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

          {/* Status + Category */}
          <div style={{display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap'}}>
            <span className={`badge ${badgeClass[item.status]}`} style={{position: 'static'}}>
              {item.status}
            </span>
            <span style={{
              padding: '2px 7px', borderRadius: '3px',
              fontSize: '10px', fontWeight: '600',
              background: 'var(--bg3)', color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.3px'
            }}>
              {item.category}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '28px', fontWeight: '400',
            color: 'var(--text)', letterSpacing: '-0.5px',
            lineHeight: 1.2
          }}>
            {item.title}
          </h1>

          {/* Description */}
          <div className="detail-section">
            <div className="detail-label">Description</div>
            <div style={{fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, marginTop: '4px'}}>
              {item.description}
            </div>
          </div>

          {/* Secret details — owner only */}
          {isOwner && item.secretDetails && (
            <div className="secret-box">
              <div className="secret-label" style={{
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <Lock size={11} />
                Secret details — only you can see this
              </div>
              {item.secretDetails.primary && (
                <div className="secret-value" style={{marginBottom: '4px'}}>
                  <strong>1.</strong> {item.secretDetails.primary}
                </div>
              )}
              {item.secretDetails.secondary && (
                <div className="secret-value" style={{marginBottom: '4px'}}>
                  <strong>2.</strong> {item.secretDetails.secondary}
                </div>
              )}
              {item.secretDetails.tertiary && (
                <div className="secret-value">
                  <strong>3.</strong> {item.secretDetails.tertiary}
                </div>
              )}
            </div>
          )}

          {/* Info grid */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
            <div className="detail-section">
              <div className="detail-label">Location</div>
              <div className="detail-value" style={{marginTop: '4px'}}>
                {item.location?.address?.split(',').slice(0, 2).join(',')}
              </div>
            </div>
            <div className="detail-section">
              <div className="detail-label">Date</div>
              <div className="detail-value" style={{marginTop: '4px'}}>
                {new Date(item.dateLostOrFound).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Posted by */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg)'
          }}>
            <div className="avatar avatar-md">
              {item.postedBy?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--text)'}}>
                {item.postedBy?.name}
              </div>
              <div style={{fontSize: '11px', color: 'var(--text3)'}}>
                Posted {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div style={{display: 'flex', gap: '8px'}}>
              {item.status !== 'resolved' && (
                <button
                  onClick={handleResolve}
                  className="btn btn-success btn-full"
                  style={{padding: '9px'}}
                >
                  <CheckCircle size={14} />
                  Mark resolved
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="btn btn-danger btn-full"
                style={{padding: '9px'}}
              >
                <XCircle size={14} />
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}

          {/* Non-owner actions */}
          {!isOwner && user && (
            <div>
              {item.status === 'found' ? (
                claimSuccess ? (
                  <div style={{
                    padding: '12px 14px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius)',
                    fontSize: '13px',
                    color: '#16a34a',
                    fontWeight: '500'
                  }}>
                    ✓ Claim submitted. The finder will review your proof shortly.
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClaimForm(!showClaimForm)}
                    className="btn btn-black btn-full"
                    style={{padding: '10px'}}
                  >
                    This is mine — submit a claim
                  </button>
                )
              ) : item.status === 'lost' ? (
                <div style={{
                  padding: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg2)'
                }}>
                  <p style={{fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px'}}>
                    Did you find this item?
                  </p>
                  <p style={{fontSize: '12px', color: 'var(--text3)', marginBottom: '12px'}}>
                    Post it as a found listing so the owner can claim it from you.
                  </p>
                  <Link to="/post-item" className="btn btn-black btn-sm">
                    + Post as found item
                  </Link>
                </div>
              ) : item.status === 'claimed' ? (
                <div style={{
                  padding: '12px 14px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px', color: '#ca8a04', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Warning size={14} />
                  A claim is already pending on this item
                </div>
              ) : item.status === 'resolved' ? (
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px', color: 'var(--text3)'
                }}>
                  This item has been resolved
                </div>
              ) : null}
            </div>
          )}

          {/* Guest */}
          {!user && (
            <Link to="/login" className="btn btn-black btn-full" style={{padding: '10px', textAlign: 'center'}}>
              Sign in to submit a claim
            </Link>
          )}
        </div>
      </div>

      {/* Claim form */}
      {showClaimForm && !claimSuccess && (
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          padding: '0 24px 48px'
        }}>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            background: 'var(--bg)'
          }}>
            <div className="card-header">Submit your claim</div>
            <div className="card-body">
              <p style={{fontSize: '13px', color: 'var(--text3)', marginBottom: '20px', lineHeight: 1.6}}>
                Describe something specific about this item that only the real owner would know. The more detail the better — this is how your ownership gets verified.
              </p>

              {claimError && <div className="form-error">{claimError}</div>}

              <form onSubmit={handleClaimSubmit}>
                <div className="form-group">
                  <label className="form-label">Proof of ownership</label>
                  <textarea
                    value={claimForm.proofDescription}
                    onChange={e => setClaimForm({...claimForm, proofDescription: e.target.value})}
                    placeholder="e.g. The wallet has a small dog photo inside, a torn corner on the left side, and a blue sticky note with my name..."
                    rows={4}
                    required
                    className="form-input"
                  />
                  <div className="form-hint">Minimum 20 characters. Be as specific as possible.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Proof photo{' '}
                    <span style={{color: 'var(--text3)', fontWeight: '400'}}>— optional</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setClaimForm({...claimForm, proofImage: e.target.files[0]})}
                    className="form-input"
                  />
                  <div className="form-hint">Upload an old photo of you with the item if you have one</div>
                </div>

                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="btn btn-black"
                    style={{padding: '9px 20px'}}
                  >
                    {claimLoading ? 'Submitting...' : 'Submit claim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(false)}
                    className="btn btn-ghost"
                    style={{padding: '9px 20px'}}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Claims — owner only */}
      {isOwner && claims.length > 0 && (
        <div style={{maxWidth: '1000px', margin: '0 auto', padding: '0 24px 48px'}}>
          <div style={{
            fontSize: '13px', fontWeight: '600',
            color: 'var(--text)', marginBottom: '14px'
          }}>
            Claims ({claims.length})
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {claims.map(claim => {
              const s = claimStatusStyle[claim.status];
              return (
                <div key={claim._id} className="claim-card">
                  {/* Header */}
                  <div className="claim-card-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div className="avatar avatar-sm">
                        {claim.claimedBy?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--text)'}}>
                          {claim.claimedBy?.name}
                        </div>
                        <div style={{fontSize: '11px', color: 'var(--text3)'}}>
                          {claim.claimedBy?.email}
                        </div>
                      </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      {/* Match score */}
                      {claim.matchScore !== undefined && (
                        <span className={`match-score ${
                          claim.matchScore >= 66 ? 'match-high'
                          : claim.matchScore >= 33 ? 'match-mid'
                          : 'match-low'
                        }`}>
                          {claim.matchScore}% match
                        </span>
                      )}
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.border}`
                      }}>
                        {claim.status}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="claim-card-body">
                    {/* Proof */}
                    <div style={{
                      padding: '12px',
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '10px', fontWeight: '600',
                        color: 'var(--text3)', textTransform: 'uppercase',
                        letterSpacing: '0.5px', marginBottom: '6px'
                      }}>
                        Their proof
                      </div>
                      <p style={{fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6}}>
                        {claim.proofDescription}
                      </p>
                    </div>

                    {/* Proof image */}
                    {claim.proofImage && (
                      <div style={{marginBottom: '12px'}}>
                        <img
                          src={claim.proofImage}
                          alt="Proof"
                          style={{
                            width: '100px', height: '100px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)'
                          }}
                        />
                      </div>
                    )}

                    {/* Compare secrets */}
                    {item.secretDetails && (
                      <div style={{
                        padding: '12px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 'var(--radius)',
                        marginBottom: '14px'
                      }}>
                        <div style={{
                          fontSize: '10px', fontWeight: '700',
                          color: '#ca8a04', textTransform: 'uppercase',
                          letterSpacing: '0.5px', marginBottom: '8px',
                          display: 'flex', alignItems: 'center', gap: '5px'
                        }}>
                          <Lock size={10} />
                          Compare with your secret details
                        </div>
                        {item.secretDetails.primary && (
                          <p style={{fontSize: '12px', color: '#92400e', marginBottom: '3px'}}>
                            <strong>1.</strong> {item.secretDetails.primary}
                          </p>
                        )}
                        {item.secretDetails.secondary && (
                          <p style={{fontSize: '12px', color: '#92400e', marginBottom: '3px'}}>
                            <strong>2.</strong> {item.secretDetails.secondary}
                          </p>
                        )}
                        {item.secretDetails.tertiary && (
                          <p style={{fontSize: '12px', color: '#92400e'}}>
                            <strong>3.</strong> {item.secretDetails.tertiary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {claim.status === 'pending' && (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button
                          onClick={() => handleClaimAction(claim._id, 'accept')}
                          className="btn btn-success"
                          style={{padding: '7px 16px'}}
                        >
                          <CheckCircle size={13} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleClaimAction(claim._id, 'reject')}
                          className="btn btn-danger"
                          style={{padding: '7px 16px'}}
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}