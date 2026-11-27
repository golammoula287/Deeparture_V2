import { useEffect, useId, useRef, useState } from 'react';
import { destinations } from '@/src/lib/customer/destinations';
import HomeIcon from './HomeIcon';
import styles from './DestinationPicker.module.css';
const options = [['', 'All Destinations'], ...destinations.map(({ slug, name }) => [slug, name])];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function destinationLabel(value = '') {
  const slug = normalize(value).trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return options.find(([key]) => key === slug && (slug || !value))?.[1] || value.replace(/[-_]/g, ' ');
}

export default function DestinationPicker({ value = '', onChange, className, finder = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef(null), trigger = useRef(null), search = useRef(null);
  const id = useId();
  const term = query.trim();
  const matches = options.filter(([,label]) => normalize(label).includes(normalize(term)));
  const custom = finder && term && !matches.length ? term : '';
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const select = next => { onChange(next); close(); };
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const move = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const nodes = [...root.current.querySelectorAll('[data-destination-option]')];
      const index = nodes.indexOf(document.activeElement);
      nodes[(index + (event.key === 'ArrowDown' ? 1 : -1) + nodes.length) % nodes.length]?.focus();
    }
  };
  const label = destinationLabel(value);
  return <div ref={root} className={`${className} ${styles.picker}`} data-finder={finder || undefined} onKeyDown={move} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span><HomeIcon name="pin" size={20} />{finder ? 'Destination' : 'Destinations'}</span>
    <input type="hidden" name="destination" value={value} />
    <button ref={trigger} type="button" className={styles.trigger} aria-label="Destination" aria-describedby={`${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { setQuery(''); setOpen(previous => !previous); }}><span id={`${id}-value`}>{label}</span><HomeIcon name="chevron" size={15} /></button>
    {open && <div id={id} role="dialog" aria-label="Choose destination" className={styles.dropdown}>
      <div className={styles.search}><HomeIcon name="search" size={17} /><input ref={search} aria-label="Search destinations" placeholder="Type to search…" autoComplete="off" spellCheck={false} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (matches.length || custom) select(matches[0]?.[0] ?? custom); } }} /></div>
      <ul className={styles.options}>
        {matches.map(([key, name]) => <li key={key}><button type="button" data-destination-option aria-pressed={name === label} onClick={() => select(key)}><span>{name}</span>{name === label && <HomeIcon name="check" size={16} />}</button></li>)}
        {custom && <li><button type="button" data-destination-option onClick={() => select(custom)}>Search for “{custom}”</button></li>}
      </ul>
      {!matches.length && !custom && <p role="status" className={styles.empty}>No destinations found.</p>}
    </div>}
  </div>;
}
