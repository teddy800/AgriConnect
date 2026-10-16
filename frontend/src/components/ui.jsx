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
  const cls = `thumb ${small ? 'sm' : ''}`;
  return src
    ? <img className={cls} src={src} alt={name} loading="lazy" />
    : <div className={`${cls} thumb-empty`} role="img" aria-label={name}><Sprout size={small ? 16 : 30} /></div>;
}

const TONE = {
  active: 'ok', accepted: 'ok', completed: 'ok',
  pending: 'warn', rejected: 'bad', sold: 'muted', removed: 'muted', expired: 'muted'
};

export const StatusBadge = ({ status }) => (
  <span className={`badge ${TONE[status] || 'muted'}`} style={{ textTransform: 'capitalize' }}>{status}</span>
);