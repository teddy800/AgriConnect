import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ListingDetails from './pages/ListingDetails.jsx';
import MyListings from './pages/MyListings.jsx';
import CreateListing from './pages/CreateListing.jsx';
import Inquiries from './pages/Inquiries.jsx';
import Prices from './pages/Prices.jsx';

const Soon = ({ title }) => (
  <div className="card">
    <h2>{title}</h2>
    <p className="muted">This feature is coming soon. We're working hard to bring it to you!</p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="marketplace/:id" element={<ListingDetails />} />
        <Route path="my-listings" element={<MyListings />} />
        <Route path="listings/new" element={<CreateListing />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="prices" element={<Prices />} />
        <Route path="weather" element={<Soon title="Weather Forecast" />} />
        <Route path="advisory" element={<Soon title="Agricultural Advisory" />} />
        <Route path="messages" element={<Soon title="Direct Messages" />} />
        <Route path="profile" element={<Soon title="User Profile" />} />
        <Route path="settings" element={<Soon title="Account Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}