import { format, formatDistanceToNow, isValid } from 'date-fns';

export function fmtDate(d, pattern = 'd MMM yyyy') {
  const date = d instanceof Date ? d : new Date(d);
  return isValid(date) ? format(date, pattern) : '—';
}

export function fmtDateTime(d) {
  return fmtDate(d, "d MMM yyyy 'at' h:mm a");
}

export function fromNow(d) {
  const date = d instanceof Date ? d : new Date(d);
  return isValid(date) ? `${formatDistanceToNow(date)} ago` : '';
}

export function fmtBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function fmtPct(x, digits = 0) {
  if (x == null) return '—';
  return `${(x * 100).toFixed(digits)}%`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
}
