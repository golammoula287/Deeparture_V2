export function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function stayDateError(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Enter both check-in and check-out dates.';
  if (!isDateOnly(checkIn) || !isDateOnly(checkOut) || checkOut <= checkIn) {
    return 'Check-out must be after check-in.';
  }
  return '';
}

export function nextDate(value) {
  if (!isDateOnly(value)) return undefined;
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
