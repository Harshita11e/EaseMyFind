import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  DeviceMobile, FileText, Key, Handbag,
  PawPrint, Diamond, TShirt, BookOpen,
  SoccerBall, Package
} from '@phosphor-icons/react';
import api from '../utils/axios';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Clean minimal circle markers
const createMarker = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width: 12px; height: 12px;
    background: ${color};
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8]
});

const markers = {
  lost: createMarker('#dc2626'),
  found: createMarker('#16a34a'),
  claimed: createMarker('#ca8a04'),
  resolved: createMarker('#9ca3af'),
};

// CartoDB Positron tiles — clean minimal map
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'resolved', label: 'Resolved' },
];

const statusColors = {
  lost: '#dc2626',
  found: '#16a34a',
  claimed: '#ca8a04',
  resolved: '#9ca3af',
};

const categoryIcons = {
  'Electronics': DeviceMobile, 'Documents': FileText,
  'Keys': Key, 'Bags & Wallets': Handbag,
  'Pets': PawPrint, 'Jewellery': Diamond,
  'Clothes': TShirt, 'Books': BookOpen,
  'Sports': SoccerBall, 'Other': Package
};

// Tile switcher for dark mode
function TileSwitcher({ isDark }) {
  const map = useMap();
  useEffect(() => {
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
  }, [isDark]);
  return null;
}

export default function MapView() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/items/map')
      .then(res => { setItems(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFiltered(statusFilter ? items.filter(i => i.status === statusFilter) : items);
  }, [statusFilter, items]);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const badgeClass = {
    lost: 'badge-lost', found: 'badge-found',
    claimed: 'badge-claimed', resolved: 'badge-resolved'
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
            Map view
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '8px' }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`cat ${statusFilter === f.value ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                {f.value && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: statusFilter === f.value
                      ? 'var(--bg)'
                      : statusColors[f.value],
                    flexShrink: 0,
                    display: 'inline-block'
                  }} />
                )}
                {f.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', color: 'var(--text3)'
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: color, display: 'inline-block'
                }} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="map-layout" style={{ flex: 1 }}>

        {/* Sidebar */}
        <div className="map-sidebar">
          <div className="map-sidebar-header">
            Items ({filtered.length})
          </div>
          <div className="map-sidebar-list">
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                color: 'var(--text3)'
              }}>
                <Package
                  size={32} weight="thin"
                  style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }}
                />
                <p style={{ fontSize: '12px' }}>No items to show</p>
              </div>
            ) : (
              filtered.map(item => {
                const Icon = categoryIcons[item.category] || Package;
                return (
                  <button
                    key={item._id}
                    onClick={() => navigate(`/items/${item._id}`)}
                    className={`map-item ${selectedItem?._id === item._id ? 'selected' : ''}`}
                  >
                    {/* Icon or image */}
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg2)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Icon size={16} weight="thin" color="var(--border2)" />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{
                        fontSize: '12px', fontWeight: '600',
                        color: 'var(--text)', marginBottom: '2px',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {item.category}
                      </div>
                    </div>

                    {/* Status dot */}
                    <span style={{
                      width: '7px', height: '7px',
                      borderRadius: '50%',
                      background: statusColors[item.status],
                      flexShrink: 0
                    }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading ? (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg2)'
            }}>
              <div className="spinner" />
            </div>
          ) : (
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution={ATTRIBUTION}
                url={isDark ? DARK_TILES : LIGHT_TILES}
                subdomains="abcd"
                maxZoom={20}
              />
              <TileSwitcher isDark={isDark} />

              {filtered.map(item => (
                item.location?.lat && item.location?.lng && (
                  <Marker
                    key={item._id}
                    position={[item.location.lat, item.location.lng]}
                    icon={markers[item.status] || markers.lost}
                    eventHandlers={{
                      click: () => setSelectedItem(item)
                    }}
                  >
                    <Popup className="clean-popup">
                      <div style={{
                        width: '200px',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {/* Image */}
                        {item.images?.[0] && (
                          <div style={{
                            height: '110px',
                            overflow: 'hidden',
                            borderBottom: '1px solid #e8e8e8'
                          }}>
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ padding: '12px' }}>
                          <div style={{ marginBottom: '6px' }}>
                            <span
                              className={`badge ${badgeClass[item.status]}`}
                              style={{ position: 'static', fontSize: '9px' }}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '13px', fontWeight: '600',
                            color: '#0a0a0a', marginBottom: '2px',
                            lineHeight: 1.3
                          }}>
                            {item.title}
                          </div>
                          <div style={{
                            fontSize: '11px', color: '#888',
                            marginBottom: '10px'
                          }}>
                            {item.category}
                          </div>
                          <button
                            onClick={() => navigate(`/items/${item._id}`)}
                            style={{
                              width: '100%', padding: '7px',
                              background: '#000', color: '#fff',
                              border: 'none', borderRadius: '4px',
                              fontSize: '12px', fontWeight: '500',
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            View details →
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}