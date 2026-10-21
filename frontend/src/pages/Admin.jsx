/**
 * Advanced Admin Dashboard for AgriConnect
 * Comprehensive system management, user moderation, analytics
 */

import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, ShoppingBag, MessageSquare, 
  CheckCircle, XCircle, Shield, Activity, Clock,
  Eye, EyeOff, UserCheck, UserX, AlertCircle,
  Package, BarChart3, Settings, RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';

const etb = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const num = (n) => Number(n || 0).toLocaleString();

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleUserVerification = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}`, {
        is_verified: !currentStatus
      });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_verified: !currentStatus } : u
      ));
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user verification status');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}`, {
        is_active: !currentStatus
      });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user active status');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '48px', height: '48px' }}></div>
          <p className="muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F4D2A 0%, #1B7A43 50%, #0F4D2A 100%)',
        padding: '32px 24px',
        borderRadius: '20px',
        color: 'white',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Shield size={32} />
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Admin Dashboard</h1>
          </div>
          <p style={{ fontSize: '16px', opacity: 0.95, marginBottom: '16px' }}>
            System Management & User Administration
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <Activity size={16} />
              <span>System Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <Clock size={16} />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <StatCard
          icon={<Users size={28} />}
          title="Total Users"
          value={num(stats?.users || 0)}
          color="#3B82F6"
          bgColor="#EFF6FF"
        />
        <StatCard
          icon={<ShoppingBag size={28} />}
          title="Active Listings"
          value={num(stats?.active_listings || 0)}
          color="#10B981"
          bgColor="#ECFDF5"
        />
        <StatCard
          icon={<MessageSquare size={28} />}
          title="Total Inquiries"
          value={num(stats?.inquiries || 0)}
          color="#F59E0B"
          bgColor="#FFFBEB"
        />
        <StatCard
          icon={<CheckCircle size={28} />}
          title="Completed Deals"
          value={num(stats?.completed_deals || 0)}
          color="#8B5CF6"
          bgColor="#F5F3FF"
        />
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '2px solid var(--line)',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={<BarChart3 size={18} />}
          label="Overview"
        />
        <TabButton
          active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
          icon={<Users size={18} />}
          label={`Users (${users.length})`}
        />
        <TabButton
          active={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
          icon={<TrendingUp size={18} />}
          label="Analytics"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} users={users} />
      )}

      {activeTab === 'users' && (
        <UsersTab 
          users={users} 
          onToggleVerification={toggleUserVerification}
          onToggleStatus={toggleUserStatus}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab stats={stats} users={users} />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, color, bgColor }) {
  return (
    <div className="card" style={{ 
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      border: '2px solid transparent',
      transition: 'all 0.3s'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: bgColor,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p className="muted" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
          {title}
        </p>
        <p style={{ fontSize: '28px', fontWeight: '800', color: color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '700',
        color: active ? 'var(--g700)' : 'var(--muted)',
        borderBottom: active ? '3px solid var(--g700)' : '3px solid transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// Overview Tab
function OverviewTab({ stats, users }) {
  const roleBreakdown = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const verifiedCount = users.filter(u => u.is_verified).length;
  const activeCount = users.filter(u => u.is_active).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} />
          User Roles Distribution
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(roleBreakdown).map(([role, count]) => (
            <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>
                {getRoleIcon(role)} {role}
              </span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--g700)' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} />
          User Status
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Verified Users</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>
                {verifiedCount} / {users.length}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${(verifiedCount / users.length) * 100}%`, 
                height: '100%', 
                background: '#10B981',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Active Users</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#3B82F6' }}>
                {activeCount} / {users.length}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${(activeCount / users.length) * 100}%`, 
                height: '100%', 
                background: '#3B82F6',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={20} />
          Marketplace Activity
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Completion Rate</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--g700)' }}>
              {stats?.inquiries ? Math.round((stats.completed_deals / stats.inquiries) * 100) : 0}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Avg Listings/Farmer</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--g700)' }}>
              {roleBreakdown.farmer ? Math.round(stats?.active_listings / roleBreakdown.farmer) : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab({ users, onToggleVerification, onToggleStatus }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          u.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1',
            minWidth: '200px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '2px solid var(--line)',
            fontSize: '14px'
          }}
        />
        {['all', 'admin', 'farmer', 'buyer', 'agronomist'].map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '2px solid var(--line)',
              background: filter === role ? 'var(--g700)' : 'white',
              color: filter === role ? 'white' : 'var(--text)',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '700' }}>{u.full_name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{u.phone}</td>
                  <td>
                    <span style={{ 
                      textTransform: 'capitalize',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {getRoleIcon(u.role)} {u.role}
                    </span>
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge ok">Active</span>
                    ) : (
                      <span className="badge bad">Inactive</span>
                    )}
                  </td>
                  <td>
                    {u.is_verified ? (
                      <CheckCircle size={18} style={{ color: '#10B981' }} />
                    ) : (
                      <XCircle size={18} style={{ color: '#EF4444' }} />
                    )}
                  </td>
                  <td className="muted" style={{ fontSize: '13px' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onToggleVerification(u.id, u.is_verified)}
                        title={u.is_verified ? 'Unverify' : 'Verify'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: u.is_verified ? '#FEE2E2' : '#ECFDF5',
                          color: u.is_verified ? '#EF4444' : '#10B981',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {u.is_verified ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        onClick={() => onToggleStatus(u.id, u.is_active)}
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: u.is_active ? '#FEF3C7' : '#DBEAFE',
                          color: u.is_active ? '#F59E0B' : '#3B82F6',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {u.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', fontWeight: '600' }}>No users found</p>
        </div>
      )}
    </div>
  );
}

// Analytics Tab
function AnalyticsTab({ stats, users }) {
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return (
    <div>
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
          Recent User Registrations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentUsers.map(u => (
            <div 
              key={u.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: 'var(--bg)',
                borderRadius: '10px'
              }}
            >
              <div>
                <p style={{ fontWeight: '700', fontSize: '14px' }}>{u.full_name}</p>
                <p className="muted" style={{ fontSize: '12px' }}>
                  {getRoleIcon(u.role)} {u.role} • {u.phone}
                </p>
              </div>
              <span className="muted" style={{ fontSize: '12px' }}>
                {new Date(u.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getRoleIcon(role) {
  const icons = {
    admin: '👑',
    farmer: '🌾',
    buyer: '🏪',
    agronomist: '🎓'
  };
  return icons[role] || '👤';
}
