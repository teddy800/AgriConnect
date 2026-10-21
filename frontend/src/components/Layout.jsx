import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Package, Inbox, TrendingUp, CloudSun, Lightbulb,
  MessageCircle, User, Settings, Search, Bell, LogOut, Leaf, Shield
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useT } from '../i18n.jsx';
import { api } from '../api.js';

// [path, label, icon, exact?, only-for-role]
const NAV = [
  ['/', 'Dashboard', LayoutDashboard, true],
  ['/marketplace', 'Marketplace', Store],
  ['/my-listings', 'My Listings', Package, false, 'farmer'],
  ['/inquiries', 'Inquiries', Inbox],
  ['/prices', 'Market Prices', TrendingUp],
  ['/weather', 'Weather', CloudSun],
  ['/advisory', 'Advisory', Lightbulb],
  ['/messages', 'Messages', MessageCircle],
  ['/admin', 'Admin Panel', Shield, false, 'admin'],
  ['/profile', 'Profile', User],
  ['/settings', 'Settings', Settings]
];

function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const load = () => api.get('/notifications').then(setItems).catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter(n => !n.is_read).length;
  
  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <button 
      className="iconbtn" 
      onClick={handleClick} 
      aria-label="Notifications"
      style={{ position: 'relative' }}
    >
      <Bell size={18} />
      {unread > 0 && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: 'white',
          fontSize: '10px',
          fontWeight: '900',
          padding: '2px 6px',
          borderRadius: '10px',
          minWidth: '18px',
          height: '18px',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
          border: '2px solid white'
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useT();
  const nav = useNavigate();
  const [term, setTerm] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  const submit = e => {
    e.preventDefault();
    nav(`/marketplace?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Leaf size={20} /></div>
          <div><b>AgriConnect</b><small>Connect · Trade · Grow</small></div>
        </div>

        <nav className="nav">
          {NAV.filter(([, , , , only]) => !only || only === user.role).map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <p>Better Markets<br />Stronger Farmers<br />A Greener Ethiopia</p>
          <svg viewBox="0 0 200 70" aria-hidden="true">
            <path d="M0 38 Q40 12 80 36 T160 28 T200 34 V70 H0Z" fill="#8FCFA2" />
            <path d="M0 52 Q50 30 100 50 T200 44 V70 H0Z" fill="#2F9E55" />
          </svg>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <form className="search" onSubmit={submit} role="search">
            <Search size={16} color="#60756A" />
            <input value={term} onChange={e => setTerm(e.target.value)} placeholder="Search crops, regions or farmers..." />
          </form>

          <div className="top-right">
            <select className="lang" value={lang} onChange={e => setLang(e.target.value)} aria-label="Language">
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
              <option value="om">Afaan Oromoo</option>
            </select>
            <NotificationBell />
            <div className="user-chip">
              <div className="avatar">{user.full_name[0]}</div>
              <div><b>{user.full_name}</b><small>{user.role}</small></div>
            </div>
            <button className="iconbtn" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="page"><Outlet /></main>
      </div>
    </div>
  );
}