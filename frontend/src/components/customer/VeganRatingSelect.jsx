import HomeIcon from './HomeIcon';

export default function VeganRatingSelect({ value, onChange, className }) {
  return <label className={className}>
    <span><HomeIcon name="leaf" size={20} />Vegan Rating</span>
    <select aria-label="Deeparture’s Vegan Rating" value={value || ''} onChange={event => onChange(event.target.value)}>
      <option value="">Any rating</option>
      <option value="3">3 / 5 and above</option>
      <option value="4">4 / 5 and above</option>
      <option value="5">5 / 5</option>
    </select>
  </label>;
}
