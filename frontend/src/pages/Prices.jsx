import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
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
      setMsg('Price saved.'); onSaved();
    } catch (x) { setMsg(x.message); }
  };

  return (
    <form className="card form" style={{ maxWidth: 'none', marginTop: 18 }} onSubmit={save}>
      <h2>Record today's market price</h2>
      <div className="form-grid">
        <select required onChange={e => setP({ ...p, crop_id: e.target.value })}>
          <option value="">Crop</option>{crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
        </select>
        <select required onChange={e => setP({ ...p, market_id: e.target.value })}>
          <option value="">Market</option>{markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input className="full" type="number" min="1" required placeholder="Price (ETB per quintal)"
               onChange={e => setP({ ...p, price: e.target.value })} />
      </div>
      {msg && <p className="ok-text">{msg}</p>}
      <button className="btn primary">Save price</button>
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
  const crop = sp.get('crop') || '';

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

  const { data, markets } = useMemo(() => {
    const ms = [...new Set(series.map(r => r.market))];
    const byDate = {};
    series.forEach(r => { (byDate[r.date] ||= { date: r.date })[r.market] = r.price; });
    return { data: Object.values(byDate), markets: ms };
  }, [series]);

  const cropName = crops.find(c => String(c.id) === crop)?.name_en || '';
  const canEdit = ['admin', 'agronomist'].includes(user.role);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Market Prices</h1>
          <p className="muted">Track crop prices and market trends across Ethiopian regions.</p>
        </div>
      </div>

      <div className="card filters" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="field"><label>Crop</label>
          <select value={crop} onChange={e => setSp({ crop: e.target.value })}>
            {crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select></div>
        <div className="field"><label>Period</label>
          <select value={days} onChange={e => setDays(+e.target.value)}>
            <option value="7">Last 7 days</option><option value="14">Last 14 days</option>
          </select></div>
      </div>

      <section className="card section">
        <h2>{cropName} price trend (ETB per quintal)</h2>
        {data.length === 0 ? <p className="muted">No prices recorded for this crop yet.</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E4EDE7" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} />
              <YAxis width={58} tick={{ fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={v => num(v)} />
              <Tooltip labelFormatter={shortDate} formatter={v => etb(v)} />
              <Legend />
              {markets.map((m, i) => (
                <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="card section">
        <h2>Latest prices</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Market</th><th>Price (ETB/quintal)</th><th>Change (7d)</th><th>Updated</th></tr></thead>
            <tbody>
              {table.map(r => (
                <tr key={r.market}>
                  <td><b>{r.market}</b></td>
                  <td>{num(r.price)}</td>
                  <td>
                    {r.change == null ? <span className="muted">n/a</span> : (
                      <span className={r.change >= 0 ? 'up' : 'down'}>
                        {r.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
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
      </section>

      {canEdit && <RecordPrice crops={crops} onSaved={() => setTick(t => t + 1)} />}
    </>
  );
}