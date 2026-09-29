import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, MagnifyingGlass, MapPin,
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall, Package
} from '@phosphor-icons/react';
import api from '../utils/axios';
import ItemCard from '../components/ItemCard';

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

export default function Home() {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/items?limit=6&sort=newest')
      .then(res => setRecentItems(res.data.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length > 1) {
        try {
          const res = await api.get(`/items/suggestions?q=${search}`);
          setSuggestions(res.data);
        } catch { setSuggestions([]); }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${search}`);
  };

  const badgeClass = {
    lost: 'badge-lost', found: 'badge-found',
    claimed: 'badge-claimed', resolved: 'badge-resolved'
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="live-dot"></span>
          Lost & Found · India
        </div>
        <h1 className="hero-title">
          Lost something?<br />
          <em>We'll help find it.</em>
        </h1>
        <p className="hero-sub">
          A simple, private, and secure way to report lost or found items and reconnect with your community.
        </p>

        {/* Search */}
        <div style={{position: 'relative', maxWidth: '480px', margin: '0 auto 20px'}}>
          <form onSubmit={handleSearch}>
            <div className="search-bar">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search wallet, phone, keys, documents..."
              />
              <button type="submit">Search</button>
            </div>
          </form>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)',
              left: 0, right: 0,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden', zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}>
              {suggestions.map(item => (
                <button
                  key={item._id}
                  onClick={() => {
                    setSearch(item.title);
                    setSuggestions([]);
                    navigate(`/browse?search=${item.title}`);
                  }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontFamily: 'Inter, sans-serif',
                    borderBottom: '1px solid var(--border)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    padding: '1px 6px', borderRadius: '3px',
                    fontSize: '10px', fontWeight: '600',
                    textTransform: 'uppercase'
                  }} className={badgeClass[item.status]}>
                    {item.status}
                  </span>
                  <span style={{fontSize: '13px', color: 'var(--text)', flex: 1}}>
                    {item.title}
                  </span>
                  <span style={{fontSize: '11px', color: 'var(--text3)'}}>
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div style={{display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link to="/post-item" className="btn btn-black">
            Report lost item
          </Link>
          <Link to="/browse" className="btn btn-ghost">
            Browse found items
          </Link>
        </div>
      </div>

      {/* Feature strip */}
      <div className="features">
        <div className="feature">
          <div className="feature-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="feature-title">Secret verification</div>
            <div className="feature-desc">
              Up to 3 hidden details only the real owner knows. Auto keyword match scoring on every claim.
            </div>
          </div>
        </div>
        <div className="feature">
          <div className="feature-icon">
            <MagnifyingGlass size={18} />
          </div>
          <div>
            <div className="feature-title">Fuzzy search</div>
            <div className="feature-desc">
              Typo-tolerant matching powered by MongoDB Atlas Search. "walet" still finds "wallet".
            </div>
          </div>
        </div>
        <div className="feature">
          <div className="feature-icon">
            <MapPin size={18} />
          </div>
          <div>
            <div className="feature-title">Map view</div>
            <div className="feature-desc">
              See all items on an interactive map. Filter by status and click any pin to view the listing.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="wrap">
        <div className="section">
          <div className="sec-hd">
            <span className="sec-title">Recent reports</span>
            <Link to="/browse" className="sec-link">View all →</Link>
          </div>

          {/* Category filter */}
          <div className="cats" style={{marginBottom: '16px'}}>
            <button
              className={`cat ${activeCategory === '' ? 'active' : ''}`}
              onClick={() => setActiveCategory('')}
            >
              All items
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                className={`cat ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.name);
                  navigate(`/browse?category=${cat.name}`);
                }}
              >
                <cat.icon size={13} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items */}
          {loading ? (
            <div className="cards-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{height: '220px'}} className="skeleton" />
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="cards-grid">
              {recentItems.map(item => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '64px 0',
              color: 'var(--text3)'
            }}>
              <Package size={40} style={{margin: '0 auto 12px', display: 'block', opacity: 0.3}} />
              <p style={{fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '4px'}}>
                No items posted yet
              </p>
              <p style={{fontSize: '13px'}}>Be the first to report a lost or found item</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="section">
          <div className="sec-hd">
            <span className="sec-title">How it works</span>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">Step 01</div>
              <div className="step-title">Post your item</div>
              <div className="step-desc">
                Report lost or found with photos, location, and up to 3 secret details only the real owner would know.
              </div>
            </div>
            <div className="step">
              <div className="step-num">Step 02</div>
              <div className="step-title">Search and match</div>
              <div className="step-desc">
                Fuzzy search connects lost reports with found items nearby. Handles typos and partial matches automatically.
              </div>
            </div>
            <div className="step">
              <div className="step-num">Step 03</div>
              <div className="step-title">Recover safely</div>
              <div className="step-desc">
                Verify ownership with secret details. Contact info only revealed after both sides agree to connect.
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{padding: '40px 0'}}>
          <div className="cta-box">
            <div>
              <div className="cta-title">Ready to find what you lost?</div>
              <div className="cta-desc">
                Free to use. No hidden charges. Join your community and help someone recover what matters.
              </div>
            </div>
            <div className="cta-btns">
              <Link to="/register" className="btn btn-black">Create account</Link>
              <Link to="/browse" className="btn btn-ghost">Browse items</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}