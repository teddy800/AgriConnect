import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Plus, Sprout, Wifi, WifiOff } from 'lucide-react';
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
  const [fl, setFl] = useState({ search: sp.get('search') || '', region_id: '', crop_id: '', max_price: '' });
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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
      api.get('/listings?' + qs).then(d => { setItems(d); setPage(1); }).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [fl]);

  const set = k => e => setFl({ ...fl, [k]: e.target.value });
  const clear = () => setFl({ search: '', region_id: '', crop_id: '', max_price: '' });
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const shown = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Marketplace {isConnected ? <Wifi size={20} color="#1B7F3B" style={{ marginLeft: 8, verticalAlign: 'middle' }} /> : <WifiOff size={20} color="#999" style={{ marginLeft: 8, verticalAlign: 'middle' }} />}</h1>
          <p className="muted">Find and buy quality agricultural produce from trusted farmers across Ethiopia. {isConnected && <span style={{ color: '#1B7F3B' }}>● Live updates active</span>}</p>
        </div>
        {user.role === 'farmer' && <Link to="/listings/new" className="btn primary"><Plus size={16} /> Sell Produce</Link>}
      </div>

      {newListingAlert && (
        <div className="card" style={{ background: '#E8F5E9', border: '1px solid #1B7F3B', padding: '12px', marginBottom: '16px' }}>
          <strong>🆕 New Listing!</strong> {newListingAlert.crop} - {newListingAlert.quantity} {newListingAlert.unit} at {newListingAlert.price} ETB from {newListingAlert.region}
        </div>
      )}

      <div className="card filters">
        <div className="field"><label>Search</label><input value={fl.search} onChange={set('search')} placeholder="Search crops..." /></div>
        <div className="field"><label>Region</label>
          <select value={fl.region_id} onChange={set('region_id')}>
            <option value="">All regions</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select></div>
        <div className="field"><label>Crop</label>
          <select value={fl.crop_id} onChange={set('crop_id')}>
            <option value="">All crops</option>
            {crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select></div>
        <div className="field"><label>Price range (ETB)</label>
          <select value={fl.max_price} onChange={set('max_price')}>
            {PRICE_STEPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <button className="btn" onClick={clear}>Clear</button>
      </div>

      {loading && <p className="muted" style={{ marginTop: 18 }}>Loading listings...</p>}
      {!loading && items.length === 0 && (
        <div className="card empty" style={{ marginTop: 18 }}>No listings match your filters. Try clearing a filter.</div>
      )}

      <div className="listing-grid">
        {shown.map(l => (
          <article key={l.id} className="listing-card">
            <CropThumb src={l.image_urls?.[0]} name={l.crop} />
            <h3>{l.crop}</h3>
            <span className="loc"><MapPin size={13} /> {l.region}{l.location_detail ? `, ${l.location_detail}` : ''}</span>
            <span className="muted" style={{ fontSize: 13 }}>{num(l.quantity)} {l.unit} available</span>
            <span className="price-line">{etb(l.price_per_unit)} / {l.unit}</span>
            <Link className="btn primary block" to={`/marketplace/${l.id}`}>View Details</Link>
          </article>
        ))}
      </div>

      {pages > 1 && (
        <div className="pager">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={page === i + 1 ? 'on' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
        </div>
      )}

      <div className="banner">
        <div className="ico"><Sprout size={22} /></div>
        <div>
          <b>Support Ethiopian farmers</b>
          <p className="muted" style={{ fontSize: 13 }}>Buy local · Build stronger communities · Grow together</p>
        </div>
      </div>
    </>
  );
}