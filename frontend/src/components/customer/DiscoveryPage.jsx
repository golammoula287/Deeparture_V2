import Link from 'next/link';
import { useState } from 'react';
import useAutoSearch from '@/src/lib/customer/useAutoSearch';
import CustomerShell from './CustomerShell';
import CatalogueCard from './CatalogueCard';
import DepartureWindow from './DepartureWindow';
import StayDateFields from './StayDateFields';
import VeganRatingSelect from './VeganRatingSelect';
import EmbarkationSelect from './EmbarkationSelect';
import FilterPanel from './FilterPanel';
import PreferenceGroups, { FilterGroup, withAttribute } from './PreferenceGroups';
import PriceRange, { priceRangeError } from './PriceRange';
import { stayDateError } from '@/src/lib/customer/searchDates';
import { discoveryTypes, discoveryUrl } from '@/src/lib/customer/discovery';
import styles from './Marketplace.module.css';

const emptyFilters = { minPrice: '', maxPrice: '', embarkation: '', attributes: '' };
const readFilters = state => ({
  minPrice: state.minPrice || '', maxPrice: state.maxPrice || '', embarkation: state.embarkation || '',
  attributes: state.attributes ? JSON.parse(state.attributes) : [],
});

export default function DiscoveryPage({ offers, state, invalid, results, definitions, definitionsError, ports, portsError, catalogueHasOffers }) {
  const path = offers ? '/special-offers' : '/featured-trips';
  const title = offers ? 'Special Offers' : 'Featured Trips';
  const [open, setOpen] = useState(false);
  const dateError = criteria => criteria.type === 'resort' && (criteria.checkIn || criteria.checkOut)
    ? stayDateError(criteria.checkIn, criteria.checkOut) : '';
  const { draft, update, pending } = useAutoSearch(state, next => discoveryUrl(path, next), criteria => priceRangeError(criteria) || dateError(criteria));
  const filters = readFilters(draft);
  const set = (key, value) => update(previous => ({ ...previous, [key]: value }));
  const switchType = type => update(previous => ({
    ...previous, type, startDate: '', endDate: '', checkIn: '', checkOut: '', minNights: '', maxNights: '', embarkation: '',
    attributes: JSON.stringify(readFilters(previous).attributes.filter(attribute =>
      !type || definitions.some(def => def.key === attribute.key && def.applicableTo?.some(kind => kind === type || kind === 'both'))
    )),
  }));
  const hasItems = results.some(result => result.data?.items?.length);
  const total = results.reduce((sum, result) => sum + (result.data?.total || 0), 0);
  const pages = Math.max(1, ...results.map(result => result.data?.pages || 1));
  const failure = results.some(result => result.error);
  const page = Number(state.page);
  const count = readFilters(state).attributes.length + ['minPrice', 'maxPrice', 'embarkation'].filter(key => state[key]).length;
  const noOffers = offers && (catalogueHasOffers === false || (catalogueHasOffers === null && !state.type &&
    !Object.entries(state).some(([key, value]) => key !== 'page' && Boolean(value))));

  return <CustomerShell title={title} description={offers ? 'Browse current offers for dive resorts and liveaboard departures, then enquire about your preferred trip.' : 'Explore a selection of featured liveaboards and dive resorts, with details to help plan your next trip.'}>
    <main>
      <section className={styles.finderHero} aria-labelledby="discovery-title">
        <div className={styles.finderHeroInner}><h1 id="discovery-title">{title}</h1></div>
      </section>
      <div className={styles.finder}>
        <form className={styles.searchForm} onSubmit={event => event.preventDefault()}>
          <div className={styles.discoveryFields}>
            <label className={styles.field}>Product type<select value={draft.type} onChange={event => switchType(event.target.value)}>
              <option value="">All trip types</option>
              {Object.entries(discoveryTypes).map(([type, label]) => <option value={type} key={type}>{label}</option>)}
            </select></label>
            <label className={styles.field}>Destination<input placeholder="Next destination" value={draft.destination} onChange={event => set('destination', event.target.value)} /></label>
            {draft.type === 'vessel' && <>
              <DepartureWindow autoApply className={styles.field} label="Departure dates" startDate={draft.startDate} endDate={draft.endDate} onChange={range => update(previous => ({ ...previous, ...range }))} />
              <label className={styles.field}>Trip length<select value={`${draft.minNights || ''}:${draft.maxNights || ''}`} onChange={event => {
                const [minNights, maxNights] = event.target.value.split(':');
                update(previous => ({ ...previous, minNights, maxNights }));
              }}>
                <option value=":">Any duration</option><option value="1:6">1–6 nights</option><option value="7:10">7–10 nights</option><option value="11:14">11–14 nights</option><option value="15:">15+ nights</option>
                {![':', '1:6', '7:10', '11:14', '15:'].includes(`${draft.minNights || ''}:${draft.maxNights || ''}`) && <option value={`${draft.minNights || ''}:${draft.maxNights || ''}`}>Custom duration</option>}
              </select></label>
            </>}
            {draft.type === 'resort' && <StayDateFields className={styles.field} checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={set} required={false} />}
            <VeganRatingSelect className={styles.field} value={draft.veganRatingMin} onChange={value => set('veganRatingMin', value)} />
          </div>
          {!draft.type && <p className={styles.criteriaNote}>Choose Liveaboards or Resorts to search by travel dates.</p>}
          {dateError(draft) && <p className={styles.error} role="status">{dateError(draft)}</p>}
        </form>
        {invalid && <p className={styles.error} role="status">Some invalid search criteria were reset.</p>}
        <div className={styles.resultBar}>
          <p role="status">{pending ? 'Updating results…' : failure && !total ? 'Catalogue temporarily unavailable' : `${total} ${offers ? 'offers' : 'featured trips'}`}</p>
          <button type="button" className={styles.outlineButton} onClick={() => setOpen(true)}>All Filters{count ? ` (${count})` : ''}</button>
        </div>
        {failure && <div className={styles.error} role="alert">Some results couldn’t load. <a href={discoveryUrl(path, state)}>Retry search</a></div>}
        {!failure && !hasItems && <div className={styles.empty}>
          <h2>{noOffers && !total ? 'No active offers right now.' : 'No matching trips.'}</h2>
          <Link className={styles.textLink} href={noOffers ? '/contact?subject=special-offers' : path}>{noOffers ? 'Enquire about special offers.' : 'Clear search filters'}</Link>
        </div>}
        {results.filter(result => result.data?.items?.length).map(({ kind, data }) =>
          <section key={kind} className={styles.discoverySection} aria-label={discoveryTypes[kind]}>
            <h2>{discoveryTypes[kind]}</h2>
            <div className={styles.discoveryCards}>
              {data.items.map(item => <CatalogueCard key={item._id} item={item} type={kind} departure={item.departure} startingRate={item.startingRate} promotion={item.promotion} stay={state} returnTo={discoveryUrl(path, state)} />)}
            </div>
          </section>
        )}
        {pages > 1 && <nav className={styles.pagination} aria-label="Results pages">
          {page > 1 && <Link href={discoveryUrl(path, { ...state, page: page - 1 })}>Previous</Link>}
          <span>Page {page} of {pages}</span>
          {page < pages && <Link href={discoveryUrl(path, { ...state, page: page + 1 })}>Next</Link>}
        </nav>}
      </div>
      <FilterPanel open={open} onClose={() => setOpen(false)} error={priceRangeError(draft)} autoApply onClear={() => update(previous => ({ ...previous, ...emptyFilters }))}>
        <FilterGroup title="Price range · USD" initiallyOpen><PriceRange value={filters} onChange={set} /></FilterGroup>
        {draft.type === 'vessel' && <FilterGroup title="Embarkation"><label className={styles.field}>Embarkation point<EmbarkationSelect value={filters.embarkation} ports={ports} error={portsError} onChange={embarkation => set('embarkation', embarkation)} /></label></FilterGroup>}
        {definitionsError && <p role="status">Additional preferences couldn’t be loaded.</p>}
        <PreferenceGroups definitions={draft.type ? definitions.filter(def => def.applicableTo?.includes('both') || def.applicableTo?.includes(draft.type)) : definitions} attributes={filters.attributes} onChange={(definition, value) => update(previous => ({ ...previous, attributes: JSON.stringify(withAttribute(readFilters(previous).attributes, definition, value)) }))} />
      </FilterPanel>
    </main>
  </CustomerShell>;
}
