import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { stayDateError } from '@/src/lib/customer/searchDates';
import PreferenceGroups, { FilterGroup, withAttribute } from './PreferenceGroups';
import PriceRange, { priceRangeError } from './PriceRange';
import VeganRatingSelect from './VeganRatingSelect';
import FilterPanel from './FilterPanel';
import DepartureWindow from './DepartureWindow';
import StayDateFields from './StayDateFields';
import CustomerShell from './CustomerShell';
import EmbarkationSelect from './EmbarkationSelect';
import CatalogueCard from './CatalogueCard';
import { finderUrl, sorts } from '@/src/lib/customer/searchState';
import styles from './Marketplace.module.css';

const primaryKeys = ['destination', 'startDate', 'endDate', 'checkIn', 'checkOut', 'minNights', 'maxNights', 'veganRatingMin'];
const primaryCriteria = state => Object.fromEntries(primaryKeys.map(key => [key, state[key]]));
const emptyFilters = { minPrice: '', maxPrice: '', embarkation: '', attributes: [] };
const parseAttributes = state => { try { return JSON.parse(state.attributes || '[]'); } catch { return []; } };

export default function TripFinder({ resort = false, state, data, definitions = [], error, definitionsError, ports = [], portsError, invalid }) {
  const router = useRouter();
  const path = resort ? '/explore/resorts' : '/explore/liveaboards';
  const [draft, setDraft] = useState(() => primaryCriteria(state));
  const [filters, setFilters] = useState(emptyFilters);
  const [filterError, setFilterError] = useState('');
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [validation, setValidation] = useState('');
  const appliedPrimary = JSON.stringify(primaryCriteria(state));
  useEffect(() => { setDraft(JSON.parse(appliedPrimary)); setValidation(''); }, [appliedPrimary]);
  const navigate = async next => { setPending(true); try { await router.push(finderUrl(path, next), undefined, { scroll: false }); } finally { setPending(false); } };
  const submit = event => {
    event.preventDefault();
    const dateError = resort && stayDateError(draft.checkIn, draft.checkOut);
    if (dateError) { setValidation(dateError); return; }
    setValidation('');
    navigate({ ...state, ...draft, page: '1' });
  };
  const clearedState = { ...state, ...emptyFilters, attributes: '', page: '1' };
  const openFilters = () => {
    setFilters({ minPrice: state.minPrice, maxPrice: state.maxPrice, embarkation: state.embarkation || '', attributes: parseAttributes(state) });
    setFilterError('');
    setOpen(true);
  };
  const changeFilter = (key, value) => setFilters(previous => ({ ...previous, [key]: value }));
  const changeAttribute = (definition, value) => setFilters(previous => ({ ...previous, attributes: withAttribute(previous.attributes, definition, value) }));
  const apply = event => {
    event.preventDefault();
    const message = priceRangeError(filters);
    if (message) { setFilterError(message); return; }
    const { attributes, ...criteria } = filters;
    setOpen(false);
    navigate({ ...state, ...criteria, attributes: attributes.length ? JSON.stringify(attributes) : '', page: '1' });
  };
  const attributes = parseAttributes(state);
  const count = attributes.length + ['minPrice', 'maxPrice', 'embarkation'].filter(key => state[key]).length;
  const applied = Object.entries(state).filter(([key, value]) => value && !['page', 'sort', 'attributes'].includes(key));
  const labels = { destination: 'Destination', startDate: 'Departure from', endDate: 'Departure by', checkIn: 'Check-in', checkOut: 'Check-out', minNights: 'Minimum nights', maxNights: 'Maximum nights', minPrice: 'Minimum USD', maxPrice: 'Maximum USD', embarkation: 'Embarkation', veganRatingMin: 'Deeparture’s Vegan Rating at least' };
  const products = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total || 0;
  return <CustomerShell title={resort ? 'Find a dive resort' : 'Find a liveaboard trip'} description="Explore diving journeys by destination and preferences. Find the details that matter, then enquire about your trip.">
    {pending && <div className={styles.loading} role="status" aria-label="Updating trips" />}
    <main className={styles.finder}>
      <div className={styles.finderHeader}><p className={styles.eyebrow}>Find your next deeparture</p><h1>{resort ? 'A place to stay. A world to explore.' : 'Find your next dive trip.'}</h1><p>{resort ? 'Discover dive resorts and explore rooms, packages and the details that make a stay yours.' : 'Choose where and when. Find the liveaboard that feels right for you.'}</p></div>
      <nav className={styles.productSwitch} aria-label="Trip type"><Link href="/explore/liveaboards" aria-current={!resort ? 'page' : undefined}>Liveaboards</Link><Link href="/explore/resorts" aria-current={resort ? 'page' : undefined}>Dive resorts</Link></nav>
      <form className={styles.searchForm} onSubmit={submit}>
        <div className={styles.mainFields}>
          <label className={styles.field}>Destination<input name="destination" placeholder="Anywhere" value={draft.destination || ''} onChange={e => setDraft({ ...draft, destination: e.target.value })} /></label>
          {resort
            ? <StayDateFields className={styles.field} checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={(key, value) => setDraft(previous => ({ ...previous, [key]: value }))} />
            : <DepartureWindow className={styles.field} label="Departure dates" startDate={draft.startDate} endDate={draft.endDate} onChange={range => setDraft(previous => ({ ...previous, ...range }))} />}
          {!resort && <label className={styles.field}>Trip length<select aria-label="Trip length" value={`${draft.minNights || ''}:${draft.maxNights || ''}`} onChange={e => { const [minNights, maxNights] = e.target.value.split(':'); setDraft({ ...draft, minNights, maxNights }); }}><option value=":">Any duration</option><option value="1:6">1–6 nights</option><option value="7:10">7–10 nights</option><option value="11:14">11–14 nights</option><option value="15:">15+ nights</option>{![':', '1:6', '7:10', '11:14', '15:'].includes(`${draft.minNights || ''}:${draft.maxNights || ''}`) && <option value={`${draft.minNights || ''}:${draft.maxNights || ''}`}>Custom duration</option>}</select></label>}
          <VeganRatingSelect className={styles.field} value={draft.veganRatingMin} onChange={value => setDraft(previous => ({ ...previous, veganRatingMin: value }))} />
          <button className={styles.darkButton} disabled={pending}>{pending ? 'Searching…' : 'Search trips'}</button>
        </div>
        <p className={styles.criteriaNote}>{resort ? 'Prices shown are starting rates. Final pricing, room options and availability are confirmed on enquiry.' : 'Dates refer to the departure start, not the end of your trip. Budget is matched against USD departure prices; confirm cabin and price basis on the detail page.'}</p>
        {validation && <p className={styles.error} role="alert">{validation}</p>}
      </form>
      {invalid && <p className={styles.error} role="status">Some invalid search criteria were reset. Please check your filters.</p>}
      <div className={styles.resultBar} id="trip-results"><p role="status" aria-live="polite">{error ? 'Catalogue temporarily unavailable' : `${total} ${resort ? 'resorts' : 'liveaboards'} to explore`}</p><div className={styles.resultActions}><button type="button" className={styles.outlineButton} onClick={openFilters}>Filters{count ? ` (${count})` : ''}</button><label className={styles.field}>Sort by<select aria-label="Sort trips" value={state.sort} onChange={e => navigate({ ...state, sort: e.target.value, page: '1' })}>{sorts.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div></div>
      {(applied.length > 0 || attributes.length > 0) && <div className={styles.applied} aria-label="Applied filters">{applied.map(([key, value]) => <Link key={key} href={finderUrl(path, { ...state, [key]: '', ...(['checkIn', 'checkOut'].includes(key) && { checkIn: '', checkOut: '' }), page: '1' })} aria-label={`Remove ${labels[key] || key} ${value}`}>{labels[key] || key}: {value} · Remove</Link>)}{attributes.map(item => <Link key={item.key} href={finderUrl(path, { ...state, attributes: JSON.stringify(attributes.filter(a => a.key !== item.key)), page: '1' })}>{definitions.find(d => d.key === item.key)?.label || item.key} · Remove</Link>)}{count > 0 && <Link href={finderUrl(path, clearedState)}>Clear filters</Link>}</div>}
      {error ? <div className={styles.empty} role="alert"><h2>Search could not load</h2><p>{error}</p><a className={styles.textLink} href={finderUrl(path, state)}>Retry search</a></div> : products.length ? <div className={styles.resultList}>{products.map(item => <CatalogueCard key={item._id} item={item} returnTo={finderUrl(path, state)} type={resort ? 'resort' : 'vessel'} horizontal />)}</div> : <div className={styles.empty}><h2>No matching journeys yet.</h2><p>Try changing your destination, dates or budget. Your requirements stay selected until you change them.</p>{count > 0 && <Link className={styles.textLink} href={finderUrl(path, clearedState)}>Clear search filters</Link>}</div>}
      {!error && data?.pages > 1 && <nav className={styles.pagination} aria-label="Results pages">{data.hasPrevious && <Link href={finderUrl(path, { ...state, page: String(data.page - 1) })}>Previous</Link>}<span>Page {data.page} of {data.pages}</span>{data.hasNext && <Link href={finderUrl(path, { ...state, page: String(data.page + 1) })}>Next</Link>}</nav>}
      <FilterPanel
        open={open}
        onClose={() => setOpen(false)}
        onClear={() => { setFilters(emptyFilters); setFilterError(''); }}
        onApply={apply}
        error={filterError}
      >
        <FilterGroup title="Price range · USD" initiallyOpen><PriceRange value={filters} onChange={changeFilter} /></FilterGroup>
        {!resort && <FilterGroup title="Embarkation"><label className={styles.field}>Embarkation point<EmbarkationSelect ports={ports} error={portsError} value={filters.embarkation} onChange={value => changeFilter('embarkation', value)} /></label></FilterGroup>}
        {definitionsError && <p role="status">Additional preferences couldn’t be loaded. Close and retry the page to load the current filters.</p>}
        <PreferenceGroups definitions={definitions} attributes={filters.attributes} onChange={changeAttribute} />
        <p className={styles.criteriaNote}>Deeparture’s Vegan Rating measures vegan suitability. It is separate from hotel quality and guest reviews.</p>
      </FilterPanel>
    </main>
  </CustomerShell>;
}
