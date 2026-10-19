import { useState, useEffect } from 'react';
import { Bell, MessageCircle, Package, TrendingUp, Cloud, Lightbulb, AlertTriangle, CheckCircle, Info, X, Trash2, Check, Filter, Search, Calendar, Clock, User, DollarSign, Star } from 'lucide-react';
import { useAuth } from '../auth';
import { api } from '../api';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // const data = await api.get('/notifications');
      
      // Mock data for demonstration
      const mockNotifications = [
        {
          id: 1,
          type: 'message',
          title: 'New Message from Buyer',
          message: 'John Doe sent you a message about Teff listing',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          read: false,
          icon: 'message',
          priority: 'high'
        },
        {
          id: 2,
          type: 'inquiry',
          title: 'New Inquiry Received',
          message: 'Sarah received an inquiry for Coffee beans - 50kg',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: false,
          icon: 'package',
          priority: 'high'
        },
        {
          id: 3,
          type: 'price',
          title: 'Price Alert: Teff',
          message: 'Teff prices increased by 15% in your region',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          read: true,
          icon: 'trending',
          priority: 'medium'
        },
        {
          id: 4,
          type: 'weather',
          title: 'Weather Alert',
          message: 'Heavy rainfall expected in Addis Ababa tomorrow',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          read: true,
          icon: 'weather',
          priority: 'high'
        },
        {
          id: 5,
          type: 'advisory',
          title: 'Farming Tip',
          message: 'Optimal planting time for Barley is approaching',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          read: true,
          icon: 'advisory',
          priority: 'low'
        },
        {
          id: 6,
          type: 'system',
          title: 'Account Verified',
          message: 'Your account has been successfully verified!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          read: true,
          icon: 'success',
          priority: 'medium'
        },
        {
          id: 7,
          type: 'transaction',
          title: 'Payment Received',
          message: 'You received a payment of 5,000 ETB for Wheat - 100kg',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          read: true,
          icon: 'dollar',
          priority: 'high'
        },
        {
          id: 8,
          type: 'rating',
          title: 'New Review',
          message: 'A buyer left you a 5-star review!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
          read: true,
          icon: 'star',
          priority: 'low'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (iconType) => {
    const iconMap = {
      message: { component: <MessageCircle style={{ width: '20px', height: '20px' }} />, color: '#3B82F6', bg: '#DBEAFE' },
      package: { component: <Package style={{ width: '20px', height: '20px' }} />, color: '#10B981', bg: '#D1FAE5' },
      trending: { component: <TrendingUp style={{ width: '20px', height: '20px' }} />, color: '#F59E0B', bg: '#FEF3C7' },
      weather: { component: <Cloud style={{ width: '20px', height: '20px' }} />, color: '#06B6D4', bg: '#CFFAFE' },
      advisory: { component: <Lightbulb style={{ width: '20px', height: '20px' }} />, color: '#8B5CF6', bg: '#EDE9FE' },
      warning: { component: <AlertTriangle style={{ width: '20px', height: '20px' }} />, color: '#EF4444', bg: '#FEE2E2' },
      success: { component: <CheckCircle style={{ width: '20px', height: '20px' }} />, color: '#10B981', bg: '#D1FAE5' },
      info: { component: <Info style={{ width: '20px', height: '20px' }} />, color: '#6366F1', bg: '#E0E7FF' },
      dollar: { component: <DollarSign style={{ width: '20px', height: '20px' }} />, color: '#10B981', bg: '#D1FAE5' },
      star: { component: <Star style={{ width: '20px', height: '20px' }} />, color: '#F59E0B', bg: '#FEF3C7' }
    };
    return iconMap[iconType] || iconMap.info;
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      // await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      // await api.delete('/notifications/bulk', { ids: selectedNotifications });
      setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const toggleSelectNotification = (notificationId) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'unread') return !n.read;
      if (filter === 'read') return n.read;
      if (filter !== 'all') return n.type === filter;
      return true;
    })
    .filter(n => {
      if (!searchQuery) return true;
      return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             n.message.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filterOptions = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'message', label: 'Messages', icon: <MessageCircle style={{ width: '16px', height: '16px' }} /> },
    { value: 'inquiry', label: 'Inquiries', icon: <Package style={{ width: '16px', height: '16px' }} /> },
    { value: 'price', label: 'Prices', icon: <TrendingUp style={{ width: '16px', height: '16px' }} /> },
    { value: 'weather', label: 'Weather', icon: <Cloud style={{ width: '16px', height: '16px' }} /> }
  ];

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '48px 32px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(15, 77, 42, 0.15)', maxWidth: '420px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
            <Bell style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: '#0F4D2A' }}>Login Required</h2>
          <p style={{ color: '#60756A', fontSize: '15px' }}>Please login to view your notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1000px', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)', position: 'relative' }}>
              <Bell style={{ width: '32px', height: '32px', color: 'white' }} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', display: 'grid', placeItems: 'center', border: '3px solid white', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)' }}>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>{unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F4D2A', marginBottom: '4px', lineHeight: '1.2' }}>
                Notifications
              </h1>
              <p style={{ fontSize: '15px', color: '#60756A', fontWeight: '600' }}>
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up! 🎉'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '14px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Check style={{ width: '18px', height: '18px' }} />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#60756A' }} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                border: '2px solid #E2F1E7',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '500',
                background: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
              onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '8px', border: '2px solid #E2F1E7', display: 'flex', gap: '8px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                style={{
                  padding: '10px 16px',
                  background: filter === option.value ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: filter === option.value ? 'white' : '#60756A',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  flexShrink: '0'
                }}
                onMouseEnter={(e) => {
                  if (filter !== option.value) {
                    e.currentTarget.style.background = '#F8FCF9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== option.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {option.icon}
                {option.label}
                {option.count !== undefined && (
                  <span style={{
                    padding: '2px 8px',
                    background: filter === option.value ? 'rgba(255, 255, 255, 0.25)' : '#E2F1E7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '900'
                  }}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', padding: '14px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: '0' }}>
                {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedNotifications([])}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '60px', height: '60px', border: '6px solid #E2F1E7', borderTop: '6px solid #10B981', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#60756A' }}>Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '20px', border: '2px solid #E2F1E7' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <Bell style={{ width: '40px', height: '40px', color: '#60756A' }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F4D2A', marginBottom: '8px' }}>
            No notifications found
          </h3>
          <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600' }}>
            {searchQuery ? 'Try adjusting your search' : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredNotifications.map(notification => {
            const iconData = getNotificationIcon(notification.icon);
            return (
              <div
                key={notification.id}
                style={{
                  background: notification.read ? 'white' : 'linear-gradient(135deg, #F0FDF4 0%, white 100%)',
                  border: notification.read ? '2px solid #E2F1E7' : '2px solid #BBF7D0',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'start',
                  boxShadow: notification.read ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 16px rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = notification.read ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 16px rgba(16, 185, 129, 0.1)';
                }}
              >
                {/* Checkbox */}
                <label style={{ marginTop: '2px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelectNotification(notification.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10B981' }}
                  />
                </label>

                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: iconData.bg,
                  color: iconData.color,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: '0'
                }}>
                  {iconData.component}
                </div>

                {/* Content */}
                <div style={{ flex: '1', minWidth: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#0F4D2A',
                      margin: '0',
                      lineHeight: '1.4'
                    }}>
                      {notification.title}
                      {!notification.read && (
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10B981',
                          marginLeft: '8px',
                          animation: 'pulse 2s infinite'
                        }}></span>
                      )}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: '#60756A',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                    lineHeight: '1.5'
                  }}>
                    {notification.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#60756A', fontWeight: '600' }}>
                      <Clock style={{ width: '14px', height: '14px' }} />
                      {getTimeAgo(notification.timestamp)}
                    </div>

                    {notification.priority && (
                      <span style={{
                        padding: '4px 10px',
                        background: notification.priority === 'high' ? '#FEE2E2' : notification.priority === 'medium' ? '#FEF3C7' : '#E0F2FE',
                        color: notification.priority === 'high' ? '#DC2626' : notification.priority === 'medium' ? '#D97706' : '#0284C7',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {notification.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: '0' }}>
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Mark as read"
                    >
                      <Check style={{ width: '18px', height: '18px' }} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(notification.id)}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Delete"
                  >
                    <Trash2 style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
