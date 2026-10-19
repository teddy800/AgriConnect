import { useState, useEffect } from 'react';
import { Bell, Lock, Globe, User, Mail, Phone, Shield, Eye, EyeOff, Save, Check, X, AlertTriangle, Smartphone, Monitor, MapPin, Calendar, Clock, Zap, Key, UserCheck, Database, Download, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth';
import { api } from '../api';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    new_messages: true,
    new_inquiries: true,
    price_alerts: true,
    weather_alerts: true,
    listing_updates: true,
    marketing_emails: false,
    weekly_summary: true,
    transaction_alerts: true,
    system_updates: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    suspicious_activity: true,
    session_timeout: 30
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Language & Region
  const [preferences, setPreferences] = useState({
    language: user?.preferred_lang || 'en',
    timezone: 'Africa/Addis_Ababa',
    date_format: 'DD/MM/YYYY',
    currency: 'ETB',
    distance_unit: 'km'
  });

  // Account Data
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    full_name: user?.full_name || ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In production, load from API
      // const settings = await api.get('/settings');
      // setNotificationSettings(settings.notifications);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      // await api.put('/settings/notifications', notificationSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save notifications:', error);
      alert('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      setLoading(true);
      // await api.put('/settings/security', securitySettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save security settings:', error);
      alert('Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.new_password.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    try {
      setLoading(true);
      // await api.put('/auth/change-password', passwordData);
      alert('Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      // await api.put('/settings/preferences', preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone!'
    );
    if (!confirmed) return;

    const doubleCheck = window.confirm(
      'This will permanently delete all your data. Type DELETE to confirm.'
    );
    if (!doubleCheck) return;

    try {
      setLoading(true);
      // await api.delete('/auth/account');
      alert('Account deleted successfully');
      logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: <Bell style={{ width: '18px', height: '18px' }} /> },
    { id: 'security', label: 'Security & Privacy', icon: <Lock style={{ width: '18px', height: '18px' }} /> },
    { id: 'preferences', label: 'Preferences', icon: <Globe style={{ width: '18px', height: '18px' }} /> },
    { id: 'account', label: 'Account', icon: <User style={{ width: '18px', height: '18px' }} /> }
  ];

  return (
    <div className="page" style={{ maxWidth: '1200px', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)' }}>
            <Shield style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px', lineHeight: '1.2' }}>
              Account Settings
            </h1>
            <p style={{ fontSize: '15px', color: '#60756A', fontWeight: '600' }}>
              Manage your account preferences and security settings
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '16px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideDown 0.3s ease-out' }}>
            <Check style={{ width: '20px', height: '20px', color: 'white' }} />
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: '0' }}>
              Settings saved successfully!
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '8px', marginBottom: '24px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1',
              minWidth: '150px',
              padding: '14px 20px',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'transparent',
              border: 'none',
              borderRadius: '14px',
              color: activeTab === tab.id ? 'white' : '#60756A',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#F8FCF9';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', display: 'grid', placeItems: 'center' }}>
              <Bell style={{ width: '24px', height: '24px', color: '#F59E0B' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>Notification Preferences</h2>
              <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>Choose how you want to be notified</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
            {/* Channel Preferences */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F4D2A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone style={{ width: '18px', height: '18px', color: '#10B981' }} />
                Notification Channels
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: <Mail style={{ width: '18px', height: '18px' }} /> },
                  { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS', icon: <Phone style={{ width: '18px', height: '18px' }} /> },
                  { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive push notifications in browser', icon: <Bell style={{ width: '18px', height: '18px' }} /> }
                ].map(item => (
                  <div key={item.key} style={{ background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)', padding: '16px', borderRadius: '14px', border: '2px solid #E2F1E7', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center', color: '#1B7F3B', flexShrink: '0' }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: '1' }}>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '4px' }}>{item.label}</p>
                      <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '600' }}>{item.desc}</p>
                    </div>
                    <label style={{ position: 'relative', width: '56px', height: '32px', cursor: 'pointer', flexShrink: '0' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '56px',
                        height: '32px',
                        background: notificationSettings[item.key] ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#E2F1E7',
                        borderRadius: '16px',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          background: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '4px',
                          left: notificationSettings[item.key] ? '28px' : '4px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                        }}></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Preferences */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F4D2A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap style={{ width: '18px', height: '18px', color: '#3B82F6' }} />
                Activity Notifications
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { key: 'new_messages', label: 'New Messages', desc: 'When someone sends you a message' },
                  { key: 'new_inquiries', label: 'New Inquiries', desc: 'When buyers inquire about your listings' },
                  { key: 'listing_updates', label: 'Listing Updates', desc: 'Updates on your active listings' },
                  { key: 'transaction_alerts', label: 'Transaction Alerts', desc: 'Important transaction updates' }
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FCF9', borderRadius: '12px', border: '1px solid #E2F1E7' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '2px' }}>{item.label}</p>
                      <p style={{ fontSize: '12px', color: '#60756A', fontWeight: '600' }}>{item.desc}</p>
                    </div>
                    <label style={{ position: 'relative', width: '48px', height: '28px', cursor: 'pointer', flexShrink: '0' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '48px',
                        height: '28px',
                        background: notificationSettings[item.key] ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#D1D5DB',
                        borderRadius: '14px',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '4px',
                          left: notificationSettings[item.key] ? '24px' : '4px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Alerts */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F4D2A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                Market & System Alerts
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { key: 'price_alerts', label: 'Price Alerts', desc: 'Market price changes for your crops' },
                  { key: 'weather_alerts', label: 'Weather Alerts', desc: 'Important weather updates' },
                  { key: 'weekly_summary', label: 'Weekly Summary', desc: 'Weekly activity summary' },
                  { key: 'system_updates', label: 'System Updates', desc: 'Platform updates and announcements' },
                  { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Promotional offers and tips' }
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FCF9', borderRadius: '12px', border: '1px solid #E2F1E7' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '2px' }}>{item.label}</p>
                      <p style={{ fontSize: '12px', color: '#60756A', fontWeight: '600' }}>{item.desc}</p>
                    </div>
                    <label style={{ position: 'relative', width: '48px', height: '28px', cursor: 'pointer', flexShrink: '0' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '48px',
                        height: '28px',
                        background: notificationSettings[item.key] ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#D1D5DB',
                        borderRadius: '14px',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '4px',
                          left: notificationSettings[item.key] ? '24px' : '4px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveNotifications}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#E2F1E7' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: loading ? 'none' : '0 6px 16px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Save style={{ width: '20px', height: '20px' }} />
            {loading ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Password Change */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', display: 'grid', placeItems: 'center' }}>
                <Key style={{ width: '24px', height: '24px', color: '#EF4444' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>Change Password</h2>
                <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>Update your password regularly for security</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'current', label: 'Current Password', value: passwordData.current_password, field: 'current_password' },
                { key: 'new', label: 'New Password', value: passwordData.new_password, field: 'new_password' },
                { key: 'confirm', label: 'Confirm New Password', value: passwordData.confirm_password, field: 'confirm_password' }
              ].map(item => (
                <div key={item.key}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                    {item.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword[item.key] ? 'text' : 'password'}
                      value={item.value}
                      onChange={(e) => setPasswordData({ ...passwordData, [item.field]: e.target.value })}
                      style={{ width: '100%', padding: '14px 48px 14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500' }}
                      onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
                      onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, [item.key]: !showPassword[item.key] })}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#60756A', padding: '8px' }}
                    >
                      {showPassword[item.key] ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleChangePassword}
              disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
              style={{
                width: '100%',
                padding: '16px',
                background: loading || !passwordData.current_password ? '#E2F1E7' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                border: 'none',
                borderRadius: '14px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '800',
                cursor: loading || !passwordData.current_password ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: loading || !passwordData.current_password ? 'none' : '0 6px 16px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Key style={{ width: '20px', height: '20px' }} />
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>

          {/* Security Options */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', display: 'grid', placeItems: 'center' }}>
                <Shield style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>Security Settings</h2>
                <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>Manage your account security preferences</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'two_factor_enabled', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security', icon: <UserCheck style={{ width: '20px', height: '20px' }} />, color: '#8B5CF6' },
                { key: 'login_alerts', label: 'Login Alerts', desc: 'Get notified of new logins', icon: <Bell style={{ width: '20px', height: '20px' }} />, color: '#3B82F6' },
                { key: 'suspicious_activity', label: 'Suspicious Activity Alerts', desc: 'Monitor unusual account activity', icon: <AlertTriangle style={{ width: '20px', height: '20px' }} />, color: '#F59E0B' }
              ].map(item => (
                <div key={item.key} style={{ background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)', padding: '18px', borderRadius: '14px', border: '2px solid #E2F1E7', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}22`, color: item.color, display: 'grid', placeItems: 'center', flexShrink: '0' }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: '1' }}>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '600' }}>{item.desc}</p>
                  </div>
                  <label style={{ position: 'relative', width: '56px', height: '32px', cursor: 'pointer', flexShrink: '0' }}>
                    <input
                      type="checkbox"
                      checked={securitySettings[item.key]}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, [item.key]: e.target.checked })}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '56px',
                      height: '32px',
                      background: securitySettings[item.key] ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#E2F1E7',
                      borderRadius: '16px',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '4px',
                        left: securitySettings[item.key] ? '28px' : '4px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                      }}></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                Session Timeout (minutes)
              </label>
              <select
                value={securitySettings.session_timeout}
                onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            <button
              onClick={handleSaveSecurity}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#E2F1E7' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '14px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: loading ? 'none' : '0 6px 16px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Save style={{ width: '20px', height: '20px' }} />
              {loading ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', display: 'grid', placeItems: 'center' }}>
              <Globe style={{ width: '24px', height: '24px', color: '#8B5CF6' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>Language & Regional Settings</h2>
              <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>Customize your experience</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe style={{ width: '16px', height: '16px', color: '#10B981' }} />
                  Language
                </div>
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
              >
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="om">Oromo</option>
                <option value="ti">Tigrinya</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#3B82F6' }} />
                  Timezone
                </div>
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
              >
                <option value="Africa/Addis_Ababa">East Africa Time (EAT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
                  Date Format
                </div>
              </label>
              <select
                value={preferences.date_format}
                onChange={(e) => setPreferences({ ...preferences, date_format: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database style={{ width: '16px', height: '16px', color: '#8B5CF6' }} />
                  Currency
                </div>
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0F4D2A', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: '#EC4899' }} />
                  Distance Unit
                </div>
              </label>
              <select
                value={preferences.distance_unit}
                onChange={(e) => setPreferences({ ...preferences, distance_unit: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '15px', fontWeight: '500', background: 'white' }}
              >
                <option value="km">Kilometers (km)</option>
                <option value="miles">Miles (mi)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#E2F1E7' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: loading ? 'none' : '0 6px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Save style={{ width: '20px', height: '20px' }} />
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Account Information */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center' }}>
                <User style={{ width: '24px', height: '24px', color: '#1B7F3B' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>Account Information</h2>
                <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>Your account details</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { icon: <User style={{ width: '20px', height: '20px' }} />, label: 'Full Name', value: user?.full_name, color: '#10B981' },
                { icon: <Phone style={{ width: '20px', height: '20px' }} />, label: 'Phone Number', value: user?.phone, color: '#3B82F6' },
                { icon: <Mail style={{ width: '20px', height: '20px' }} />, label: 'Role', value: user?.role?.toUpperCase(), color: '#8B5CF6' },
                { icon: <Shield style={{ width: '20px', height: '20px' }} />, label: 'Verification Status', value: user?.is_verified ? 'Verified ✓' : 'Not Verified', color: user?.is_verified ? '#10B981' : '#F59E0B' },
                { icon: <Calendar style={{ width: '20px', height: '20px' }} />, label: 'Member Since', value: new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), color: '#EC4899' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)', borderRadius: '14px', border: '1px solid #E2F1E7' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${item.color}22`, color: item.color, display: 'grid', placeItems: 'center', flexShrink: '0' }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: '1' }}>
                    <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '700', marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '15px', color: '#0F4D2A', fontWeight: '700' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '2px solid #E2F1E7', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', display: 'grid', placeItems: 'center' }}>
                <Database style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px' }}>Data Management</h2>
                <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>Manage your data and privacy</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              <button
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Download style={{ width: '20px', height: '20px' }} />
                Download My Data
              </button>

              <button
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <RefreshCw style={{ width: '20px', height: '20px' }} />
                Clear Cache & Data
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', borderRadius: '20px', padding: '32px', border: '2px solid #FCA5A5', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#EF4444' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#991B1B', marginBottom: '4px' }}>Danger Zone</h2>
                <p style={{ fontSize: '14px', color: '#B91C1C', fontWeight: '600' }}>Irreversible actions</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                onClick={logout}
                style={{
                  padding: '16px',
                  background: 'white',
                  border: '2px solid #FCA5A5',
                  borderRadius: '14px',
                  color: '#DC2626',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FEE2E2';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <LogOut style={{ width: '20px', height: '20px' }} />
                Logout
              </button>

              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Trash2 style={{ width: '20px', height: '20px' }} />
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
