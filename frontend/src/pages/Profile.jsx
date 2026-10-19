import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Camera, Award, TrendingUp, Package, MessageCircle, Shield, Bell, Lock, Globe, Briefcase, Star } from 'lucide-react';
import { useAuth } from '../auth';
import { api } from '../api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    region_id: '',
    preferred_lang: 'en'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        region_id: user.region_id || '',
        preferred_lang: user.preferred_lang || 'en'
      });
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // In production, call update API
      // const updated = await api.put('/auth/profile', formData);
      // setUser(updated);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      farmer: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: 'Farmer' },
      buyer: { bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', text: 'Buyer' },
      agronomist: { bg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', text: 'Agronomist' },
      admin: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', text: 'Admin' }
    };
    return colors[role] || colors.farmer;
  };

  const roleInfo = getRoleColor(user?.role);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '48px 32px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(15, 77, 42, 0.15)', maxWidth: '420px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
            <User style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: '#0F4D2A' }}>Login Required</h2>
          <p style={{ color: '#60756A', fontSize: '15px' }}>Please login to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1400px', padding: '32px' }}>
      {/* Hero Profile Banner */}
      <div style={{ background: roleInfo.bg, borderRadius: '24px', padding: '48px', marginBottom: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15, 77, 42, 0.25)' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)' }}></div>
        
        <div style={{ position: 'relative', zIndex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            {/* Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: '1', minWidth: '300px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}>
                  <User style={{ width: '60px', height: '60px', color: '#1B7F3B' }} />
                </div>
                <button style={{ position: 'absolute', bottom: '0', right: '0', width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '3px solid white', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                  <Camera style={{ width: '20px', height: '20px', color: '#1B7F3B' }} />
                </button>
              </div>
              
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '8px', lineHeight: '1.2' }}>
                  {user.full_name}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ padding: '6px 16px', background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(10px)', borderRadius: '12px', fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'capitalize' }}>
                    {roleInfo.text}
                  </span>
                  {user.is_verified && (
                    <span style={{ padding: '6px 16px', background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(10px)', borderRadius: '12px', fontSize: '14px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield style={{ width: '16px', height: '16px' }} />
                      Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '15px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone style={{ width: '18px', height: '18px' }} />
                    {user.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar style={{ width: '18px', height: '18px' }} />
                    Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: '14px 28px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '14px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {editMode ? (
                <>
                  <X style={{ width: '20px', height: '20px' }} />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 style={{ width: '20px', height: '20px' }} />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {user.role === 'farmer' && (
            <>
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', opacity: '0.5' }}></div>
                <div style={{ position: 'relative', zIndex: '1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'grid', placeItems: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                    <Package style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '700', marginBottom: '8px' }}>Active Listings</p>
                  <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#0F4D2A' }}>{stats.total_listings || 0}</h3>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', opacity: '0.5' }}></div>
                <div style={{ position: 'relative', zIndex: '1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display: 'grid', placeItems: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                    <MessageCircle style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '700', marginBottom: '8px' }}>Total Inquiries</p>
                  <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#0F4D2A' }}>{stats.total_inquiries || 0}</h3>
                </div>
              </div>
            </>
          )}

          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', opacity: '0.5' }}></div>
            <div style={{ position: 'relative', zIndex: '1' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', display: 'grid', placeItems: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
                <Star style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '700', marginBottom: '8px' }}>Rating</p>
              <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#0F4D2A' }}>
                {stats?.average_rating ? `${stats.average_rating}/5` : 'N/A'}
              </h3>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', opacity: '0.5' }}></div>
            <div style={{ position: 'relative', zIndex: '1' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', display: 'grid', placeItems: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '700', marginBottom: '8px' }}>Success Rate</p>
              <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#0F4D2A' }}>
                {stats?.success_rate ? `${stats.success_rate}%` : 'N/A'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Profile Information Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center' }}>
              <User style={{ width: '24px', height: '24px', color: '#1B7F3B' }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A' }}>Profile Information</h2>
          </div>

          {editMode ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500' }}
                  onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
                  onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500' }}
                  onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
                  onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                  Preferred Language
                </label>
                <select
                  value={formData.preferred_lang}
                  onChange={(e) => setFormData({ ...formData, preferred_lang: e.target.value })}
                  style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
                  onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
                >
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="om">Oromo</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '14px 24px',
                  background: loading ? '#E2F1E7' : 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: loading ? 'none' : '0 6px 16px rgba(15, 77, 42, 0.3)'
                }}
              >
                <Save style={{ width: '20px', height: '20px' }} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { icon: <User style={{ width: '20px', height: '20px', color: '#1B7F3B' }} />, label: 'Full Name', value: user.full_name },
                { icon: <Phone style={{ width: '20px', height: '20px', color: '#1B7F3B' }} />, label: 'Phone', value: user.phone },
                { icon: <Mail style={{ width: '20px', height: '20px', color: '#1B7F3B' }} />, label: 'Role', value: roleInfo.text },
                { icon: <Globe style={{ width: '20px', height: '20px', color: '#1B7F3B' }} />, label: 'Language', value: user.preferred_lang?.toUpperCase() || 'EN' },
                { icon: <Calendar style={{ width: '20px', height: '20px', color: '#1B7F3B' }} />, label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)', borderRadius: '14px', border: '1px solid #E2F1E7' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center', flexShrink: '0' }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: '1' }}>
                    <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '700', marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '15px', color: '#0F4D2A', fontWeight: '700' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Settings Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', display: 'grid', placeItems: 'center' }}>
              <Briefcase style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A' }}>Account Settings</h2>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { icon: <Bell style={{ width: '20px', height: '20px' }} />, title: 'Notifications', desc: 'Manage your notification preferences', color: '#F59E0B' },
              { icon: <Lock style={{ width: '20px', height: '20px' }} />, title: 'Privacy & Security', desc: 'Update password and security settings', color: '#EF4444' },
              { icon: <Shield style={{ width: '20px', height: '20px' }} />, title: 'Account Verification', desc: 'Verify your account for more features', color: '#10B981' },
              { icon: <Globe style={{ width: '20px', height: '20px' }} />, title: 'Language & Region', desc: 'Change language and regional settings', color: '#8B5CF6' }
            ].map((item, idx) => (
              <button
                key={idx}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)',
                  border: '2px solid #E2F1E7',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1B7F3B';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2F1E7';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${item.color}22`, color: item.color, display: 'grid', placeItems: 'center', flexShrink: '0' }}>
                  {item.icon}
                </div>
                <div style={{ flex: '1' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '4px' }}>{item.title}</h4>
                  <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '600' }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement Badges Section */}
      <div style={{ background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', borderRadius: '20px', padding: '32px', marginTop: '32px', border: '2px solid #C084FC', boxShadow: '0 8px 24px rgba(168, 85, 247, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}>
            <Award style={{ width: '28px', height: '28px', color: '#8B5CF6' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#581C87', marginBottom: '4px' }}>Achievement Badges</h2>
            <p style={{ fontSize: '14px', color: '#7C3AED', fontWeight: '600' }}>Earn badges by being an active member</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Early Bird', desc: 'Joined in first month', earned: true, color: '#10B981' },
            { name: 'Active Trader', desc: '10+ successful trades', earned: stats?.total_listings >= 10, color: '#3B82F6' },
            { name: 'Top Rated', desc: '4.5+ star rating', earned: stats?.average_rating >= 4.5, color: '#F59E0B' },
            { name: 'Verified Pro', desc: 'Account verified', earned: user.is_verified, color: '#8B5CF6' },
            { name: 'Community Star', desc: 'Helpful member', earned: false, color: '#EC4899' },
            { name: 'Season Expert', desc: 'Used all seasons', earned: false, color: '#14B8A6' }
          ].map((badge, idx) => (
            <div
              key={idx}
              style={{
                background: badge.earned ? 'white' : 'rgba(255, 255, 255, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                border: badge.earned ? `2px solid ${badge.color}` : '2px dashed rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s',
                opacity: badge.earned ? '1' : '0.6'
              }}
              onMouseEnter={(e) => {
                if (badge.earned) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: badge.earned ? `${badge.color}22` : '#E9D5FF', color: badge.earned ? badge.color : '#A78BFA', display: 'grid', placeItems: 'center', margin: '0 auto 12px', border: badge.earned ? `3px solid ${badge.color}` : '3px solid #E9D5FF' }}>
                <Award style={{ width: '28px', height: '28px' }} />
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: badge.earned ? '#0F4D2A' : '#A78BFA', marginBottom: '6px' }}>
                {badge.name}
              </h4>
              <p style={{ fontSize: '11px', color: badge.earned ? '#60756A' : '#A78BFA', fontWeight: '600', lineHeight: '1.4' }}>
                {badge.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
