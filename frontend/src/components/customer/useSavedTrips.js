import { useEffect, useState } from 'react';
const key = 'deeparture.saved-trips.v1';
function read() { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value.filter(item => item && typeof item.name === 'string' && /^\/(liveaboards|resorts)\//.test(item.href)) : []; } catch { return []; } }
export default function useSavedTrips() {
  const [saved, setSaved] = useState([]);
  const [storageError, setStorageError] = useState('');
  useEffect(() => { const refresh = () => setSaved(read()); refresh(); window.addEventListener('storage', refresh); window.addEventListener('deeparture-saved', refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener('deeparture-saved', refresh); }; }, []);
  const toggle = trip => { const current = read(); const next = current.some(item => item.href === trip.href) ? current.filter(item => item.href !== trip.href) : [...current, trip]; try { localStorage.setItem(key, JSON.stringify(next)); setSaved(next); setStorageError(''); window.dispatchEvent(new Event('deeparture-saved')); } catch { setStorageError('Your browser could not save this trip.'); } };
  return { saved, toggle, storageError };
}
