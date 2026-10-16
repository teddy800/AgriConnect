import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Marketplace from './pages/Marketplace.jsx';

const Soon = ({ title }) => (
  <div className="card">
    <h2>{title}</h2>
    <p className="muted">This page arrives in a later step.</p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="my-listings" element={<Soon title="My Listings" />} />
        <Route path="inquiries" element={<Soon title="Inquiries" />} />
        <Route path="prices" element={<Soon title="Market Prices" />} />
        <Route path="weather" element={<Soon title="Weather" />} />
        <Route path="advisory" element={<Soon title="Advisory" />} />
        <Route path="messages" element={<Soon title="Messages" />} />
        <Route path="profile" element={<Soon title="Profile" />} />
        <Route path="settings" element={<Soon title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}