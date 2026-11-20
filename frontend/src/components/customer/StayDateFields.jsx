import HomeIcon from './HomeIcon';
import { nextDate } from '@/src/lib/customer/searchDates';

export default function StayDateFields({ checkIn, checkOut, onChange, className }) {
  return <>
    <label className={className}>
      <span><HomeIcon name="calendar" size={20} />Check-in</span>
      <input type="date" name="checkIn" required value={checkIn || ''} onChange={event => onChange('checkIn', event.target.value)} />
    </label>
    <label className={className}>
      <span><HomeIcon name="calendar" size={20} />Check-out</span>
      <input type="date" name="checkOut" required min={nextDate(checkIn)} value={checkOut || ''} onChange={event => onChange('checkOut', event.target.value)} />
    </label>
  </>;
}
