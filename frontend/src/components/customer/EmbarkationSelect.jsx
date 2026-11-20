export default function EmbarkationSelect({ ports, error, value, onChange }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{error ? 'Ports couldn’t load' : 'Any departure port'}</option>
      {value && !ports.some(port => port.slug === value) && <option value={value}>{value}</option>}
      {ports.map(port => <option key={port.slug} value={port.slug}>{port.name}</option>)}
    </select>
  );
}
