import { useState, useEffect } from 'react';
import {
  Users, Package, ClipboardText,
  ChartBar, Flag, Trash,
  LockOpen, Lock, ArrowClockwise
} from '@phosphor-icons/react';
import api from '../utils/axios';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: ChartBar },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'items', label: 'Items', icon: Package },
  { key: 'claims', label: 'Claims', icon: ClipboardText },
];

const badgeClass = {
  lost: 'badge-lost', found: 'badge-found',
  claimed: 'badge-claimed', resolved: 'badge-resolved'
};

const claimStatusStyle = {
  pending: { bg: '#fffbeb', color: '#ca8a04' },
  accepted: { bg: '#f0fdf4', color: '#16a34a' },
  rejected: { bg: '#fef2f2', color: '#dc2626' }
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, u, i, c] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/items'),
        api.get('/admin/claims'),
      ]);
      setStats(s.data);
      setUsers(u.data.users);
      setItems(i.data.items);
      setClaims(c.data.claims);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBlockUser = async (id) => {
    const res = await api.patch(`/admin/users/${id}/block`);
    setUsers(u => u.map(x => x._id === id ? { ...x, isBlocked: res.data.isBlocked } : x));
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(u => u.filter(x => x._id !== id));
  };

  const handleFlagItem = async (id) => {
    const res = await api.patch(`/admin/items/${id}/flag`);
    setItems(i => i.map(x => x._id === id ? { ...x, isFlagged: res.data.isFlagged } : x));
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    await api.delete(`/admin/items/${id}`);
    setItems(i => i.filter(x => x._id !== id));
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredItems = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = stats ? [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Total items', value: stats.totalItems },
    { label: 'Lost', value: stats.lostItems },
    { label: 'Found', value: stats.foundItems },
    { label: 'Claimed', value: stats.claimedItems },
    { label: 'Resolved', value: stats.resolvedItems },
    { label: 'Total claims', value: stats.totalClaims },
    { label: 'Success rate', value: `${stats.successRate}%` },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '24px 24px 0'
      }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: '28px', fontWeight: '400',
                color: 'var(--text)', letterSpacing: '-0.5px',
                marginBottom: '4px'
              }}>
                Admin
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                Manage users, items and claims
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowClockwise size={13} />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.key); setSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="wrap" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)', gap: '12px'
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: '80px' }} className="skeleton" />
            ))}
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Stat cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,1fr)',
                  gap: '12px',
                  marginBottom: '32px'
                }}>
                  {statCards.map(c => (
                    <div key={c.label} className="stat-card">
                      <div className="stat-card-value">{c.value}</div>
                      <div className="stat-card-label">{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  {/* Recent users */}
                  <div className="card">
                    <div className="card-header">Recent users</div>
                    <div>
                      {users.slice(0, 5).map(u => (
                        <div key={u._id} style={{
                          display: 'flex', alignItems: 'center',
                          gap: '10px', padding: '12px 16px',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <div className="avatar avatar-sm">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px', fontWeight: '600',
                              color: 'var(--text)',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {u.name}
                            </div>
                            <div style={{
                              fontSize: '11px', color: 'var(--text3)',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {u.email}
                            </div>
                          </div>
                          {u.isBlocked && (
                            <span style={{
                              padding: '1px 6px', borderRadius: '3px',
                              fontSize: '10px', fontWeight: '600',
                              background: '#fef2f2', color: '#dc2626',
                              flexShrink: 0
                            }}>
                              Blocked
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent items */}
                  <div className="card">
                    <div className="card-header">Recent items</div>
                    <div>
                      {items.slice(0, 5).map(item => (
                        <div key={item._id} style={{
                          display: 'flex', alignItems: 'center',
                          gap: '10px', padding: '12px 16px',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <div style={{
                            width: '32px', height: '32px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg2)',
                            overflow: 'hidden', flexShrink: 0,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Package size={14} weight="thin" color="var(--border2)" />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12px', fontWeight: '600',
                              color: 'var(--text)',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                              {item.postedBy?.name}
                            </div>
                          </div>
                          <span
                            className={`badge ${badgeClass[item.status]}`}
                            style={{ position: 'static', fontSize: '9px', flexShrink: 0 }}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Flagged items */}
                {items.filter(i => i.isFlagged).length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      fontSize: '12px', fontWeight: '600',
                      color: '#dc2626', marginBottom: '10px'
                    }}>
                      Flagged items ({items.filter(i => i.isFlagged).length})
                    </div>
                    <div style={{
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden'
                    }}>
                      {items.filter(i => i.isFlagged).map(item => (
                        <div key={item._id} style={{
                          display: 'flex', alignItems: 'center',
                          gap: '12px', padding: '12px 14px',
                          borderBottom: '1px solid #fecaca',
                          background: '#fef2f2'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                              by {item.postedBy?.name}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleFlagItem(item._id)}
                              className="btn btn-ghost btn-sm"
                            >
                              Unflag
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="btn btn-danger btn-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="form-input"
                  style={{ maxWidth: '360px', marginBottom: '20px' }}
                />
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Phone</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="avatar avatar-sm">
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{
                                    fontSize: '13px', fontWeight: '600', color: 'var(--text)'
                                  }}>
                                    {u.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>{u.phone}</td>
                            <td>
                              {new Date(u.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: '3px',
                                fontSize: '10px', fontWeight: '600',
                                textTransform: 'uppercase',
                                background: u.isBlocked ? '#fef2f2' : '#f0fdf4',
                                color: u.isBlocked ? '#dc2626' : '#16a34a'
                              }}>
                                {u.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleBlockUser(u._id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                                >
                                  {u.isBlocked
                                    ? <><LockOpen size={12} /> Unblock</>
                                    : <><Lock size={12} /> Block</>
                                  }
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                      <div style={{
                        textAlign: 'center', padding: '40px',
                        color: 'var(--text3)', fontSize: '13px'
                      }}>
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            {activeTab === 'items' && (
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search items by title..."
                  className="form-input"
                  style={{ maxWidth: '360px', marginBottom: '20px' }}
                />
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Posted by</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map(item => (
                          <tr
                            key={item._id}
                            style={{ background: item.isFlagged ? '#fffbeb' : 'transparent' }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px',
                                  borderRadius: 'var(--radius)',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg2)',
                                  overflow: 'hidden', flexShrink: 0,
                                  display: 'flex', alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {item.images?.[0] ? (
                                    <img
                                      src={item.images[0]}
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <Package size={14} weight="thin" color="var(--border2)" />
                                  )}
                                </div>
                                <div>
                                  <div style={{
                                    fontSize: '13px', fontWeight: '600',
                                    color: 'var(--text)', maxWidth: '160px',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.title}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                    {item.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '13px' }}>{item.postedBy?.name}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span
                                  className={`badge ${badgeClass[item.status]}`}
                                  style={{ position: 'static', fontSize: '9px' }}
                                >
                                  {item.status}
                                </span>
                                {item.isFlagged && (
                                  <span style={{
                                    padding: '1px 6px', borderRadius: '3px',
                                    fontSize: '9px', fontWeight: '600',
                                    background: '#fffbeb', color: '#ca8a04'
                                  }}>
                                    Flagged
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short'
                              })}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleFlagItem(item._id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Flag size={12} />
                                  {item.isFlagged ? 'Unflag' : 'Flag'}
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                      <div style={{
                        textAlign: 'center', padding: '40px',
                        color: 'var(--text3)', fontSize: '13px'
                      }}>
                        No items found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Claims */}
            {activeTab === 'claims' && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Claimed by</th>
                        <th>Proof</th>
                        <th>Match</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map(claim => {
                        const s = claimStatusStyle[claim.status];
                        return (
                          <tr key={claim._id}>
                            <td>
                              <div style={{
                                fontSize: '13px', fontWeight: '600',
                                color: 'var(--text)', maxWidth: '140px',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {claim.item?.title}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                {claim.item?.category}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                                {claim.claimedBy?.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                {claim.claimedBy?.email}
                              </div>
                            </td>
                            <td style={{ maxWidth: '180px' }}>
                              <p style={{
                                fontSize: '12px', color: 'var(--text2)',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {claim.proofDescription}
                              </p>
                            </td>
                            <td>
                              {claim.matchScore !== undefined && (
                                <span style={{
                                  fontSize: '12px', fontWeight: '600',
                                  color: claim.matchScore >= 66 ? '#16a34a'
                                    : claim.matchScore >= 33 ? '#ca8a04'
                                    : '#dc2626'
                                }}>
                                  {claim.matchScore}%
                                </span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: '3px',
                                fontSize: '10px', fontWeight: '600',
                                textTransform: 'uppercase',
                                background: s.bg, color: s.color
                              }}>
                                {claim.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                              {new Date(claim.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {claims.length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '40px',
                      color: 'var(--text3)', fontSize: '13px'
                    }}>
                      No claims yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}