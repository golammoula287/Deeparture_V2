export const words = value => String(value || '').replace(/[-_]/g, ' ');
export const productHref = (item, type = 'vessel') => `/${type === 'resort' ? 'resorts' : 'liveaboards'}/${encodeURIComponent(item.slug)}`;
export function mediaUrl(value) {
  if (typeof value !== 'string') return '';
  return /^(https?:\/\/|\/(?!\/))/.test(value) ? value : '';
}
export function priceLabel(amount, currency) {
  if (amount === null || amount === undefined || amount === '' || !Number.isFinite(Number(amount))) return 'Price on request';
  if (!currency) return 'Price on request';
  try { return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(amount)); } catch { return 'Price on request'; }
}
export function dateLabel(date) {
  if (!date || !Number.isFinite(new Date(date).getTime())) return 'Dates on request';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}
