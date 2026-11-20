import { useEffect, useRef, useState } from 'react';
import { stayDateError } from '@/src/lib/customer/searchDates';
import DepartureWindow from './DepartureWindow';
import StayDateFields from './StayDateFields';
import HomeIcon from './HomeIcon';
import EmbarkationSelect from './EmbarkationSelect';
import DestinationPicker from './DestinationPicker';
import baseStyles from './HomePage.module.css';
import searchStyles from './HomeSearch.module.css';
const styles = { ...baseStyles, ...searchStyles };

const empty = { destination: '', startDate: '', endDate: '', checkIn: '', checkOut: '', minPrice: '', maxPrice: '', minNights: '', maxNights: '', embarkation: '', veganRatingMin: '', attributes: [] };
const groups = { dietary: 'Dietary needs', accessibility: 'Accessibility', facility: 'Facilities & amenities', diving: 'Diving preferences', accommodation: 'Accommodation', sustainability: 'Sustainability', other: 'Other preferences' };

export default function HomeSearch({ definitions = [], definitionsError = false, ports = [], portsError = false }) {
  const [kind, setKind] = useState('vessel');
  const [criteria, setCriteria] = useState(empty);
  const [draft, setDraft] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const resort = kind === 'resort';
  const availableDefinitions = definitions.filter(def => def.active !== false && def.filterable !== false && (def.applicableTo || []).some(type => type === kind || type === 'both'));
  const shortcuts = [['wifi', 'Wi-Fi', 'wifi'], ['accessible', 'Accessible', 'needs'], ['nitrox', 'Nitrox', 'tank'], ['photography', 'Photography', 'camera'], ['rebreather', 'Rebreather', 'filters']];
  const shortcutPattern = label => label === 'Accessible' ? /accessib|step.free|wheelchair|mobility/i : label === 'Photography' ? /photograph|camera.room/i : new RegExp(label === 'Wi-Fi' ? 'wi.?fi' : label, 'i');
  const shortcutDefinition = label => {
    const pattern = shortcutPattern(label);
    const eligible = availableDefinitions.filter(def => def.dataType === 'boolean');
    const exactKey = { Nitrox: 'nitrox', Photography: 'photography' }[label];
    return eligible.find(def => def.key === exactKey) || eligible.find(def => pattern.test(`${def.key} ${def.label}`));
  };
  const quickFilter = definition => {
    if (!definition) { openFilters(); return; }
    setCriteria(previous => ({ ...previous, attributes: previous.attributes.some(item => item.key === definition.key) ? previous.attributes.filter(item => item.key !== definition.key) : [...previous.attributes, { key: definition.key, op: 'eq', value: true }] }));
  };
  const set = (key, value) => { setCriteria(previous => ({ ...previous, [key]: value })); setError(''); };
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const element = dialog.current;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [open]);
  const filterCount = criteria.attributes.length + ['minPrice', 'maxPrice', 'minNights', 'maxNights', 'embarkation'].filter(key => criteria[key]).length;
  const validate = value => {
    if (value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice)) return 'Maximum price must be at least the minimum price.';
    if (value.minNights && value.maxNights && Number(value.minNights) > Number(value.maxNights)) return 'Maximum nights must be at least the minimum nights.';
    if (value.startDate && value.endDate && value.startDate > value.endDate) return 'The To date must be on or after the From date.';
    return '';
  };
  const openFilters = () => { setDraft({ ...criteria, attributes: [...criteria.attributes] }); setError(''); setOpen(true); };
  const chooseKind = next => {
    if (next === kind) return;
    setKind(next); setError('');
    setCriteria(previous => ({ ...previous, minNights: '', maxNights: '', embarkation: '', attributes: previous.attributes.filter(item => definitions.some(def => def.key === item.key && (def.applicableTo || []).some(type => type === next || type === 'both'))) }));
  };
  const submit = event => {
    const message = (resort && stayDateError(criteria.checkIn, criteria.checkOut)) || validate(criteria);
    if (message) { event.preventDefault(); setError(message); }
  };
  const changeAttribute = (definition, value) => setDraft(previous => ({ ...previous, attributes: [...previous.attributes.filter(item => item.key !== definition.key), ...(value === '' || value === false || (Array.isArray(value) && !value.length) ? [] : [{ key: definition.key, op: Array.isArray(value) ? 'all' : 'eq', value }])] }));
  const ratingSelect = (value, onChange, className) => <label className={className}><span><HomeIcon name="leaf" size={20} />Vegan Rating</span><select aria-label="Deeparture’s Vegan Rating" value={value} onChange={event => onChange(event.target.value)}><option value="">Any rating</option><option value="3">3 / 5 and above</option><option value="4">4 / 5 and above</option><option value="5">5 / 5</option></select></label>;
  return <section className={styles.search} id="find-your-trip" aria-label="Find your dive adventure">
    <div className={styles.searchTop}><div className={styles.productSwitch} role="group" aria-label="Search product type"><button type="button" aria-pressed={!resort} onClick={() => chooseKind('vessel')}><HomeIcon name="boat" size={20} />Liveaboards</button><button type="button" aria-pressed={resort} onClick={() => chooseKind('resort')}><HomeIcon name="resort" size={20} />Resorts</button><a href="#special-offers"><HomeIcon name="tag" size={20} />Special Offers</a></div></div>
    <form action={resort ? '/explore/resorts' : '/explore/liveaboards'} method="get" onSubmit={submit}>
      <div className={`${styles.searchFields} ${resort ? styles.resortSearch : ''}`}>
        <DestinationPicker className={styles.field} value={criteria.destination} onChange={value => set('destination', value)} />
        {resort
          ? <StayDateFields className={styles.field} checkIn={criteria.checkIn} checkOut={criteria.checkOut} onChange={set} />
          : <DepartureWindow className={styles.field} label="Departure Window" startDate={criteria.startDate} endDate={criteria.endDate} onChange={range => setCriteria(previous => ({ ...previous, ...range }))} />}
        {ratingSelect(criteria.veganRatingMin, value => set('veganRatingMin', value), styles.field)}
        <button className={styles.searchButton} type="submit"><HomeIcon name="search" size={20} />Search</button>
      </div>
      {['minPrice', 'maxPrice', 'veganRatingMin', 'minNights', 'maxNights', 'embarkation'].map(key => <input key={key} type="hidden" name={key} value={criteria[key]} />)}
      <input type="hidden" name="attributes" value={criteria.attributes.length ? JSON.stringify(criteria.attributes) : ''} />
      <div className={styles.searchBottom}>
        <button type="button" className={`${styles.allFilters} ${styles.desktopFilters}`} onClick={openFilters} aria-haspopup="dialog"><HomeIcon name="filters" size={18} />All Filters{filterCount ? ` (${filterCount})` : ''}</button>
        <div className={styles.preferenceLinks}>
          {shortcuts.map(([key, label, icon]) => {
            const definition = shortcutDefinition(label);
            return <button key={key} type="button" className={key === 'photography' || key === 'rebreather' ? styles.desktopShortcut : undefined} onClick={() => quickFilter(definition)} aria-pressed={Boolean(definition && criteria.attributes.some(item => item.key === definition.key && item.value === true))}><HomeIcon name={icon} size={19} />{label}</button>;
          })}
        </div>
        <button type="button" className={`${styles.allFilters} ${styles.mobileFilters}`} onClick={openFilters} aria-haspopup="dialog"><HomeIcon name="filters" size={18} />All Filters{filterCount ? ` (${filterCount})` : ''}</button>
      </div>
      {(criteria.minPrice || criteria.maxPrice) && <p className={styles.budgetSummary}>Budget: {criteria.minPrice ? `USD ${criteria.minPrice}` : 'Any minimum'} – {criteria.maxPrice ? `USD ${criteria.maxPrice}` : 'Any maximum'} · {resort ? 'package starting prices' : 'departure starting prices'}</p>}
      <p className={styles.dateNote}>{resort ? 'Prices shown are starting rates. Final pricing and availability are confirmed on enquiry.' : 'Search by departure date. Final pricing and availability are confirmed on enquiry.'}</p>
      {error && !open && <p className={styles.formError} role="alert">{error}</p>}
    </form>
    <dialog ref={dialog} className={styles.filterDialog} aria-labelledby="home-filters-title" onCancel={event => { event.preventDefault(); setError(''); setOpen(false); }} onClick={event => { if (event.target === dialog.current) { setError(''); setOpen(false); } }}>
      <div className={styles.dialogHeader}><div><span>MAKE IT YOUR JOURNEY</span><h2 id="home-filters-title">All Filters</h2></div><button type="button" aria-label="Close filters" onClick={() => { setError(''); setOpen(false); }}><HomeIcon name="close" /></button></div>
      <form className={styles.dialogForm} onSubmit={event => { event.preventDefault(); const message = validate(draft); if (message) { setError(message); return; } setCriteria(draft); setError(''); setOpen(false); }}>
        <div className={styles.dialogBody}>
          <fieldset><legend>Price range · USD</legend><p>{resort ? 'Package starting prices; final stay price is confirmed by enquiry.' : 'Departure starting prices; confirm the cabin and price basis on the trip page.'}</p><div className={styles.twoFields}><label className={styles.field}>Minimum price<input type="number" min="0" step="1" inputMode="numeric" placeholder="No minimum" value={draft.minPrice} onChange={event => setDraft({ ...draft, minPrice: event.target.value })} /></label><label className={styles.field}>Maximum price<input type="number" min="0" step="1" inputMode="numeric" placeholder="No maximum" value={draft.maxPrice} onChange={event => setDraft({ ...draft, maxPrice: event.target.value })} /></label></div></fieldset>
          {!resort && <fieldset><legend>Trip length & departure</legend><div className={styles.twoFields}><label className={styles.field}>Minimum nights<input type="number" min="1" step="1" placeholder="Any" value={draft.minNights} onChange={event => setDraft({ ...draft, minNights: event.target.value })} /></label><label className={styles.field}>Maximum nights<input type="number" min="1" step="1" placeholder="Any" value={draft.maxNights} onChange={event => setDraft({ ...draft, maxNights: event.target.value })} /></label></div><label className={styles.field}>Embarkation point<EmbarkationSelect ports={ports} error={portsError} value={draft.embarkation} onChange={embarkation => setDraft({ ...draft, embarkation })} /></label></fieldset>}
          <fieldset><legend>Food that fits you</legend>{ratingSelect(draft.veganRatingMin, value => setDraft({ ...draft, veganRatingMin: value }), styles.field)}<p>Deeparture’s Vegan Rating describes vegan suitability, rather than hotel quality or guest reviews.</p></fieldset>
          {definitionsError && <div className={styles.preferenceError} role="status"><strong>Extra preferences couldn’t load.</strong><p>Reload to try dietary, accessibility, facility and diving filters again.</p><a href="/#find-your-trip">Reload preferences</a></div>}
          {Object.entries(groups).map(([group, label]) => {
            const entries = availableDefinitions.filter(def => def.group === group);
            if (!entries.length) return null;
            return <fieldset key={group}><legend>{label}</legend>{entries.map(def => {
              const selected = draft.attributes.find(item => item.key === def.key)?.value;
              if (def.dataType === 'boolean') return <label key={def.key} className={styles.checkField}><input type="checkbox" checked={selected === true} onChange={event => changeAttribute(def, event.target.checked)} />{def.label}</label>;
              if (def.dataType === 'multi_select') return <fieldset className={styles.nestedField} key={def.key}><legend>{def.label}</legend>{(def.options || []).map(option => <label key={option} className={styles.checkField}><input type="checkbox" checked={Array.isArray(selected) && selected.includes(option)} onChange={event => changeAttribute(def, event.target.checked ? [...(Array.isArray(selected) ? selected : []), option] : (selected || []).filter(value => value !== option))} />{option}</label>)}</fieldset>;
              return <label key={def.key} className={styles.field}>{def.label}{def.dataType === 'select' ? <select value={selected || ''} onChange={event => changeAttribute(def, event.target.value)}><option value="">Any</option>{(def.options || []).map(option => <option key={option}>{option}</option>)}</select> : <input type={def.dataType === 'number' ? 'number' : 'text'} value={selected ?? ''} onChange={event => changeAttribute(def, event.target.value === '' ? '' : def.dataType === 'number' ? Number(event.target.value) : event.target.value)} />}</label>;
            })}</fieldset>;
          })}
          {!definitionsError && !availableDefinitions.length && <p className={styles.dateNote}>No additional structured preferences are currently published for this trip type.</p>}
          <div className={styles.availabilityNote}><HomeIcon name="message" /><p>Find what suits you. Then enquire to confirm the details and availability.</p></div>
          {error && open && <p className={styles.formError} role="alert">{error}</p>}
        </div>
        <div className={styles.dialogFooter}><button type="button" onClick={() => { setDraft({ ...draft, minPrice: '', maxPrice: '', minNights: '', maxNights: '', embarkation: '', veganRatingMin: '', attributes: [] }); setError(''); }}>Clear filters</button><button type="submit" className={styles.searchButton}>Apply filters<HomeIcon name="check" size={18} /></button></div>
      </form>
    </dialog>
  </section>;
}
