import React from 'react';
import { Sprout } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, hero }) {
  return (
    <div className={`stat ${hero ? 'hero' : ''}`}>
      <div className="ico"><Icon size={18} /></div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function CropThumb({ src, name = '', small }) {
  const [imgError, setImgError] = React.useState(false);
  const cls = `thumb ${small ? 'sm' : ''}`;
  
  const handleError = () => {
    setImgError(true);
  };
  
  // Show fallback if no src or image failed to load
  if (!src || imgError) {
    return (
      <div 
        className={`${cls} thumb-empty`} 
        role="img" 
        aria-label={name}
        style={{
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--g700)'
        }}
      >
        <Sprout size={small ? 16 : 30} />
      </div>
    );
  }
  
  return (
    <img 
      className={cls} 
      src={src} 
      alt={name} 
      loading="lazy" 
      onError={handleError}
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
    />
  );
}

const TONE = {
  active: 'ok', accepted: 'ok', completed: 'ok',
  pending: 'warn', rejected: 'bad', sold: 'muted', removed: 'muted', expired: 'muted'
};

export const StatusBadge = ({ status }) => (
  <span className={`badge ${TONE[status] || 'muted'}`} style={{ textTransform: 'capitalize' }}>{status}</span>
);