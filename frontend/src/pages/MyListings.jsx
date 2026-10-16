import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../api.js';
import { etb, num } from '../utils.js';
import { CropThumb, StatusBadge } from '../components/ui.jsx';

function EditModal({ l, onClose, onSaved }) {
  const [f, setF] = useState({
    title: l.title, description: l.description || '', quantity: l.quantity, price_per_unit: l.price_per_unit
  });
  const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const save = async e => {
    e.preventDefault();
    try {
      await api.put(`/listings/${l.id}`, {
        title: f.title, description: f.description, quantity: +f.quantity, price_per_unit: +f.price_per_unit
      });
      onSaved();
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal form" role="dialog" aria-modal="true" aria-label="Edit listing"
            onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2>Edit listing</h2>
        <div className="field"><label>Title</label><input value={f.title} onChange={set('title')} minLength={3} required /></div>
        <div className="field"><label>Description</label><textarea rows="3" value={f.description} onChange={set('description')} /></div>
        <div className="form-grid">
          <div className="field"><label>Quantity ({l.unit})</label>
            <input type="number" min="0.01" step="any" value={f.quantity} onChange={set('quantity')} required /></div>
          <div className="field"><label>Price per {l.unit} (ETB)</label>
            <input type="number" min="1" step="any" value={f.price_per_unit} onChange={set('price_per_unit')} required /></div>
        </div>
        {err && <p className="err">{err}</p>}
        <div className="row-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}

export default function MyListings() {
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/listings/mine').then(setRows).catch(e => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const setStatus = async (l, status) => {
    if (status === 'removed' && !window.confirm('Remove this listing? Buyers will no longer see it.')) return;
    try { await api.patch(`/listings/${l.id}/status`, { status }); load(); }
    catch (e) { setMsg(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Listings</h1>
          <p className="muted">Manage the produce you have posted.</p>
        </div>
        <Link to="/listings/new" className="btn primary"><Plus size={16} /> New Listing</Link>
      </div>

      {msg && <p className="err">{msg}</p>}
      {!rows && <p className="muted">Loading...</p>}
      {rows && rows.length === 0 && (
        <div className="card empty">You have not posted anything yet. <Link className="link" to="/listings/new">Post your first listing</Link></div>
      )}

      {rows && rows.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Produce</th><th>Quantity</th><th>Price</th><th>Inquiries</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(l => (
                <tr key={l.id}>
                  <td>
                    <div className="cell">
                      <CropThumb small src={l.image_urls?.[0]} name={l.crop} />
                      <div><Link to={`/marketplace/${l.id}`}>{l.title}</Link><div className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{l.crop} · {l.region}</div></div>
                    </div>
                  </td>
                  <td>{num(l.quantity)} {l.unit}</td>
                  <td>{etb(l.price_per_unit)} /{l.unit}</td>
                  <td>{l.inquiry_count}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                      <button className="btn sm" onClick={() => setEdit(l)}>Edit</button>
                      {l.status === 'active'
                        ? <button className="btn sm" onClick={() => setStatus(l, 'sold')}>Mark sold</button>
                        : <button className="btn sm" onClick={() => setStatus(l, 'active')}>Relist</button>}
                      <button className="btn sm danger" onClick={() => setStatus(l, 'removed')}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && <EditModal l={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </>
  );
}