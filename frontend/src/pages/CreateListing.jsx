import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ImagePlus, X } from 'lucide-react';
import { api } from '../api.js';
import { etb } from '../utils.js';

const DRAFT = 'listing-draft';
const STEPS = ['Basic Info', 'Details', 'Photos'];
const EMPTY = { unit: 'quintal', images: [] };

export default function CreateListing() {
  const nav = useNavigate();
  const [crops, setCrops] = useState([]);
  const [regions, setRegions] = useState([]);
  const [step, setStep] = useState(0);
  const [avg, setAvg] = useState(null);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT)) || EMPTY; } catch { return EMPTY; }
  });

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/regions')]).then(([c, r]) => { setCrops(c); setRegions(r); });
  }, []);

  // show today's market average for the chosen crop, so the farmer can price fairly
  useEffect(() => {
    if (!f.crop_id) return setAvg(null);
    api.get(`/prices/table?crop_id=${f.crop_id}`)
      .then(rows => setAvg(rows.length ? Math.round(rows.reduce((a, r) => a + r.price, 0) / rows.length) : null))
      .catch(() => setAvg(null));
  }, [f.crop_id]);

  const set = k => e => setF({ ...f, [k]: e.target.value });

  const next = e => {
    e.preventDefault();
    setErr(''); setInfo('');
    if (step === 0 && !f.title) {
      const name = crops.find(c => String(c.id) === String(f.crop_id))?.name_en || '';
      setF({ ...f, title: `${name}, ${new Date().getFullYear()} harvest` });
    }
    setStep(step + 1);
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT, JSON.stringify(f));
    setInfo('Draft saved on this device.');
  };

  const addImages = async e => {
    setErr('');
    const files = [...e.target.files].slice(0, 3 - f.images.length);
    e.target.value = '';
    try {
      const urls = [];
      for (const file of files) urls.push((await api.upload('/uploads', file)).url);
      setF(cur => ({ ...cur, images: [...cur.images, ...urls].slice(0, 3) }));
    } catch (x) { setErr(x.message); }
  };

  const removeImage = u => setF({ ...f, images: f.images.filter(i => i !== u) });

  const publish = async () => {
    setErr(''); setBusy(true);
    try {
      await api.post('/listings', {
        crop_id: +f.crop_id, region_id: +f.region_id, quantity: +f.quantity, unit: f.unit,
        price_per_unit: +f.price_per_unit, title: f.title, description: f.description,
        location_detail: f.location_detail || undefined, harvest_date: f.harvest_date || undefined,
        image_urls: f.images
      });
      localStorage.removeItem(DRAFT);
      nav('/my-listings');
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Create New Listing</h1>
          <p className="muted">Share your produce with buyers across Ethiopia.</p>
        </div>
      </div>

      <div className="stepper" aria-label="Progress">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}>
            <i>{i < step ? <Check size={14} /> : i + 1}</i>{s}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <form className="form" style={{ maxWidth: 'none' }} onSubmit={next}>
            <div className="form-grid">
              <div className="field"><label>Crop *</label>
                <select value={f.crop_id || ''} onChange={set('crop_id')} required>
                  <option value="">Select crop</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select></div>
              <div className="field"><label>Region *</label>
                <select value={f.region_id || ''} onChange={set('region_id')} required>
                  <option value="">Select region</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select></div>
              <div className="field"><label>Quantity *</label>
                <input type="number" min="0.01" step="any" value={f.quantity || ''} onChange={set('quantity')} placeholder="Enter quantity" required /></div>
              <div className="field"><label>Unit *</label>
                <select value={f.unit} onChange={set('unit')}>
                  <option value="quintal">Quintal</option><option value="kg">Kilogram</option><option value="ton">Ton</option>
                </select></div>
              <div className="field full"><label>Price per {f.unit} (ETB) *</label>
                <input type="number" min="1" step="any" value={f.price_per_unit || ''} onChange={set('price_per_unit')} placeholder="Enter price" required />
                {avg && f.unit === 'quintal' && <div className="hint">Market average today: {etb(avg)} per quintal</div>}
              </div>
            </div>
            <div className="row-actions">
              <button type="button" className="btn" onClick={saveDraft}>Save Draft</button>
              <button className="btn primary">Next: Details</button>
            </div>
          </form>
        )}

        {step === 1 && (
          <form className="form" style={{ maxWidth: 'none' }} onSubmit={next}>
            <div className="form-grid">
              <div className="field full"><label>Title *</label>
                <input value={f.title || ''} onChange={set('title')} minLength={3} placeholder="e.g. Fresh Teff, 2026 harvest" required /></div>
              <div className="field full"><label>Description *</label>
                <textarea rows="4" value={f.description || ''} onChange={set('description')}
                          placeholder="Describe your produce: quality, how it was grown, how it is stored..." required /></div>
              <div className="field"><label>Location detail</label>
                <input value={f.location_detail || ''} onChange={set('location_detail')} placeholder="e.g. near main road, kebele name" /></div>
              <div className="field"><label>Harvest date</label>
                <input type="date" value={f.harvest_date || ''} onChange={set('harvest_date')} /></div>
            </div>
            <div className="row-actions">
              <button type="button" className="btn" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="btn" onClick={saveDraft}>Save Draft</button>
              <button className="btn primary">Next: Add Photos</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="form" style={{ maxWidth: 'none' }}>
            <p className="muted">Add up to 3 clear photos. Listings with photos get more inquiries. JPG, PNG or WebP, under 2 MB each.</p>
            <div className="photos">
              {f.images.map(u => (
                <div className="photo" key={u}>
                  <img src={u} alt="Uploaded produce" />
                  <button type="button" onClick={() => removeImage(u)} aria-label="Remove photo"><X size={14} /></button>
                </div>
              ))}
              {f.images.length < 3 && (
                <label className="drop">
                  <ImagePlus size={26} />Add photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} />
                </label>
              )}
            </div>
            {err && <p className="err">{err}</p>}
            <div className="row-actions">
              <button type="button" className="btn" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn" onClick={saveDraft}>Save Draft</button>
              <button type="button" className="btn primary" onClick={publish} disabled={busy}>
                {busy ? 'Publishing...' : 'Publish listing'}
              </button>
            </div>
          </div>
        )}

        {err && step !== 2 && <p className="err">{err}</p>}
        {info && <p className="ok-text">{info}</p>}
      </div>
    </>
  );
}