import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Plus, Sprout, Wifi, WifiOff, Grid, List, Filter, Star, Package, Search, X } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useMarketplaceUpdates } from '../hooks/useWebSocket.js';
import { etb, num } from '../utils.js';
import { CropThumb } from '../components/ui.jsx';

const PER_PAGE = 8;
const PRICE_STEPS = [['', 'Any price'], ['2000', 'Up to 2,000'], ['4000', 'Up to 4,000'], ['8000', 'Up to 8,000'], ['15000', 'Up to 15,000']];

export default function Marketplace() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [regions, setRegions] = useState([]);
  const [fl, setFl] = useState({ search: sp.get('search') || '', region_id: '', crop_id: '', max_price: '', sort: 'newest' });
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [newListingAlert, setNewListingAlert] = useState(null);

  // WebSocket real-time listing updates
  const handleNewListing = useCallback((listing) => {
    console.log('🆕 New listing:', listing);
    
    // Show alert
    setNewListingAlert(listing);
    setTimeout(() => setNewListingAlert(null), 5000);
    
    // Show notification
    if (Notification.permission === 'granted') {
      new Notification('New Listing Available', {
        body: `${listing.crop} - ${listing.quantity} ${listing.unit} at ${listing.price} ETB`,
        icon: '/favicon.ico'
      });
    }
    
    // Reload listings
    const qs = new URLSearchParams(Object.entries(fl).filter(([, v]) => v));
    api.get('/listings?' + qs).then(setItems);
  }, [fl]);

  const { isConnected } = useMarketplaceUpdates(
    { regionId: fl.region_id, cropId: fl.crop_id },
    handleNewListing
  );

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/regions')]).then(([c, r]) => { setCrops(c); setRegions(r); });
  }, []);

  // pick up searches made from the top bar
  useEffect(() => { setFl(f => ({ ...f, search: sp.get('search') || '' })); }, [sp]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(fl).filter(([, v]) => v));
      api.get('/listings?' + qs).then(d => { 
        // Apply client-side sorting
        let sorted = [...d];
        if (fl.sort === 'price-low') sorted.sort((a, b) => a.price_per_unit - b.price_per_unit);
        else if (fl.sort === 'price-high') sorted.sort((a, b) => b.price_per_unit - a.price_per_unit);
        else if (fl.sort === 'newest') sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setItems(sorted); 
        setPage(1); 
      }).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [fl]);

  const set = k => e => setFl({ ...fl, [k]: e.target.value });
  const clear = () => setFl({ search: '', region_id: '', crop_id: '', max_price: '', sort: 'newest' });
  const hasFilters = fl.region_id || fl.crop_id || fl.max_price || fl.search;
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const shown = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={32} style={{ color: 'var(--g700)' }} />
            Marketplace
            {isConnected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: 'var(--g700)', background: 'var(--g100)', padding: '4px 10px', borderRadius: '20px' }}>
                <Wifi size={14} />
                Live
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: 'var(--muted)', background: '#F3F4F6', padding: '4px 10px', borderRadius: '20px' }}>
                <WifiOff size={14} />
                Offline
              </span>
            )}
          </h1>
          <p className="muted">Discover quality agricultural produce from trusted farmers across Ethiopia</p>
        </div>
        {user.role === 'farmer' && (
          <Link to="/listings/new" className="btn primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Sell Produce
          </Link>
        )}
      </div>

      {/* Stats Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600', marginBottom: '4px' }}>Total Listings</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--g700)' }}>{items.length}</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--line)' }}></div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600', marginBottom: '4px' }}>Showing</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{shown.length} of {items.length}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Filter size={14} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <div style={{ display: 'flex', gap: '4px', border: '1px solid var(--line)', borderRadius: '8px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--g700)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--ink)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--g700)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--ink)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* New Listing Alert */}
      {newListingAlert && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', 
          border: '2px solid var(--g700)', 
          padding: '14px 16px', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideDown 0.3s ease'
        }}>
          <Sprout size={24} style={{ color: 'var(--g700)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--g900)', fontSize: '14px' }}>🆕 New Listing Available!</strong>
            <p style={{ color: 'var(--g700)', fontSize: '13px', marginTop: '2px' }}>
              {newListingAlert.crop} - {newListingAlert.quantity} {newListingAlert.unit} at {newListingAlert.price} ETB from {newListingAlert.region}
            </p>
          </div>
          <button
            onClick={() => setNewListingAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} style={{ color: 'var(--g700)' }} />
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card filters" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}>
          <div className="field">
            <label>Search Products</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input 
                value={fl.search} 
                onChange={set('search')} 
                placeholder="Search crops, farmers..." 
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>
          <div className="field">
            <label>Region</label>
            <select value={fl.region_id} onChange={set('region_id')}>
              <option value="">All regions</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Crop Type</label>
            <select value={fl.crop_id} onChange={set('crop_id')}>
              <option value="">All crops</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Max Price</label>
            <select value={fl.max_price} onChange={set('max_price')}>
              {PRICE_STEPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Sort By</label>
            <select value={fl.sort} onChange={set('sort')}>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          {hasFilters && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn" onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={14} />
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--g700)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p className="muted">Loading fresh listings...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="card empty" style={{ marginTop: 18, padding: '64px 20px', textAlign: 'center' }}>
          <Package size={64} style={{ color: 'var(--muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No listings found</h3>
          <p className="muted" style={{ marginBottom: '16px' }}>Try adjusting your filters or check back later for new listings.</p>
          {hasFilters && (
            <button className="btn primary" onClick={clear}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && items.length > 0 && viewMode === 'grid' && (
        <div className="listing-grid">
          {shown.map(l => (
            <article key={l.id} className="listing-card" style={{ position: 'relative' }}>
              {l.featured && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#FFD700',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}>
                  <Star size={12} fill="#000" />
                  Featured
                </div>
              )}
              <CropThumb src={l.image_urls?.[0]} name={l.crop} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginTop: '8px' }}>{l.crop}</h3>
              <span className="loc" style={{ fontSize: '13px' }}>
                <MapPin size={13} /> {l.region}{l.location_detail ? `, ${l.location_detail}` : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span className="muted" style={{ fontSize: '13px' }}>{num(l.quantity)} {l.unit}</span>
                {l.farmer_verified && (
                  <span style={{ 
                    background: 'var(--g100)', 
                    color: 'var(--g700)', 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              <span className="price-line" style={{ fontSize: '18px', marginTop: '12px' }}>
                {etb(l.price_per_unit)} <span style={{ fontSize: '13px', fontWeight: '600' }}>/ {l.unit}</span>
              </span>
              <Link className="btn primary block" to={`/marketplace/${l.id}`} style={{ marginTop: '12px' }}>
                View Details
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && items.length > 0 && viewMode === 'list' && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Farmer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="cell">
                        <CropThumb small src={l.image_urls?.[0]} name={l.crop} />
                        <span style={{ fontWeight: '700' }}>{l.crop}</span>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: '600' }}>{num(l.quantity)} {l.unit}</span></td>
                    <td><span style={{ fontWeight: '800', color: 'var(--g700)', fontSize: '15px' }}>{etb(l.price_per_unit)}</span><span className="muted">/{l.unit}</span></td>
                    <td><span className="muted">{l.region}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>{l.farmer_name}</span>
                        {l.farmer_verified && <span style={{ color: 'var(--g700)' }}>✓</span>}
                      </div>
                    </td>
                    <td>
                      <Link to={`/marketplace/${l.id}`} className="btn" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pager" style={{ marginTop: '24px' }}>
          {Array.from({ length: pages }, (_, i) => (
            <button 
              key={i} 
              className={page === i + 1 ? 'on' : ''} 
              onClick={() => setPage(i + 1)}
              style={{ fontWeight: page === i + 1 ? '700' : '400' }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Banner */}
      <div className="banner" style={{ marginTop: '32px', background: 'linear-gradient(135deg, var(--g100), var(--g50))' }}>
        <div className="ico" style={{ background: 'var(--g700)', color: 'white' }}>
          <Sprout size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: '16px', color: 'var(--g900)' }}>Support Ethiopian Farmers</b>
          <p className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Buy local · Build stronger communities · Grow together
          </p>
        </div>
        {user.role === 'farmer' && (
          <Link to="/listings/new" className="btn primary">
            Start Selling
          </Link>
        )}
      </div>
    </>
  );
}