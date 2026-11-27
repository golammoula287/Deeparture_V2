import Link from 'next/link';
import { useState } from 'react';
import useAutoSearch from '@/src/lib/customer/useAutoSearch';
import { stayDateError } from '@/src/lib/customer/searchDates';
import PreferenceGroups, { FilterGroup, withAttribute } from './PreferenceGroups';
import PriceRange, { priceRangeError } from './PriceRange';
import VeganRatingSelect from './VeganRatingSelect';
import FilterPanel from './FilterPanel';
import DepartureWindow from './DepartureWindow';
import StayDateFields from './StayDateFields';
import DestinationPicker, { destinationLabel } from './DestinationPicker';
import CustomerShell from './CustomerShell';
import EmbarkationSelect from './EmbarkationSelect';
import CatalogueCard from './CatalogueCard';
import { dateLabel } from '@/src/lib/customer/format';
import HomeIcon from './HomeIcon';
import { finderUrl, finderSorts } from '@/src/lib/customer/searchState';
import styles from './Marketplace.module.css';

const emptyFilters = { minPrice: '', maxPrice: '', embarkation: '', attributes: '' };
const parseAttributes = state => { try { return JSON.parse(state.attributes || '[]'); } catch { return []; } };

export default function TripFinder({ resort = false, state, data, definitions = [], error, definitionsError, ports = [], portsError, invalid }) {
  const path = resort ? '/explore/resorts' : '/explore/liveaboards';
  const [open, setOpen] = useState(false);
  const [modifySearch, setModifySearch] = useState(false);
  const dateError = criteria => resort && (criteria.checkIn || criteria.checkOut) ? stayDateError(criteria.checkIn, criteria.checkOut) : '';
  const { draft, update, pending } = useAutoSearch(state, next => finderUrl(path, next), criteria => priceRangeError(criteria) || dateError(criteria));
  const clearedState = { ...state, ...emptyFilters, page: '1' };
  const change = (key, value) => update(previous => ({ ...previous, [key]: value }));
  const changeAttribute = (definition, value) => update(previous => ({
    ...previous, attributes: JSON.stringify(withAttribute(parseAttributes(previous), definition, value)),
  }));
  const filterError = priceRangeError(draft);
  const clearFilters = () => update(previous => ({ ...previous, ...emptyFilters }));
  const filterGroups = <>
    <FilterGroup title="Price range · USD" initiallyOpen><PriceRange value={draft} onChange={change} /></FilterGroup>
    {!resort && <FilterGroup title="Embarkation"><label className={styles.field}>Embarkation point<EmbarkationSelect ports={ports} error={portsError} value={draft.embarkation} onChange={value => change('embarkation', value)} /></label></FilterGroup>}
    {definitionsError && <p role="status">Additional preferences couldn’t be loaded. Retry the page to load the current filters.</p>}
    <PreferenceGroups definitions={definitions} attributes={parseAttributes(draft)} onChange={changeAttribute} />
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
    { label: resort ? 'Liveaboards' : 'Resorts', href: finderUrl(resort ? '/explore/liveaboards' : '/explore/resorts', { destination: state.destination }) },
  ];
  const dateSummary = (resort ? [state.checkIn, state.checkOut] : [state.startDate, state.endDate])
    .filter(Boolean).map(dateLabel).join(' – ');
  const summary = [
    state.destination ? destinationLabel(state.destination) : 'Any destination',
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
        <form id="finder-search" className={styles.searchForm} data-expanded={modifySearch} onSubmit={event => event.preventDefault()}>
          <div className={styles.mainFields}>
            <DestinationPicker finder className={styles.field} value={draft.destination} onChange={destination => update(previous => ({ ...previous, destination }))} />
            {resort
              ? <StayDateFields className={styles.field} checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={(key, value) => update(previous => ({ ...previous, [key]: value }))} />
              : <DepartureWindow autoApply className={styles.field} label="Departure dates" startDate={draft.startDate} endDate={draft.endDate} onChange={range => update(previous => ({ ...previous, ...range }))} />}
            {!resort && <label className={styles.field}>Trip length<select aria-label="Trip length" value={`${draft.minNights || ''}:${draft.maxNights || ''}`} onChange={e => { const [minNights, maxNights] = e.target.value.split(':'); update(previous => ({ ...previous, minNights, maxNights })); }}><option value=":">Any duration</option><option value="1:6">1–6 nights</option><option value="7:10">7–10 nights</option><option value="11:14">11–14 nights</option><option value="15:">15+ nights</option>{![':', '1:6', '7:10', '11:14', '15:'].includes(`${draft.minNights || ''}:${draft.maxNights || ''}`) && <option value={`${draft.minNights || ''}:${draft.maxNights || ''}`}>Custom duration</option>}</select></label>}
            <VeganRatingSelect className={styles.field} value={draft.veganRatingMin} onChange={value => update(previous => ({ ...previous, veganRatingMin: value }))} />
          </div>
          <p className={styles.criteriaNote}>{resort ? 'Prices shown are starting rates. Final pricing, room options and availability are confirmed on enquiry.' : 'Search by departure date. Prices are shown in USD; final cabin pricing and availability are confirmed on enquiry.'}</p>
          {dateError(draft) && <p className={styles.error} role="status">{dateError(draft)}</p>}
        </form>
        {invalid && <p className={styles.error} role="status">Some invalid search criteria were reset. Please check your filters.</p>}
        <div className={styles.resultsLayout}>
          <aside className={styles.sidebar} aria-labelledby="desktop-filters-title">
            <h2 id="desktop-filters-title">Filters{count ? ` (${count})` : ''}</h2>
            <form onSubmit={event => event.preventDefault()} noValidate>
              {filterGroups}
              {filterError && <p className={styles.error} role="alert">{filterError}</p>}
              <div className={styles.sidebarActions}>
                <button type="button" className={styles.outlineButton} onClick={clearFilters}>Clear filters</button>
              </div>
            </form>
          </aside>
          <section className={styles.results} aria-label="Search results" aria-busy={pending}>
            <div className={styles.resultBar} id="trip-results">
              <p role="status" aria-live="polite">{error ? 'Catalogue temporarily unavailable' : `${total} ${productLabel.toLowerCase()} to explore`}</p>
              <div className={styles.resultActions}>
                <button type="button" className={`${styles.outlineButton} ${styles.mobileFilter}`} onClick={() => setOpen(true)}>Filters{count ? ` (${count})` : ''}</button>
                <label className={styles.field}>
                  Sort by<select aria-label="Sort trips" value={draft.sort} onChange={event => change('sort', event.target.value)}>
                    {finderSorts(resort).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                  </select>
                </label>
              </div>
            </div>
            {(applied.length > 0 || attributes.length > 0) && <div className={styles.applied} aria-label="Applied filters">
              {applied.map(([key, value]) => {
                const next = { ...state, [key]: '', page: '1' };
                if (key === 'checkIn' || key === 'checkOut') Object.assign(next, { checkIn: '', checkOut: '' });
                return <Link key={key} className={styles.filterChip} href={finderUrl(path, next)} aria-label={`Remove ${labels[key] || key} ${value}`}>
                  {labels[key] || key}: {value}
                  <span className={styles.removeFilter} aria-hidden="true">×</span>
                </Link>;
              })}
              {attributes.map(item => {
                const label = definitions.find(definition => definition.key === item.key)?.label || item.key;
                return <Link key={item.key} className={styles.filterChip} href={finderUrl(path, { ...state, attributes: JSON.stringify(attributes.filter(a => a.key !== item.key)), page: '1' })} aria-label={`Remove ${label}`}>
                  {label}
                  <span className={styles.removeFilter} aria-hidden="true">×</span>
                </Link>;
              })}
              {count > 0 && <Link href={finderUrl(path, clearedState)}>Clear filters</Link>}
            </div>}
            {error
              ? <div className={styles.empty} role="alert">
                <h2>Search could not load</h2><p>{error}</p><a className={styles.textLink} href={finderUrl(path, state)}>Retry search</a>
              </div>
              : products.length
                ? <div className={styles.resultList}>
                  {products.map(item => <CatalogueCard key={item._id} item={item} returnTo={finderUrl(path, state)} type={resort ? 'resort' : 'vessel'} departure={item.departure} startingRate={item.startingRate} stay={state} horizontal />)}
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
          autoApply
          error={filterError}
        >
          {filterGroups}
        </FilterPanel>
      </div>
    </main>
  </CustomerShell>;
}
