import { useState } from 'react';
import styles from './SearchFilters.module.css';

export function priceRangeError({ minPrice, maxPrice }) {
  const bounds = [minPrice, maxPrice].filter(Boolean).map(Number);
  if (bounds.some(value => !Number.isFinite(value) || value < 0)) return 'Enter non-negative prices in USD.';
  if (bounds.length === 2 && bounds[0] > bounds[1]) return 'Maximum price must be at least the minimum price.';
  return '';
}

export default function PriceRange({ value, onChange }) {
  const { minPrice = '', maxPrice = '' } = value;
  const [sliderCeiling, setSliderCeiling] = useState(10000);
  const ceiling = Math.max(sliderCeiling, Math.ceil(Math.max(Number(minPrice) || 0, Number(maxPrice) || 0) / 1000) * 1000);
  const lower = Math.max(0, Number(minPrice) || 0);
  const upper = maxPrice === '' ? ceiling : Math.max(0, Number(maxPrice) || 0);
  const fillStart = Math.min(lower, upper) / ceiling * 100;
  const fillEnd = Math.max(lower, upper) / ceiling * 100;

  return <div className={styles.priceRange}>
    <div className={styles.slider} data-near={fillEnd - fillStart < 10 || undefined} style={{ '--range-start': `${fillStart}%`, '--range-end': `${fillEnd}%` }}>
      <input type="range" min="0" max={ceiling} step="0.01" aria-label="Minimum price slider" value={lower}
        onChange={event => { setSliderCeiling(ceiling); onChange('minPrice', String(Math.min(upper, Number(event.target.value)))); }} />
      <input type="range" min="0" max={ceiling} step="0.01" aria-label="Maximum price slider" value={upper}
        onChange={event => { setSliderCeiling(ceiling); onChange('maxPrice', String(Math.max(lower, Number(event.target.value)))); }} />
    </div>
    <div className={styles.bounds}>
      <label>Minimum price<input type="number" min="0" step="any" inputMode="decimal" value={minPrice} placeholder="No minimum" onChange={event => onChange('minPrice', event.target.value)} /></label>
      <label>Maximum price<input type="number" min="0" step="any" inputMode="decimal" value={maxPrice} placeholder="No maximum" onChange={event => onChange('maxPrice', event.target.value)} /></label>
    </div>
  </div>;
}
