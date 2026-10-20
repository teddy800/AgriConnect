import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, MessageSquare, ShoppingBag, Banknote, TrendingUp, TrendingDown, ArrowRight, Sparkles, Package, Users, Activity } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { etb, num } from '../utils.js';
import { StatCard, CropThumb, StatusBadge } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/dashboard').then(setD).catch(e => setErr(e.message)); }, []);

  const h = new Date().getHours();
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const farmer = user.role === 'farmer';

  if (err) return <p className="err">{err}</p>;
  if (!d) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--g700)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p className="muted">Loading your dashboard...</p>
      </div>
    </div>
  );
  const s = d.stats;

  return (
    <>
      {/* Hero Welcome Section */}
      <div className="dashboard-hero" style={{
        background: 'linear-gradient(135deg, var(--g700), var(--g900))',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles size={24} style={{ color: '#FFD700' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', opacity: 0.9 }}>{today}</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', color: 'white' }}>
            {hello}, {user.full_name.split(' ')[0]}! 👋
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.95, maxWidth: '600px', lineHeight: '1.6' }}>
            {farmer 
              ? "Here's your farm overview and market insights. Keep growing!" 
              : "Welcome back! Explore fresh listings and connect with farmers."}
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
      </div>

      {/* Stats Cards */}
      <div className="stats" style={{ marginBottom: '24px' }}>
        <div className="stat hero">
          <div className="ico">
            <ClipboardList size={20} />
          </div>
          <span>{farmer ? 'Active Listings' : 'Available Listings'}</span>
          <b>{s.listings}</b>
          <small style={{ opacity: 0.9 }}>{farmer ? 'Products posted' : 'Ready to buy'}</small>
        </div>
        <StatCard icon={MessageSquare} label="Inquiries" value={s.inquiries} />
        <StatCard icon={ShoppingBag} label={farmer ? 'Deals Closed' : 'Purchases'} value={s.sales} />
        <StatCard icon={Banknote} label={farmer ? 'Revenue' : 'Total Spent'} value={etb(s.revenue)} />
      </div>

      {/* Market Price Overview */}
      <section className="card section">
        <div className="card-head">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} style={{ color: 'var(--g700)' }} />
              Market Price Overview
            </h2>
            <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>Latest crop prices across Ethiopian markets</p>
          </div>
          <Link className="btn" to="/prices" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            View all prices
            <ArrowRight size={14} />
          </Link>
        </div>
        {d.prices.length === 0 ? (
          <div className="empty" style={{ padding: '32px 20px' }}>
            <Package size={40} style={{ color: 'var(--muted)', marginBottom: '8px' }} />
            <p className="muted">No price data available yet.</p>
          </div>
        ) : (
          <div className="price-grid">
            {d.prices.map(p => (
              <Link key={p.id} to={`/prices?crop=${p.id}`} className="price-card" style={{
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <b style={{ fontSize: '15px', color: 'var(--ink)' }}>{p.crop}</b>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
                  <span className="val" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--g700)' }}>
                    {etb(p.price)}
                  </span>
                  <small className="muted" style={{ fontSize: '12px' }}>/quintal</small>
                </div>
                {p.change != null && (
                  <span className={p.change >= 0 ? 'up' : 'down'} style={{ fontSize: '13px' }}>
                    {p.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {p.change >= 0 ? '+' : ''}{p.change}% this week
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Listings */}
      <section className="card section">
        <div className="card-head">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {farmer ? <ClipboardList size={20} style={{ color: 'var(--g700)' }} /> : <Package size={20} style={{ color: 'var(--g700)' }} />}
              {farmer ? 'Your Recent Listings' : 'Fresh from Farmers'}
            </h2>
            <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
              {farmer ? 'Manage your posted products' : 'Latest produce available in the market'}
            </p>
          </div>
          <Link className="btn" to={farmer ? '/my-listings' : '/marketplace'} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            {farmer ? 'Manage listings' : 'Browse marketplace'}
            <ArrowRight size={14} />
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <div className="empty" style={{ padding: '48px 20px' }}>
            <Package size={48} style={{ color: 'var(--muted)', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', marginBottom: '8px' }}>
              {farmer ? 'No listings yet' : 'No products available'}
            </p>
            <p className="muted" style={{ marginBottom: '16px' }}>
              {farmer ? 'Post your first product to start selling' : 'Check back later for fresh produce'}
            </p>
            {farmer && (
              <Link className="btn primary" to="/listings/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={16} />
                Create your first listing
              </Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map(l => (
                  <tr key={l.id} style={{ transition: 'background 0.2s ease' }}>
                    <td>
                      <div className="cell">
                        <CropThumb small src={l.image_urls?.[0]} name={l.crop} />
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{l.crop}</span>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: '600' }}>{num(l.quantity)} {l.unit}</span></td>
                    <td><span style={{ fontWeight: '700', color: 'var(--g700)' }}>{etb(l.price_per_unit)}</span><span className="muted">/{l.unit}</span></td>
                    <td><span className="muted">{l.region}</span></td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      <Link to={`/marketplace/${l.id}`} className="link" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Actions Banner */}
      {farmer && (
        <div className="banner" style={{ 
          background: 'linear-gradient(135deg, #F0F9F4, #E2F1E7)',
          border: '1px solid var(--g100)',
          marginTop: '24px'
        }}>
          <div className="ico" style={{ background: 'var(--g700)', color: 'white' }}>
            <Users size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: '15px', color: 'var(--g900)' }}>Ready to expand your reach?</b>
            <p className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>
              Post more listings to connect with buyers across Ethiopia and increase your sales.
            </p>
          </div>
          <Link to="/listings/new" className="btn primary" style={{ flexShrink: 0 }}>
            Create Listing
          </Link>
        </div>
      )}
    </>
  );
}