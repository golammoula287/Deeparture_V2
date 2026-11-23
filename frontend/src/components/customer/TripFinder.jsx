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
import { dateLabel, words } from '@/src/lib/customer/format';
import HomeIcon from './HomeIcon';
import { finderUrl, finderSorts } from '@/src/lib/customer/searchState';
import styles from './Marketplace.module.css';

const primaryKeys = ['destination', 'startDate', 'endDate', 'checkIn', 'checkOut', 'minNights', 'maxNights', 'veganRatingMin'];
const primaryCriteria = state => Object.fromEntries(primaryKeys.map(key => [key, state[key]]));
const emptyFilters = { minPrice: '', maxPrice: '', embarkation: '', attributes: [] };
const filterValues = state => ({
  minPrice: state.minPrice || '',
  maxPrice: state.maxPrice || '',
  embarkation: state.embarkation || '',
  attributes: parseAttributes(state),
});
const parseAttributes = state => { try { return JSON.parse(state.attributes || '[]'); } catch { return []; } };

export default function TripFinder({ resort = false, state, data, definitions = [], error, definitionsError, ports = [], portsError, invalid }) {
  const router = useRouter();
  const path = resort ? '/explore/resorts' : '/explore/liveaboards';
  const [draft, setDraft] = useState(() => primaryCriteria(state));
  const [filters, setFilters] = useState(() => filterValues(state));
  const [filterError, setFilterError] = useState('');
  const [open, setOpen] = useState(false);
  const [modifySearch, setModifySearch] = useState(false);
  const [pending, setPending] = useState(false);
  const [validation, setValidation] = useState('');
  const appliedPrimary = JSON.stringify(primaryCriteria(state));
  useEffect(() => { setDraft(JSON.parse(appliedPrimary)); setValidation(''); }, [appliedPrimary]);
  const appliedFilters = JSON.stringify(filterValues(state));
  useEffect(() => { setFilters(JSON.parse(appliedFilters)); setFilterError(''); }, [appliedFilters]);
  const navigate = async next => { setPending(true); try { await router.push(finderUrl(path, next), undefined, { scroll: false }); } finally { setPending(false); } };
  const submit = event => {
    event.preventDefault();
    const dateError = resort && stayDateError(draft.checkIn, draft.checkOut);
    if (dateError) { setValidation(dateError); return; }
    setValidation('');
    setModifySearch(false);
    navigate({ ...state, ...draft, page: '1' });
  };
  const clearedState = { ...state, ...emptyFilters, attributes: '', page: '1' };
  const openFilters = () => {
    setFilters(filterValues(state));
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
  const clearFilters = () => { setFilters(emptyFilters); setFilterError(''); };
  const filterGroups = <>
    <FilterGroup title="Price range · USD" initiallyOpen><PriceRange value={filters} onChange={changeFilter} /></FilterGroup>
    {!resort && <FilterGroup title="Embarkation"><label className={styles.field}>Embarkation point<EmbarkationSelect ports={ports} error={portsError} value={filters.embarkation} onChange={value => changeFilter('embarkation', value)} /></label></FilterGroup>}
    {definitionsError && <p role="status">Additional preferences couldn’t be loaded. Retry the page to load the current filters.</p>}
    <PreferenceGroups definitions={definitions} attributes={filters.attributes} onChange={changeAttribute} />
    <p className={styles.criteriaNote}>Deeparture’s Vegan Rating measures vegan suitability. It is separate from hotel quality and guest reviews.</p>
  </>;
  const attributes = parseAttributes(state);
  const count = attributes.length + ['minPrice', 'maxPrice', 'embarkation'].filter(key => state[key]).length;
  const applied = Object.entries(state).filter(([key, value]) => value && !['page', 'sort', 'attributes'].includes(key));
  const labels = { destination: 'Destination', startDate: 'Departure from', endDate: 'Departure by', checkIn: 'Check-in', checkOut: 'Check-out', minNights: 'Minimum nights', maxNights: 'Maximum nights', minPrice: 'Minimum USD', maxPrice: 'Maximum USD', embarkation: 'Embarkation', veganRatingMin: 'Deeparture’s Vegan Rating at least' };
  const products = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total || 0;
  const productLabel = resort ? 'Resorts' : 'Liveaboards';
  const tabs = [
    { label: productLabel, href: path },
    resort ? { label: 'Liveaboards', href: '/explore/liveaboards' } : { label: 'Resorts', href: '/explore/resorts' },
  ];
  const dateSummary = (resort ? [state.checkIn, state.checkOut] : [state.startDate, state.endDate])
    .filter(Boolean).map(dateLabel).join(' – ');
  const summary = [
    state.destination ? words(state.destination) : 'Any destination',
    dateSummary || (resort ? 'Choose stay dates' : 'Any departure dates'),
    !resort && (state.minNights || state.maxNights) && (state.minNights && state.maxNights ? `${state.minNights}–${state.maxNights} nights` : state.minNights ? `${state.minNights}+ nights` : `Up to ${state.maxNights} nights`),
    state.veganRatingMin && `Vegan Rating ${state.veganRatingMin}+`,
  ].filter(Boolean);
  return <CustomerShell title={resort ? 'Find a dive resort' : 'Find a liveaboard trip'} description={resort ? 'Find dive resorts by destination, stay dates and diving preferences. Compare packages and enquire about your stay.' : 'Find liveaboard journeys by destination, departure dates and trip length. Explore itineraries and enquire about your trip.'}>
    {pending && <div className={styles.loading} role="status" aria-label="Updating trips" />}
    <main>
      <section className={styles.finderHero} data-product={resort ? 'resort' : 'vessel'} aria-labelledby="finder-title">
        <div className={styles.finderHeroInner}>
          <p>{productLabel}</p>
          <h1 id="finder-title">Find your next Deeparture.</h1>
        </div>
      </section>
      <div className={styles.finder}>
        <nav className={styles.productSwitch} aria-label="Trip type">
          {tabs.map(({ label, href }) => <Link key={href} href={href} aria-current={href === path ? 'page' : undefined}><HomeIcon name={label === 'Resorts' ? 'resort' : 'boat'} size={18} />{label}</Link>)}
        </nav>
        <div className={styles.searchSummary}>
          <div><strong>{summary[0]}</strong><p>{summary.slice(1).join(' · ')}</p></div>
          <button type="button" className={styles.outlineButton} aria-expanded={modifySearch} aria-controls="finder-search" onClick={() => setModifySearch(previous => !previous)}>Modify Search</button>
        </div>
        <form id="finder-search" className={styles.searchForm} data-expanded={modifySearch} onSubmit={submit}>
          <div className={styles.mainFields}>
            <label className={styles.field}>Destination<input name="destination" placeholder="Next destination" value={draft.destination || ''} onChange={e => setDraft({ ...draft, destination: e.target.value })} /></label>
            {resort
              ? <StayDateFields className={styles.field} checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={(key, value) => setDraft(previous => ({ ...previous, [key]: value }))} />
              : <DepartureWindow className={styles.field} label="Departure dates" startDate={draft.startDate} endDate={draft.endDate} onChange={range => setDraft(previous => ({ ...previous, ...range }))} />}
            {!resort && <label className={styles.field}>Trip length<select aria-label="Trip length" value={`${draft.minNights || ''}:${draft.maxNights || ''}`} onChange={e => { const [minNights, maxNights] = e.target.value.split(':'); setDraft({ ...draft, minNights, maxNights }); }}><option value=":">Any duration</option><option value="1:6">1–6 nights</option><option value="7:10">7–10 nights</option><option value="11:14">11–14 nights</option><option value="15:">15+ nights</option>{![':', '1:6', '7:10', '11:14', '15:'].includes(`${draft.minNights || ''}:${draft.maxNights || ''}`) && <option value={`${draft.minNights || ''}:${draft.maxNights || ''}`}>Custom duration</option>}</select></label>}
            <VeganRatingSelect className={styles.field} value={draft.veganRatingMin} onChange={value => setDraft(previous => ({ ...previous, veganRatingMin: value }))} />
            <button className={styles.darkButton} disabled={pending}>{pending ? 'Searching…' : 'Search'}</button>
          </div>
          <p className={styles.criteriaNote}>{resort ? 'Prices shown are starting rates. Final pricing, room options and availability are confirmed on enquiry.' : 'Search by departure date. Prices are shown in USD; final cabin pricing and availability are confirmed on enquiry.'}</p>
          {validation && <p className={styles.error} role="alert">{validation}</p>}
        </form>
        {invalid && <p className={styles.error} role="status">Some invalid search criteria were reset. Please check your filters.</p>}
        <div className={styles.resultsLayout}>
          <aside className={styles.sidebar} aria-labelledby="desktop-filters-title">
            <h2 id="desktop-filters-title">Filters{count ? ` (${count})` : ''}</h2>
            <form onSubmit={apply} noValidate>
              {filterGroups}
              {filterError && <p className={styles.error} role="alert">{filterError}</p>}
              <div className={styles.sidebarActions}>
                <button type="button" className={styles.outlineButton} onClick={clearFilters}>Clear filters</button>
                <button className={styles.darkButton} type="submit">Apply filters</button>
              </div>
            </form>
          </aside>
          <section className={styles.results} aria-label="Search results">
            <div className={styles.resultBar} id="trip-results">
              <p role="status" aria-live="polite">{error ? 'Catalogue temporarily unavailable' : `${total} ${productLabel.toLowerCase()} to explore`}</p>
              <div className={styles.resultActions}>
                <button type="button" className={`${styles.outlineButton} ${styles.mobileFilter}`} onClick={openFilters}>Filters{count ? ` (${count})` : ''}</button>
                <label className={styles.field}>
                  Sort by<select aria-label="Sort trips" value={state.sort} onChange={event => navigate({ ...state, sort: event.target.value, page: '1' })}>
                    {finderSorts(resort).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                  </select>
                </label>
              </div>
            </div>
            {(applied.length > 0 || attributes.length > 0) && <div className={styles.applied} aria-label="Applied filters">
              {applied.map(([key, value]) => {
                const next = { ...state, [key]: '', page: '1' };
                if (key === 'checkIn' || key === 'checkOut') Object.assign(next, { checkIn: '', checkOut: '' });
                return <Link key={key} href={finderUrl(path, next)} aria-label={`Remove ${labels[key] || key} ${value}`}>
                  {labels[key] || key}: {value} · Remove
                </Link>;
              })}
              {attributes.map(item => <Link key={item.key} href={finderUrl(path, { ...state, attributes: JSON.stringify(attributes.filter(a => a.key !== item.key)), page: '1' })}>
                {definitions.find(definition => definition.key === item.key)?.label || item.key} · Remove
              </Link>)}
              {count > 0 && <Link href={finderUrl(path, clearedState)}>Clear filters</Link>}
            </div>}
            {error
              ? <div className={styles.empty} role="alert">
                <h2>Search could not load</h2><p>{error}</p><a className={styles.textLink} href={finderUrl(path, state)}>Retry search</a>
              </div>
              : products.length
                ? <div className={styles.resultList}>
                  {products.map(item => <CatalogueCard key={item._id} item={item} returnTo={finderUrl(path, state)} type={resort ? 'resort' : 'vessel'} departure={item.departure} startingRate={item.startingRate} horizontal />)}
                </div>
                : <div className={styles.empty}>
                  <h2>No matching journeys yet.</h2><p>Try changing your destination, dates or budget. Your requirements stay selected until you change them.</p>
                  {count > 0 && <Link className={styles.textLink} href={finderUrl(path, clearedState)}>Clear search filters</Link>}
                </div>}
            {!error && data?.pages > 1 && <nav className={styles.pagination} aria-label="Results pages">
              {data.hasPrevious && <Link href={finderUrl(path, { ...state, page: String(data.page - 1) })}>Previous</Link>}
              <span>Page {data.page} of {data.pages}</span>
              {data.hasNext && <Link href={finderUrl(path, { ...state, page: String(data.page + 1) })}>Next</Link>}
            </nav>}
          </section>
        </div>
        <FilterPanel
          open={open}
          onClose={() => setOpen(false)}
          onClear={clearFilters}
          onApply={apply}
          error={filterError}
        >
          {filterGroups}
        </FilterPanel>
      </div>
    </main>
  </CustomerShell>;
}
