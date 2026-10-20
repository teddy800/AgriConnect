import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';

// Lazy load all pages for code splitting
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Marketplace = lazy(() => import('./pages/Marketplace.jsx'));
const ListingDetails = lazy(() => import('./pages/ListingDetails.jsx'));
const MyListings = lazy(() => import('./pages/MyListings.jsx'));
const CreateListing = lazy(() => import('./pages/CreateListing.jsx'));
const Inquiries = lazy(() => import('./pages/Inquiries.jsx'));
const Prices = lazy(() => import('./pages/Prices.jsx'));
const Weather = lazy(() => import('./pages/Weather.jsx'));
const Advisory = lazy(() => import('./pages/Advisory.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const RBACDemo = lazy(() => import('./pages/RBACDemo.jsx'));

// Removed unused Soon component - can be added back when needed

// Loading component for Suspense fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2e7d32', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: '#666' }}>Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="weather" element={<Weather />} />
          <Route path="advisory" element={<Advisory />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="rbac" element={<RBACDemo />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}