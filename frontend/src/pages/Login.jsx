import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { user, save } = useAuth();
  const [mode, setMode] = useState('login');
  const [regions, setRegions] = useState([]);
  const [f, setF] = useState({ role: 'farmer', preferred_lang: 'en' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/regions').then(setRegions).catch(() => {}); }, []);
  if (user) return <Navigate to="/" replace />;

  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const body = mode === 'login'
        ? { phone: f.phone, password: f.password }
        : { ...f, region_id: f.region_id ? +f.region_id : undefined };
      save(await api.post(`/auth/${mode}`, body));
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="brand" style={{ color: '#fff' }}>
          <div className="brand-logo" style={{ background: 'rgba(255,255,255,.18)' }}><Leaf size={20} /></div>
          <div><b style={{ color: '#fff' }}>AgriConnect</b><small style={{ color: 'rgba(255,255,255,.75)' }}>Connect · Trade · Grow</small></div>
        </div>
        <div>
          <h1>Sell directly. Know the price. Keep more of what you grow.</h1>
          <ul>
            <li>Post your produce in minutes</li>
            <li>See live market prices across Ethiopia</li>
            <li>Reach buyers without brokers</li>
          </ul>
        </div>
        <small style={{ opacity: .7 }}>Better Markets · Stronger Farmers · A Greener Ethiopia</small>
      </section>

      <section className="auth-form">
        <form className="form" onSubmit={submit}>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          {mode === 'register' && <input placeholder="Full name" onChange={set('full_name')} required />}
          <input placeholder="Phone (09...)" onChange={set('phone')} required />
          <input type="password" placeholder="Password" onChange={set('password')} required />
          {mode === 'register' && (
            <>
              <select onChange={set('role')}>
                <option value="farmer">I am a farmer</option>
                <option value="buyer">I am a buyer</option>
              </select>
              <select onChange={set('region_id')}>
                <option value="">Region</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select onChange={set('preferred_lang')}>
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
                <option value="om">Afaan Oromoo</option>
              </select>
            </>
          )}
          {err && <p className="err">{err}</p>}
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
          <button type="button" className="btn block" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
          </button>
        </form>
      </section>
    </div>
  );
}