import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, MessageSquare, ShoppingBag, Banknote, TrendingUp, TrendingDown } from 'lucide-react';
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
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const farmer = user.role === 'farmer';

  if (err) return <p className="err">{err}</p>;
  if (!d) return <p className="muted">Loading your dashboard...</p>;
  const s = d.stats;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{hello}, {user.full_name.split(' ')[0]}!</h1>
          <p className="muted">Here's what's happening with your {farmer ? 'farm' : 'purchases'} and the market today.</p>
        </div>
        <span className="chip">{today}</span>
      </div>

      <div className="stats">
        <StatCard hero icon={ClipboardList} label={farmer ? 'Total Listings' : 'Active Listings'} value={s.listings} />
        <StatCard icon={MessageSquare} label="Total Inquiries" value={s.inquiries} />
        <StatCard icon={ShoppingBag} label={farmer ? 'Total Sales' : 'Deals Completed'} value={s.sales} />
        <StatCard icon={Banknote} label={farmer ? 'Total Revenue' : 'Total Spent'} value={etb(s.revenue)} />
      </div>

      <section className="card section">
        <div className="card-head">
          <h2>Crop Price Overview</h2>
          <Link className="link" to="/prices">View all prices</Link>
        </div>
        {d.prices.length === 0 && <p className="muted">No prices recorded yet.</p>}
        <div className="price-grid">
          {d.prices.map(p => (
            <Link key={p.id} to={`/prices?crop=${p.id}`} className="price-card">
              <b>{p.crop}</b>
              <span className="val">{etb(p.price)} <small className="muted">/qt</small></span>
              {p.change != null && (
                <span className={p.change >= 0 ? 'up' : 'down'}>
                  {p.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {p.change >= 0 ? '+' : ''}{p.change}% this week
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="card section">
        <div className="card-head">
          <h2>{farmer ? 'Your Recent Listings' : 'Latest Listings'}</h2>
          <Link className="link" to={farmer ? '/my-listings' : '/marketplace'}>View all</Link>
        </div>
        {d.recent.length === 0 ? (
          <div className="empty">
            {farmer ? 'You have not posted any produce yet.' : 'No listings yet.'}{' '}
            {farmer && <Link className="link" to="/listings/new">Post your first listing</Link>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Crop</th><th>Quantity</th><th>Price</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {d.recent.map(l => (
                  <tr key={l.id}>
                    <td><div className="cell"><CropThumb small src={l.image_urls?.[0]} name={l.crop} />{l.crop}</div></td>
                    <td>{num(l.quantity)} {l.unit}</td>
                    <td>{etb(l.price_per_unit)} /{l.unit}</td>
                    <td>{l.region}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}