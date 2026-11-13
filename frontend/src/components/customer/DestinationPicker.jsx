import { useEffect, useId, useRef, useState } from 'react';
import HomeIcon from './HomeIcon';
import styles from './DestinationPicker.module.css';
const options = [['', 'All Destinations'], ['raja-ampat', 'Raja Ampat'], ['maldives', 'Maldives'], ['komodo', 'Komodo'], ['red-sea', 'Red Sea'], ['galapagos', 'Galápagos'], ['philippines', 'Philippines']];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function DestinationPicker({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef(null), trigger = useRef(null), search = useRef(null);
  const id = useId();
  const matches = options.filter(([,label]) => normalize(label).includes(normalize(query.trim())));
  const close = () => { setOpen(false); trigger.current?.focus(); };
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
  return <div ref={root} className={`${className} ${styles.picker}`} onKeyDown={move} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span><HomeIcon name="pin" size={20} />Destinations</span>
    <input type="hidden" name="destination" value={value} />
    <button ref={trigger} type="button" className={styles.trigger} aria-label="Destination" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { setQuery(''); setOpen(previous => !previous); }}><span>{options.find(([key]) => key === value)?.[1] || 'All Destinations'}</span><HomeIcon name="chevron" size={15} /></button>
    {open && <div id={id} role="dialog" aria-label="Choose destination" className={styles.dropdown}>
      <div className={styles.search}><HomeIcon name="search" size={17} /><input ref={search} aria-label="Search destinations" placeholder="Type to search…" autoComplete="off" spellCheck={false} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (matches.length) { onChange(matches[0][0]); close(); } } }} /></div>
      <ul className={styles.options}>{matches.map(([key,label]) => <li key={key}><button type="button" data-destination-option aria-pressed={key === value} onClick={() => { onChange(key); close(); }}><span>{label}</span>{key === value && <HomeIcon name="check" size={16} />}</button></li>)}</ul>
      {!matches.length && <p role="status" className={styles.empty}>No destinations found.</p>}
    </div>}
  </div>;
}
