import { useState } from 'react';
import { stayDateError } from '@/src/lib/customer/searchDates';
import FilterPanel from './FilterPanel';
import DepartureWindow from './DepartureWindow';
import StayDateFields from './StayDateFields';
import PreferenceGroups, { FilterGroup, withAttribute } from './PreferenceGroups';
import PriceRange, { priceRangeError } from './PriceRange';
import VeganRatingSelect from './VeganRatingSelect';
import HomeIcon from './HomeIcon';
import EmbarkationSelect from './EmbarkationSelect';
import DestinationPicker from './DestinationPicker';
import baseStyles from './HomePage.module.css';
import searchStyles from './HomeSearch.module.css';
const styles = { ...baseStyles, ...searchStyles };

const empty = { destination: '', startDate: '', endDate: '', checkIn: '', checkOut: '', minPrice: '', maxPrice: '', minNights: '', maxNights: '', embarkation: '', veganRatingMin: '', attributes: [] };

export default function HomeSearch({ definitions = [], definitionsError = false, ports = [], portsError = false }) {
  const [kind, setKind] = useState('vessel');
  const [criteria, setCriteria] = useState(empty);
  const [draft, setDraft] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
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
  const filterCount = criteria.attributes.length + ['minPrice', 'maxPrice', 'minNights', 'maxNights', 'embarkation'].filter(key => criteria[key]).length;
  const validate = value => {
    const priceError = priceRangeError(value);
    if (priceError) return priceError;
    if ([value.minNights, value.maxNights].filter(Boolean).some(nights => !Number.isInteger(Number(nights)) || Number(nights) < 1)) return 'Enter a whole number of nights, at least one.';
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
  const changeAttribute = (definition, value) => setDraft(previous => ({ ...previous, attributes: withAttribute(previous.attributes, definition, value) }));
  return <section className={styles.search} id="find-your-trip" aria-label="Find your dive adventure">
    <div className={styles.searchTop}><div className={styles.productSwitch} role="group" aria-label="Search product type"><button type="button" aria-pressed={!resort} onClick={() => chooseKind('vessel')}><HomeIcon name="boat" size={20} />Liveaboards</button><button type="button" aria-pressed={resort} onClick={() => chooseKind('resort')}><HomeIcon name="resort" size={20} />Resorts</button><a href="/special-offers"><HomeIcon name="tag" size={20} />Special Offers</a></div></div>
    <form action={resort ? '/explore/resorts' : '/explore/liveaboards'} method="get" onSubmit={submit}>
      <div className={`${styles.searchFields} ${resort ? styles.resortSearch : ''}`}>
        <DestinationPicker className={styles.field} value={criteria.destination} onChange={value => set('destination', value)} />
        {resort
          ? <StayDateFields className={styles.field} checkIn={criteria.checkIn} checkOut={criteria.checkOut} onChange={set} />
          : <DepartureWindow className={styles.field} label="Departure Window" startDate={criteria.startDate} endDate={criteria.endDate} onChange={range => setCriteria(previous => ({ ...previous, ...range }))} />}
        <VeganRatingSelect value={criteria.veganRatingMin} onChange={value => set('veganRatingMin', value)} className={styles.field} />
        <button className={styles.searchButton} type="submit"><HomeIcon name="search" size={20} />Search</button>
      </div>
      {['minPrice', 'maxPrice', 'veganRatingMin', 'minNights', 'maxNights', 'embarkation'].map(key => <input key={key} type="hidden" name={key} value={criteria[key]} />)}
      {criteria.attributes.length > 0 && <input type="hidden" name="attributes" value={JSON.stringify(criteria.attributes)} />}
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
      {(criteria.minPrice || criteria.maxPrice) && <p className={styles.budgetSummary}>Budget: {criteria.minPrice ? `USD ${criteria.minPrice}` : 'Any minimum'} – {criteria.maxPrice ? `USD ${criteria.maxPrice}` : 'Any maximum'}</p>}
      <p className={styles.dateNote}>{resort ? 'Prices shown are starting rates. Final pricing and availability are confirmed on enquiry.' : 'Search by departure date. Final pricing and availability are confirmed on enquiry.'}</p>
      {error && !open && <p className={styles.formError} role="alert">{error}</p>}
    </form>
    <FilterPanel
      open={open}
      onClose={() => { setError(''); setOpen(false); }}
      onClear={() => { setDraft({ ...draft, minPrice: '', maxPrice: '', minNights: '', maxNights: '', embarkation: '', attributes: [] }); setError(''); }}
      onApply={event => {
        event.preventDefault();
        const message = validate(draft);
        if (message) { setError(message); return; }
        setCriteria(draft);
        setError('');
        setOpen(false);
      }}
      error={error}
    >
      <FilterGroup title="Price range · USD" initiallyOpen><PriceRange value={draft} onChange={(key, value) => setDraft(previous => ({ ...previous, [key]: value }))} /></FilterGroup>
      {!resort && <FilterGroup title="Trip length & embarkation">
        <div className={styles.twoFields}>
          <label className={styles.field}>Minimum nights<input type="number" min="1" step="1" placeholder="Any" value={draft.minNights} onChange={event => setDraft({ ...draft, minNights: event.target.value })} /></label>
          <label className={styles.field}>Maximum nights<input type="number" min="1" step="1" placeholder="Any" value={draft.maxNights} onChange={event => setDraft({ ...draft, maxNights: event.target.value })} /></label>
        </div>
        <label className={styles.field}>Embarkation point<EmbarkationSelect ports={ports} error={portsError} value={draft.embarkation} onChange={embarkation => setDraft({ ...draft, embarkation })} /></label>
      </FilterGroup>}
      <p className={styles.dateNote}>Deeparture’s Vegan Rating measures vegan suitability. It is separate from hotel quality and guest reviews.</p>
      {definitionsError && <div className={styles.preferenceError} role="status"><strong>Extra preferences couldn’t load.</strong><p>Reload to try dietary, accessibility, facility and diving filters again.</p><a href="/#find-your-trip">Reload preferences</a></div>}
      <PreferenceGroups definitions={availableDefinitions} attributes={draft.attributes} onChange={changeAttribute} />
      {!definitionsError && !availableDefinitions.length && <p className={styles.dateNote}>No additional structured preferences are currently published for this trip type.</p>}
    </FilterPanel>
  </section>;
}
