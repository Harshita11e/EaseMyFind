import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Package, Bell, ClipboardText,
  CheckCircle, XCircle, Clock,
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall
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
  pending: { bg: '#fffbeb', color: '#ca8a04' },
  accepted: { bg: '#f0fdf4', color: '#16a34a' },
  rejected: { bg: '#fef2f2', color: '#dc2626' }
};

const notifIconMap = {
  new_claim: ClipboardText,
  claim_accepted: CheckCircle,
  claim_rejected: XCircle,
  item_resolved: CheckCircle
};

export default function Dashboard() {
  const { user } = useSelector(s => s.auth);
  const [activeTab, setActiveTab] = useState('items');
  const [myItems, setMyItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/items/user/my-items'),
      api.get('/claims/my-claims'),
      api.get('/notifications')
    ]).then(([items, claims, notifs]) => {
      setMyItems(items.data);
      setMyClaims(claims.data);
      setNotifications(notifs.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  const stats = [
    {
      label: 'My posts',
      value: myItems.length,
    },
    {
      label: 'Lost',
      value: myItems.filter(i => i.status === 'lost').length,
    },
    {
      label: 'Found',
      value: myItems.filter(i => i.status === 'found').length,
    },
    {
      label: 'Resolved',
      value: myItems.filter(i => i.status === 'resolved').length,
    },
  ];

  const tabs = [
    { key: 'items', label: 'My posts', count: myItems.length },
    { key: 'claims', label: 'My claims', count: myClaims.length },
    { key: 'notifications', label: 'Notifications', count: unread },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div className="dashboard-header">
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar avatar-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="dashboard-title">
                  {user?.name?.split(' ')[0]}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <Link to="/post-item" className="btn btn-black btn-sm">
              + Post item
            </Link>
          </div>

          {/* Stat cards */}
          <div className="stat-cards">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
          <div className="tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="tab-count">{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="wrap" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '180px' }} className="skeleton" />
            ))}
          </div>
        ) : (
          <>
            {/* My Items */}
            {activeTab === 'items' && (
              myItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text3)' }}>
                  <Package
                    size={40} weight="thin"
                    style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}
                  />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '4px' }}>
                    No posts yet
                  </p>
                  <p style={{ fontSize: '13px', marginBottom: '20px' }}>
                    Start by reporting a lost or found item
                  </p>
                  <Link to="/post-item" className="btn btn-black btn-sm">
                    + Post item
                  </Link>
                </div>
              ) : (
                <div className="cards-grid">
                  {myItems.map(item => {
                    const Icon = categoryIcons[item.category] || Package;
                    return (
                      <Link key={item._id} to={`/items/${item._id}`} className="item-card">
                        <div className="item-card-image">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.title} />
                          ) : (
                            <div className="item-card-icon">
                              <Icon size={48} weight="thin" />
                            </div>
                          )}
                          <span className={`badge ${badgeClass[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="item-card-body">
                          <div className="item-card-title">{item.title}</div>
                          <div className="item-card-desc">{item.category}</div>
                          <div className="item-card-foot">
                            <span>{item.location?.address?.split(',')[0]}</span>
                            <span>
                              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short'
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}

            {/* My Claims */}
            {activeTab === 'claims' && (
              myClaims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text3)' }}>
                  <ClipboardText
                    size={40} weight="thin"
                    style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}
                  />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '4px' }}>
                    No claims yet
                  </p>
                  <p style={{ fontSize: '13px', marginBottom: '20px' }}>
                    Browse found items and submit a claim if you find yours
                  </p>
                  <Link to="/browse" className="btn btn-black btn-sm">
                    Browse items
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {myClaims.map(claim => {
                    const s = claimStatusStyle[claim.status];
                    return (
                      <div
                        key={claim._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '14px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          background: 'var(--bg)',
                          transition: 'border-color 0.1s'
                        }}
                      >
                        {/* Item image */}
                        <div style={{
                          width: '48px', height: '48px',
                          borderRadius: 'var(--radius)',
                          overflow: 'hidden',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {claim.item?.images?.[0] ? (
                            <img
                              src={claim.item.images[0]}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Package size={20} weight="thin" color="var(--border2)" />
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px', fontWeight: '600',
                            color: 'var(--text)', marginBottom: '2px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {claim.item?.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            {claim.item?.category}
                          </div>
                          <div style={{
                            fontSize: '11px', color: 'var(--text3)', marginTop: '4px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            Proof: {claim.proofDescription}
                          </div>
                        </div>

                        {/* Status + date */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px', borderRadius: '3px',
                            fontSize: '10px', fontWeight: '600',
                            textTransform: 'uppercase', letterSpacing: '0.3px',
                            background: s.bg, color: s.color,
                            marginBottom: '6px'
                          }}>
                            {claim.status}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            {new Date(claim.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short'
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text3)' }}>
                  <Bell
                    size={40} weight="thin"
                    style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}
                  />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '4px' }}>
                    No notifications
                  </p>
                  <p style={{ fontSize: '13px' }}>
                    You'll be notified about claims and updates here
                  </p>
                </div>
              ) : (
                <div>
                  {unread > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '16px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                        {unread} unread
                      </span>
                      <button
                        onClick={markAllRead}
                        style={{
                          fontSize: '12px', color: 'var(--text2)',
                          background: 'none', border: 'none',
                          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          fontWeight: '500'
                        }}
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                  <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    background: 'var(--bg)'
                  }}>
                    {notifications.map(n => {
                      const NotifIcon = notifIconMap[n.type] || Bell;
                      return (
                        <div
                          key={n._id}
                          className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                        >
                          <div className="notif-icon">
                            <NotifIcon size={16} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              fontSize: '13px', color: 'var(--text)',
                              marginBottom: '3px', lineHeight: 1.5
                            }}>
                              {n.message}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text3)' }}>
                              {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {!n.isRead && <div className="unread-dot" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}