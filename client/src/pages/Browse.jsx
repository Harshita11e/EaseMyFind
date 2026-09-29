import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall, Package, FunnelSimple, MagnifyingGlass
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

export default function Browse() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    status: '',
    sort: 'newest',
    startDate: '',
    endDate: '',
    page: 1
  });

  useEffect(() => { fetchItems(); }, [filters, search]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page);
      params.append('limit', 12);
      const res = await api.get(`/items?${params}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const setFilter = (key, value) =>
    setFilters(f => ({ ...f, [key]: value, page: 1 }));

  const clearFilters = () => {
    setSearch('');
    setFilters({ category: '', status: '', sort: 'newest', startDate: '', endDate: '', page: 1 });
  };

  const hasFilters = search || filters.category || filters.status || filters.startDate || filters.endDate;

  return (
    <div style={{minHeight: '100vh', background: 'var(--bg)'}}>

      {/* Header */}
      <div className="browse-header">
        <div style={{maxWidth: '1120px', margin: '0 auto'}}>
          <div className="browse-title">Browse</div>
          <div className="browse-count">
            {loading ? 'Loading...' : `${total} item${total !== 1 ? 's' : ''} found`}
          </div>

          {/* Search row */}
          <div style={{display: 'flex', gap: '8px', maxWidth: '640px'}}>
            <div className="search-bar" style={{flex: 1}}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setFilter('page', 1)}
                placeholder="Search items..."
              />
              <button onClick={() => setFilter('page', 1)}>Search</button>
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`btn ${filtersOpen ? 'btn-black' : 'btn-ghost'}`}
              style={{display: 'flex', alignItems: 'center', gap: '6px'}}
            >
              <FunnelSimple size={14} />
              Filters
              {hasFilters && (
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: filtersOpen ? 'var(--bg)' : 'var(--black)',
                  flexShrink: 0
                }} />
              )}
            </button>
          </div>

          {/* Filters panel */}
          {filtersOpen && (
            <div style={{
              marginTop: '12px',
              padding: '16px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              maxWidth: '640px'
            }}>
              <div>
                <div className="form-label">Status</div>
                <select
                  value={filters.status}
                  onChange={e => setFilter('status', e.target.value)}
                  className="filter-select"
                  style={{width: '100%'}}
                >
                  <option value="">All status</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                  <option value="claimed">Claimed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <div className="form-label">Sort by</div>
                <select
                  value={filters.sort}
                  onChange={e => setFilter('sort', e.target.value)}
                  className="filter-select"
                  style={{width: '100%'}}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="date">By date lost/found</option>
                </select>
              </div>
              <div>
                <div className="form-label">From date</div>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilter('startDate', e.target.value)}
                  className="filter-select"
                  style={{width: '100%'}}
                />
              </div>
              <div>
                <div className="form-label">To date</div>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilter('endDate', e.target.value)}
                  className="filter-select"
                  style={{width: '100%'}}
                />
              </div>
              {hasFilters && (
                <div style={{gridColumn: '1/-1'}}>
                  <button
                    onClick={clearFilters}
                    style={{
                      fontSize: '12px', color: '#dc2626',
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      fontWeight: '500'
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="wrap" style={{paddingTop: '32px', paddingBottom: '48px'}}>

        {/* Category pills */}
        <div className="cats" style={{marginBottom: '20px'}}>
          <button
            className={`cat ${!filters.category ? 'active' : ''}`}
            onClick={() => setFilter('category', '')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`cat ${filters.category === cat.name ? 'active' : ''}`}
              onClick={() => setFilter('category', filters.category === cat.name ? '' : cat.name)}
            >
              <cat.icon size={13} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="cards-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{height: '220px'}} className="skeleton" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="cards-grid">
              {items.map(item => <ItemCard key={item._id} item={item} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'center', gap: '4px', marginTop: '40px'
              }}>
                <button
                  onClick={() => setFilter('page', filters.page - 1)}
                  disabled={filters.page === 1}
                  className="btn btn-ghost btn-sm"
                  style={{opacity: filters.page === 1 ? 0.4 : 1}}
                >
                  ← Previous
                </button>
                {[...Array(Math.min(pages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setFilter('page', p)}
                      style={{
                        width: '32px', height: '32px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        background: filters.page === p ? 'var(--black)' : 'var(--bg)',
                        color: filters.page === p ? 'var(--bg)' : 'var(--text2)',
                        fontSize: '13px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setFilter('page', filters.page + 1)}
                  disabled={filters.page === pages}
                  className="btn btn-ghost btn-sm"
                  style={{opacity: filters.page === pages ? 0.4 : 1}}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--text3)'
          }}>
            <MagnifyingGlass
              size={40} weight="thin"
              style={{margin: '0 auto 12px', display: 'block', opacity: 0.3}}
            />
            <p style={{fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '4px'}}>
              No items found
            </p>
            <p style={{fontSize: '13px', marginBottom: '20px'}}>
              Try adjusting your search or filters
            </p>
            <button onClick={clearFilters} className="btn btn-black btn-sm">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}