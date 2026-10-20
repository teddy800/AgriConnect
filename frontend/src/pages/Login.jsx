import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Leaf, Mail, Phone } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { user, save } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('phone');
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
        ? { 
            [loginMethod]: loginMethod === 'phone' ? f.phone : f.email,
            password: f.password 
          }
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
          <p className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
            {mode === 'login' ? 'Sign in to continue to AgriConnect' : 'Join thousands of farmers and buyers'}
          </p>
          
          {mode === 'login' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '10px' }}>
                Choose Login Method
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${loginMethod === 'phone' ? 'primary' : ''}`}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setLoginMethod('phone')}
                >
                  <Phone size={16} />
                  Phone
                </button>
                <button
                  type="button"
                  className={`btn ${loginMethod === 'email' ? 'primary' : ''}`}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setLoginMethod('email')}
                >
                  <Mail size={16} />
                  Email
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="field">
              <label>Full Name</label>
              <input placeholder="Enter your full name" onChange={set('full_name')} required />
            </div>
          )}
          
          {mode === 'login' ? (
            loginMethod === 'phone' ? (
              <div className="field">
                <label>Phone Number</label>
                <input 
                  placeholder="09XXXXXXXX" 
                  onChange={set('phone')} 
                  type="tel"
                  required 
                />
              </div>
            ) : (
              <div className="field">
                <label>Email Address</label>
                <input 
                  placeholder="your.email@example.com" 
                  onChange={set('email')} 
                  type="email"
                  required 
                />
              </div>
            )
          ) : (
            <>
              <div className="field">
                <label>Phone Number</label>
                <input placeholder="09XXXXXXXX" onChange={set('phone')} type="tel" required />
              </div>
              <div className="field">
                <label>Email Address <span style={{ color: 'var(--muted)', fontWeight: '400' }}>(Optional)</span></label>
                <input placeholder="your.email@example.com" onChange={set('email')} type="email" />
              </div>
            </>
          )}

          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" onChange={set('password')} required />
          </div>
          
          {mode === 'register' && (
            <>
              <div className="field">
                <label>I am a</label>
                <select onChange={set('role')}>
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>
              <div className="field">
                <label>Region <span style={{ color: 'var(--muted)', fontWeight: '400' }}>(Optional)</span></label>
                <select onChange={set('region_id')}>
                  <option value="">Select your region</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Preferred Language</label>
                <select onChange={set('preferred_lang')}>
                  <option value="en">English</option>
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="om">Afaan Oromoo</option>
                </select>
              </div>
            </>
          )}
          {err && <p className="err">{err}</p>}
          <button className="btn primary block" disabled={busy} style={{ marginTop: '8px' }}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create Account'}
          </button>
          <button type="button" className="btn block" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
          </button>
        </form>
      </section>
    </div>
  );
}