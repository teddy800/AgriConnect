import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { etb, num, fmtDate } from '../utils.js';
import { CropThumb, StatusBadge } from '../components/ui.jsx';

const TABS = [['all', 'All'], ['pending', 'Pending'], ['accepted', 'Accepted'], ['completed', 'Completed'], ['rejected', 'Rejected']];

function Detail({ i, farmer, onClose, onAct }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Inquiry details" onClick={e => e.stopPropagation()}>
        <h2>{i.crop}: {i.title}</h2>
        <div className="facts">
          <div><span>{farmer ? 'Buyer' : 'Farmer'}</span><b>{i.counterpart}</b></div>
          <div><span>Quantity wanted</span><b>{num(i.quantity_wanted)} {i.unit}</b></div>
          <div><span>Asking price</span><b>{etb(i.price_per_unit)} /{i.unit}</b></div>
          <div><span>Offered price</span><b>{i.offered_price ? `${etb(i.offered_price)} /${i.unit}` : 'Same as asking'}</b></div>
          <div><span>Sent</span><b>{fmtDate(i.created_at)}</b></div>
          <div><span>Status</span><b><StatusBadge status={i.status} /></b></div>
        </div>
        {i.message && <><b>Message</b><p className="muted" style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{i.message}</p></>}

        {i.counterpart_phone
          ? <a className="btn block" href={`tel:${i.counterpart_phone}`}><Phone size={16} /> Call {i.counterpart} ({i.counterpart_phone})</a>
          : <p className="muted">The farmer's phone number is shared after they accept your inquiry.</p>}

        <div className="row-actions" style={{ marginTop: 14 }}>
          <button className="btn" onClick={onClose}>Close</button>
          {farmer && i.status === 'pending' && <>
            <button className="btn danger" onClick={() => onAct(i.id, 'rejected')}>Reject</button>
            <button className="btn primary" onClick={() => onAct(i.id, 'accepted')}>Accept</button>
          </>}
          {farmer && i.status === 'accepted' &&
            <button className="btn primary" onClick={() => onAct(i.id, 'completed')}>Mark as completed</button>}
        </div>
      </div>
    </div>
  );
}

export default function Inquiries() {
  const { user } = useAuth();
  const farmer = user.role === 'farmer';
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState('');

  const load = () =>
    api.get(farmer ? '/inquiries/received' : '/inquiries/sent').then(setRows).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  const act = async (id, status) => {
    try { await api.patch(`/inquiries/${id}`, { status }); setSel(null); load(); }
    catch (e) { setErr(e.message); }
  };

  const count = k => (rows || []).filter(r => k === 'all' || r.status === k).length;
  const shown = (rows || []).filter(r => tab === 'all' || r.status === tab);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{farmer ? 'Buyer Inquiries' : 'My Inquiries'}</h1>
          <p className="muted">{farmer ? 'Manage inquiries from buyers and track their status.' : 'Track the inquiries you sent to farmers.'}</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {label} ({count(k)})
          </button>
        ))}
      </div>

      {err && <p className="err">{err}</p>}
      {!rows && <p className="muted">Loading...</p>}
      {rows && shown.length === 0 && <div className="card empty">No inquiries here yet.</div>}

      {shown.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Crop / Quantity</th><th>{farmer ? 'Buyer' : 'Farmer'}</th><th>Price offered</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {shown.map(i => (
                <tr key={i.id}>
                  <td>
                    <div className="cell">
                      <CropThumb small src={i.image_urls?.[0]} name={i.crop} />
                      <div>{i.crop}<div className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{num(i.quantity_wanted)} {i.unit}</div></div>
                    </div>
                  </td>
                  <td>{i.counterpart}</td>
                  <td>{i.offered_price ? `${etb(i.offered_price)} /${i.unit}` : <span className="muted">Asking price</span>}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td className="muted">{fmtDate(i.created_at)}</td>
                  <td><button className="btn sm" onClick={() => setSel(i)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sel && <Detail i={sel} farmer={farmer} onClose={() => setSel(null)} onAct={act} />}
    </>
  );
}