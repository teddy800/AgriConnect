import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MessageSquare, Phone, Sprout } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { etb, num, fmtDate } from '../utils.js';

function PriceTag({ l }) {
  if (l.unit !== 'quintal' || !l.market_avg) return null;
  const diff = ((l.price_per_unit - l.market_avg) / l.market_avg) * 100;
  const [label, tone] =
    diff <= -3 ? ['Below market price', 'ok'] : diff >= 3 ? ['Above market price', 'warn'] : ['Fair price', 'ok'];
  return <span className={`badge ${tone}`} title={`Market average: ${etb(l.market_avg)} per quintal`}>{label}</span>;
}

function InquiryModal({ l, onClose, onSent }) {
  const [f, setF] = useState({ quantity_wanted: '', offered_price: '', message: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await api.post('/inquiries', {
        listing_id: l.id,
        quantity_wanted: +f.quantity_wanted,
        offered_price: f.offered_price ? +f.offered_price : undefined,
        message: f.message || undefined
      });
      onSent();
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal form" role="dialog" aria-modal="true" aria-label="Send inquiry"
            onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h2>Send inquiry</h2>
        <p className="muted">{l.title} · {etb(l.price_per_unit)} / {l.unit}</p>
        <div className="field">
          <label>Quantity you want ({l.unit}), up to {num(l.quantity)}</label>
          <input type="number" min="0.01" max={l.quantity} step="any" required
                 value={f.quantity_wanted} onChange={set('quantity_wanted')} />
        </div>
        <div className="field">
          <label>Your offered price per {l.unit} (optional)</label>
          <input type="number" min="1" step="any" placeholder={String(l.price_per_unit)}
                 value={f.offered_price} onChange={set('offered_price')} />
        </div>
        <div className="field">
          <label>Message (optional)</label>
          <textarea rows="3" placeholder="Delivery place, when you need it..."
                    value={f.message} onChange={set('message')} />
        </div>
        {err && <p className="err">{err}</p>}
        <div className="row-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Sending...' : 'Send inquiry'}</button>
        </div>
      </form>
    </div>
  );
}

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [l, setL] = useState(null);
  const [err, setErr] = useState('');
  const [img, setImg] = useState(0);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { api.get(`/listings/${id}`).then(setL).catch(e => setErr(e.message)); }, [id]);

  if (err) return <><Link to="/marketplace" className="back"><ArrowLeft size={16} /> Back to Marketplace</Link><p className="err">{err}</p></>;
  if (!l) return <p className="muted">Loading...</p>;

  const imgs = l.image_urls || [];
  const mine = user.id === l.farmer_id;
  const active = l.status === 'active';

  return (
    <>
      <Link to="/marketplace" className="back"><ArrowLeft size={16} /> Back to Marketplace</Link>

      <div className="title-row">
        <h1>{l.title}</h1>
        {l.is_verified && <span className="badge ok" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><BadgeCheck size={14} /> Verified farmer</span>}
      </div>

      <div className="details">
        <div className="card">
          {imgs.length > 0
            ? <img className="gallery-main" src={imgs[img]} alt={l.title} />
            : <div className="gallery-main thumb-empty" style={{ display: 'grid', placeItems: 'center' }}><Sprout size={56} /></div>}
          {imgs.length > 1 && (
            <div className="gallery-thumbs">
              {imgs.map((u, i) => (
                <button key={u} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}>
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          )}
          <h2 style={{ marginTop: 18 }}>Description</h2>
          <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{l.description || 'The farmer has not added a description.'}</p>
        </div>

        <div className="card">
          <div className="title-row" style={{ marginBottom: 4 }}>
            <div><span className="big-price">{etb(l.price_per_unit)}</span> <span className="muted">/ {l.unit}</span></div>
            <PriceTag l={l} />
          </div>
          <p className="muted">Available: {num(l.quantity)} {l.unit}</p>

          <div className="facts">
            <div><span>Crop</span><b>{l.crop}</b></div>
            <div><span>Quantity</span><b>{num(l.quantity)} {l.unit}</b></div>
            <div><span>Location</span><b>{l.location_detail ? `${l.location_detail}, ` : ''}{l.region}</b></div>
            <div><span>Harvest date</span><b>{l.harvest_date ? fmtDate(l.harvest_date) : 'Not given'}</b></div>
            <div><span>Farmer</span><b>{l.farmer}{l.is_verified && <BadgeCheck size={15} color="#1B7F3B" />}</b></div>
          </div>

          {!active && <p className="err">This listing is no longer available.</p>}
          {sent && <p className="ok-text">Inquiry sent. The farmer has been notified. Track it under Inquiries.</p>}

          <div className="stack">
            {user.role === 'buyer' && active && !sent && (
              <button className="btn primary block" onClick={() => setOpen(true)}><MessageSquare size={16} /> Send Inquiry</button>
            )}
            {mine
              ? <Link className="btn block" to="/my-listings">This is your listing. Manage it</Link>
              : <a className="btn block" href={`tel:${l.farmer_phone}`}><Phone size={16} /> Call Farmer</a>}
          </div>
        </div>
      </div>

      {open && <InquiryModal l={l} onClose={() => setOpen(false)} onSent={() => { setOpen(false); setSent(true); }} />}
    </>
  );
}