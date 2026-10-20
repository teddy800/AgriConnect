import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity, DollarSign, Calendar, MapPin, Award, AlertCircle, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { usePriceUpdates } from '../hooks/useWebSocket.js';
import { etb, num } from '../utils.js';

const COLORS = ['#1B7F3B', '#2F6FDE', '#D99A1B', '#8A4FD6', '#D9534F', '#0E9AA7'];
const shortDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function RecordPrice({ crops, onSaved }) {
  const [markets, setMarkets] = useState([]);
  const [p, setP] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/markets').then(setMarkets); }, []);

  const save = async e => {
    e.preventDefault();
    try {
      await api.post('/prices', { crop_id: +p.crop_id, market_id: +p.market_id, price: +p.price });
      setMsg('Price saved successfully!'); onSaved();
      setTimeout(() => setMsg(''), 3000);
    } catch (x) { setMsg(x.message); }
  };

  return (
    <form className="card form" style={{ maxWidth: 'none', marginTop: 18 }} onSubmit={save}>
      <h2>Record Market Price</h2>
      <div className="form-grid">
        <div className="field">
          <label>Select Crop</label>
          <select required onChange={e => setP({ ...p, crop_id: e.target.value })}>
            <option value="">Choose a crop</option>
            {crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Select Market</label>
          <select required onChange={e => setP({ ...p, market_id: e.target.value })}>
            <option value="">Choose a market</option>
            {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="field full">
          <label>Price (ETB per quintal)</label>
          <input type="number" min="1" step="0.01" required placeholder="Enter price in ETB"
                 onChange={e => setP({ ...p, price: e.target.value })} />
        </div>
      </div>
      {msg && <p className="ok-text">{msg}</p>}
      <button className="btn primary">Save Price</button>
    </form>
  );
}

export default function Prices() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [days, setDays] = useState(7);
  const [series, setSeries] = useState([]);
  const [table, setTable] = useState([]);
  const [tick, setTick] = useState(0);
  const [chartType, setChartType] = useState('line');
  const crop = sp.get('crop') || '';

  // WebSocket real-time price updates
  const handlePriceUpdate = useCallback((data) => {
    console.log('📈 Real-time price update:', data);
    
    // Show notification
    if (Notification.permission === 'granted') {
      new Notification('Price Update', {
        body: `New price recorded: ${data.price} ETB`,
        icon: '/favicon.ico'
      });
    }
    
    // Refresh data
    setTick(t => t + 1);
  }, []);

  const { isConnected } = usePriceUpdates(crop ? [parseInt(crop)] : [], handlePriceUpdate);

  useEffect(() => {
    api.get('/crops').then(c => {
      setCrops(c);
      if (!sp.get('crop') && c.length) setSp({ crop: String(c[0].id) }, { replace: true });
    });
  }, []);

  useEffect(() => {
    if (!crop) return;
    Promise.all([api.get(`/prices/series?crop_id=${crop}&days=${days}`), api.get(`/prices/table?crop_id=${crop}`)])
      .then(([s, t]) => { setSeries(s); setTable(t); });
  }, [crop, days, tick]);

  const { data, markets, stats } = useMemo(() => {
    const ms = [...new Set(series.map(r => r.market))];
    const byDate = {};
    series.forEach(r => { (byDate[r.date] ||= { date: r.date })[r.market] = r.price; });
    
    // Calculate statistics
    const prices = series.map(r => r.price);
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const latestPrice = table.length ? table[0].price : 0;
    
    return { 
      data: Object.values(byDate), 
      markets: ms,
      stats: { avgPrice, minPrice, maxPrice, latestPrice, totalRecords: series.length }
    };
  }, [series, table]);

  const cropName = crops.find(c => String(c.id) === crop)?.name_en || '';
  const canEdit = ['admin', 'agronomist'].includes(user.role);

  // Calculate overall trend
  const overallTrend = useMemo(() => {
    if (table.length === 0) return null;
    const changes = table.map(r => r.change).filter(c => c != null);
    const avgChange = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
    return avgChange;
  }, [table]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={32} style={{ color: 'var(--g700)' }} />
            Market Prices
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
          <p className="muted">Real-time crop prices and market trends across Ethiopian regions</p>
        </div>
      </div>

      {/* Market Stats Overview */}
      {stats.totalRecords > 0 && (
        <div className="stats" style={{ marginBottom: '20px' }}>
          <div className="stat">
            <div className="ico" style={{ background: '#E3F2FD', color: '#1976D2' }}>
              <DollarSign size={20} />
            </div>
            <span>Current Price</span>
            <b>{etb(stats.latestPrice)}</b>
            <small className="muted">/quintal</small>
          </div>
          <div className="stat">
            <div className="ico" style={{ background: '#FFF3E0', color: '#F57C00' }}>
              <TrendingUp size={20} />
            </div>
            <span>Highest</span>
            <b>{etb(stats.maxPrice)}</b>
            <small className="muted">in {days} days</small>
          </div>
          <div className="stat">
            <div className="ico" style={{ background: '#E1F5FE', color: '#0288D1' }}>
              <TrendingDown size={20} />
            </div>
            <span>Lowest</span>
            <b>{etb(stats.minPrice)}</b>
            <small className="muted">in {days} days</small>
          </div>
          <div className="stat">
            <div className="ico" style={{ background: '#F3E5F5', color: '#7B1FA2' }}>
              <Award size={20} />
            </div>
            <span>Average</span>
            <b>{etb(stats.avgPrice)}</b>
            <small className="muted">/quintal</small>
          </div>
        </div>
      )}

      {/* Trend Alert Banner */}
      {overallTrend !== null && Math.abs(overallTrend) > 5 && (
        <div className="banner" style={{ 
          background: overallTrend > 0 ? '#E8F5E9' : '#FFEBEE',
          border: `1px solid ${overallTrend > 0 ? '#81C784' : '#E57373'}`,
          marginBottom: '20px'
        }}>
          <div className="ico" style={{ 
            background: overallTrend > 0 ? '#4CAF50' : '#F44336',
            color: 'white'
          }}>
            {overallTrend > 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ color: overallTrend > 0 ? '#2E7D32' : '#C62828', fontSize: '15px' }}>
              {overallTrend > 0 ? 'Price Increase Alert' : 'Price Drop Alert'}
            </b>
            <p style={{ color: overallTrend > 0 ? '#388E3C' : '#D32F2F', fontSize: '14px', marginTop: '4px' }}>
              {cropName} prices are {overallTrend > 0 ? 'rising' : 'falling'} by an average of <b>{Math.abs(overallTrend).toFixed(1)}%</b> across markets in the last {days} days.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card filters" style={{ gridTemplateColumns: '1.5fr 1fr auto' }}>
        <div className="field">
          <label>Select Crop</label>
          <select value={crop} onChange={e => setSp({ crop: e.target.value })}>
            {crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Time Period</label>
          <select value={days} onChange={e => setDays(+e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <div className="field">
          <label>Chart Type</label>
          <select value={chartType} onChange={e => setChartType(e.target.value)}>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Price Trend Chart */}
      <section className="card section">
        <div className="card-head">
          <div>
            <h2>{cropName} Price Trend</h2>
            <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>Price in ETB per quintal across different markets</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['line', 'area', 'bar'].map(type => (
              <button
                key={type}
                type="button"
                className={`btn ${chartType === type ? 'primary' : ''}`}
                style={{ padding: '6px 12px', fontSize: '13px', textTransform: 'capitalize' }}
                onClick={() => setChartType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        {data.length === 0 ? (
          <div className="empty" style={{ padding: '48px 20px' }}>
            <AlertCircle size={48} style={{ color: 'var(--muted)', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)' }}>No price data available</p>
            <p className="muted">No prices have been recorded for {cropName} yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E4EDE7" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#60756A' }} />
                <YAxis width={68} tick={{ fontSize: 12, fill: '#60756A' }} domain={['auto', 'auto']} tickFormatter={v => num(v)} />
                <Tooltip 
                  labelFormatter={shortDate} 
                  formatter={v => [etb(v), '']}
                  contentStyle={{ background: 'white', border: '1px solid #DAE7DE', borderRadius: '8px', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: '600' }} />
                {markets.map((m, i) => (
                  <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {markets.map((m, i) => (
                    <linearGradient key={m} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#E4EDE7" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#60756A' }} />
                <YAxis width={68} tick={{ fontSize: 12, fill: '#60756A' }} domain={['auto', 'auto']} tickFormatter={v => num(v)} />
                <Tooltip 
                  labelFormatter={shortDate} 
                  formatter={v => [etb(v), '']}
                  contentStyle={{ background: 'white', border: '1px solid #DAE7DE', borderRadius: '8px', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: '600' }} />
                {markets.map((m, i) => (
                  <Area key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fillOpacity={1} fill={`url(#color${i})`} />
                ))}
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E4EDE7" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#60756A' }} />
                <YAxis width={68} tick={{ fontSize: 12, fill: '#60756A' }} domain={['auto', 'auto']} tickFormatter={v => num(v)} />
                <Tooltip 
                  labelFormatter={shortDate} 
                  formatter={v => [etb(v), '']}
                  contentStyle={{ background: 'white', border: '1px solid #DAE7DE', borderRadius: '8px', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: '600' }} />
                {markets.map((m, i) => (
                  <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </section>

      {/* Latest Prices Table */}
      <section className="card section">
        <div className="card-head">
          <h2>Market Prices by Location</h2>
          <span className="chip">Latest {days} days</span>
        </div>
        {table.length === 0 ? (
          <p className="muted">No market prices available.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} />Market</div></th>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} />Price (ETB/qt)</div></th>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} />Change (7d)</div></th>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} />Updated</div></th>
                </tr>
              </thead>
              <tbody>
                {table.map(r => (
                  <tr key={r.market}>
                    <td><b style={{ fontSize: '14px' }}>{r.market}</b></td>
                    <td><span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--g700)' }}>{num(r.price)}</span></td>
                    <td>
                      {r.change == null ? <span className="muted">n/a</span> : (
                        <span className={r.change >= 0 ? 'up' : 'down'} style={{ fontSize: '14px', fontWeight: '700' }}>
                          {r.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          {r.change >= 0 ? '+' : ''}{r.change}%
                        </span>
                      )}
                    </td>
                    <td className="muted">{shortDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canEdit && <RecordPrice crops={crops} onSaved={() => setTick(t => t + 1)} />}
    </>
  );
}