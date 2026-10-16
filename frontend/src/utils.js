export const etb = n => `ETB ${Number(n).toLocaleString('en-US')}`;
export const num = n => Number(n).toLocaleString('en-US');
export const fmtDate = d =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });