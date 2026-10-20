import { Shield, Check, X, Users, Key, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../auth';
import { usePermissions, Can, HasRole, PERMISSIONS, ROLE_INFO } from '../rbac';

export default function RBACDemo() {
  const { user } = useAuth();
  const { permissions, can, isAdmin, isFarmer, isBuyer, isAgronomist } = usePermissions();

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Please login to view RBAC demo</p>
      </div>
    );
  }

  const roleInfo = ROLE_INFO[user.role];

  // Group permissions by category
  const permissionCategories = {
    'Listings': [
      PERMISSIONS.LISTING_CREATE,
      PERMISSIONS.LISTING_READ,
      PERMISSIONS.LISTING_UPDATE,
      PERMISSIONS.LISTING_DELETE,
      PERMISSIONS.LISTING_READ_ALL,
      PERMISSIONS.LISTING_MANAGE_ALL
    ],
    'Inquiries': [
      PERMISSIONS.INQUIRY_CREATE,
      PERMISSIONS.INQUIRY_READ,
      PERMISSIONS.INQUIRY_UPDATE,
      PERMISSIONS.INQUIRY_DELETE,
      PERMISSIONS.INQUIRY_READ_ALL
    ],
    'Messages': [
      PERMISSIONS.MESSAGE_SEND,
      PERMISSIONS.MESSAGE_READ,
      PERMISSIONS.MESSAGE_DELETE,
      PERMISSIONS.MESSAGE_READ_ALL
    ],
    'Market Data': [
      PERMISSIONS.PRICE_READ,
      PERMISSIONS.PRICE_CREATE,
      PERMISSIONS.WEATHER_READ,
      PERMISSIONS.WEATHER_CREATE
    ],
    'Advisory': [
      PERMISSIONS.ADVISORY_READ,
      PERMISSIONS.ADVISORY_CREATE,
      PERMISSIONS.ADVISORY_UPDATE,
      PERMISSIONS.ADVISORY_DELETE
    ],
    'User Management': [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_READ_ALL,
      PERMISSIONS.USER_MANAGE_ALL,
      PERMISSIONS.USER_VERIFY
    ],
    'Admin': [
      PERMISSIONS.ADMIN_DASHBOARD,
      PERMISSIONS.ADMIN_REPORTS,
      PERMISSIONS.ADMIN_SETTINGS,
      PERMISSIONS.ADMIN_LOGS
    ],
    'Analytics': [
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT
    ],
    'Settings': [
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_UPDATE,
      PERMISSIONS.SETTINGS_MANAGE_ALL
    ]
  };

  return (
    <div className="page" style={{ maxWidth: '1400px', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${roleInfo.color}22 0%, ${roleInfo.color}44 100%)`,
            display: 'grid',
            placeItems: 'center',
            fontSize: '32px',
            border: `2px solid ${roleInfo.color}33`,
            boxShadow: `0 8px 24px ${roleInfo.color}33`
          }}>
            {roleInfo.icon}
          </div>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#0F4D2A',
              marginBottom: '4px',
              lineHeight: '1.2'
            }}>
              Role-Based Access Control
            </h1>
            <p style={{ fontSize: '15px', color: '#60756A', fontWeight: '600' }}>
              Your permissions and access levels in AgriConnect
            </p>
          </div>
        </div>
      </div>

      {/* Current User Info */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '24px',
        border: '2px solid #E2F1E7',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Shield style={{ width: '24px', height: '24px', color: roleInfo.color }} />
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F4D2A', margin: '0' }}>
                Your Role: {roleInfo.name}
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600', marginBottom: '16px' }}>
              {roleInfo.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                padding: '8px 16px',
                background: `${roleInfo.color}11`,
                border: `2px solid ${roleInfo.color}33`,
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                color: roleInfo.color
              }}>
                👤 {user.full_name}
              </div>
              <div style={{
                padding: '8px 16px',
                background: `${roleInfo.color}11`,
                border: `2px solid ${roleInfo.color}33`,
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                color: roleInfo.color
              }}>
                📞 {user.phone}
              </div>
              {user.is_verified && (
                <div style={{
                  padding: '8px 16px',
                  background: '#D1FAE5',
                  border: '2px solid #6EE7B7',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Check style={{ width: '16px', height: '16px' }} />
                  Verified
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #F8FCF9 0%, white 100%)',
            padding: '20px',
            borderRadius: '16px',
            border: '2px solid #E2F1E7',
            textAlign: 'center',
            minWidth: '200px'
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: roleInfo.color, marginBottom: '8px' }}>
              {permissions.length}
            </div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#60756A' }}>
              Total Permissions
            </p>
          </div>
        </div>
      </div>

      {/* Role Comparison */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '24px',
        border: '2px solid #E2F1E7',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#0F4D2A',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Users style={{ width: '24px', height: '24px', color: '#10B981' }} />
          All Roles in System
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {Object.entries(ROLE_INFO).map(([role, info]) => (
            <div
              key={role}
              style={{
                padding: '20px',
                background: user.role === role ? `linear-gradient(135deg, ${info.color}11 0%, ${info.color}22 100%)` : '#F8FCF9',
                border: user.role === role ? `2px solid ${info.color}` : '2px solid #E2F1E7',
                borderRadius: '16px',
                position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              {user.role === role && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px 10px',
                  background: info.color,
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '900',
                  textTransform: 'uppercase'
                }}>
                  You
                </div>
              )}
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{info.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F4D2A', marginBottom: '8px' }}>
                {info.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '600', lineHeight: '1.5' }}>
                {info.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px',
        border: '2px solid #E2F1E7',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#0F4D2A',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Key style={{ width: '24px', height: '24px', color: '#10B981' }} />
          Your Permissions Matrix
        </h2>

        <div style={{ display: 'grid', gap: '20px' }}>
          {Object.entries(permissionCategories).map(([category, perms]) => {
            const categoryPermissions = perms.filter(p => permissions.includes(p));
            const hasAny = categoryPermissions.length > 0;

            return (
              <div
                key={category}
                style={{
                  background: hasAny ? 'linear-gradient(135deg, #F0FDF4 0%, white 100%)' : '#F8F9FA',
                  padding: '20px',
                  borderRadius: '16px',
                  border: hasAny ? '2px solid #BBF7D0' : '2px solid #E5E7EB'
                }}
              >
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '800',
                  color: '#0F4D2A',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {hasAny ? (
                    <Unlock style={{ width: '18px', height: '18px', color: '#10B981' }} />
                  ) : (
                    <Lock style={{ width: '18px', height: '18px', color: '#9CA3AF' }} />
                  )}
                  {category}
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: hasAny ? '#10B981' : '#9CA3AF'
                  }}>
                    {categoryPermissions.length}/{perms.length}
                  </span>
                </h3>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {perms.map(permission => {
                    const hasPerm = can(permission);
                    return (
                      <div
                        key={permission}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: hasPerm ? 'white' : '#F8F9FA',
                          borderRadius: '10px',
                          border: hasPerm ? '1px solid #BBF7D0' : '1px solid #E5E7EB'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: hasPerm ? '#10B981' : '#E5E7EB',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: '0'
                        }}>
                          {hasPerm ? (
                            <Check style={{ width: '16px', height: '16px', color: 'white' }} />
                          ) : (
                            <X style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                          )}
                        </div>
                        <code style={{
                          fontSize: '13px',
                          fontWeight: hasPerm ? '700' : '600',
                          color: hasPerm ? '#0F4D2A' : '#9CA3AF',
                          fontFamily: 'monospace'
                        }}>
                          {permission}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Examples */}
      <div style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, white 100%)',
        borderRadius: '20px',
        padding: '28px',
        marginTop: '24px',
        border: '2px solid #BFDBFE',
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#1E40AF',
          marginBottom: '16px'
        }}>
          💡 RBAC Usage Examples
        </h2>
        <div style={{ display: 'grid', gap: '12px', fontSize: '14px', color: '#1E40AF', fontWeight: '600' }}>
          <Can permission={PERMISSIONS.LISTING_CREATE}>
            <div style={{ padding: '12px 16px', background: 'white', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
              ✅ You can create new listings
            </div>
          </Can>
          <Can permission={PERMISSIONS.INQUIRY_CREATE}>
            <div style={{ padding: '12px 16px', background: 'white', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
              ✅ You can send inquiries
            </div>
          </Can>
          <Can permission={PERMISSIONS.ADVISORY_CREATE}>
            <div style={{ padding: '12px 16px', background: 'white', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
              ✅ You can create advisory content
            </div>
          </Can>
          <Can permission={PERMISSIONS.ADMIN_DASHBOARD}>
            <div style={{ padding: '12px 16px', background: 'white', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
              ✅ You have admin dashboard access
            </div>
          </Can>
        </div>
      </div>
    </div>
  );
}
