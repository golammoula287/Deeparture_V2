import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import CustomerShell from './CustomerShell';
import EmbarkationSelect from './EmbarkationSelect';
import CatalogueCard from './CatalogueCard';
import { finderUrl, sorts } from '@/src/lib/customer/searchState';
import styles from './Marketplace.module.css';

const groups = { dietary: 'Dietary requirements', accessibility: 'Accessibility', diving: 'Diving features', facility: 'Facilities', accommodation: 'Accommodation', sustainability: 'Sustainability', other: 'Other preferences' };
const parseAttributes = state => { try { return JSON.parse(state.attributes || '[]'); } catch { return []; } };

export default function TripFinder({ resort = false, state, data, definitions = [], error, definitionsError, ports = [], portsError, invalid }) {
  const router = useRouter();
  const path = resort ? '/explore/resorts' : '/explore/liveaboards';
  const [draft, setDraft] = useState(state);
  const [advanced, setAdvanced] = useState(parseAttributes(state));
  const [embarkation, setEmbarkation] = useState(state.embarkation || '');
  const [rating, setRating] = useState(state.veganRatingMin || '');
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [validation, setValidation] = useState('');
  const dialog = useRef(null);
  useEffect(() => { setDraft(state); setValidation(''); }, [state]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.current.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog.current?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  const navigate = async next => { setPending(true); try { await router.push(finderUrl(path, next), undefined, { scroll: false }); } finally { setPending(false); } };
  const submit = event => {
    event.preventDefault();
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) { setValidation('Depart by must be on or after Depart from.'); return; }
    if (draft.minPrice && draft.maxPrice && Number(draft.minPrice) > Number(draft.maxPrice)) { setValidation('Maximum price must be at least the minimum price.'); return; }
    navigate({ ...state, ...draft, page: '1' });
  };
  const openFilters = () => { setAdvanced(parseAttributes(state)); setRating(state.veganRatingMin || ''); setEmbarkation(state.embarkation || ''); setOpen(true); };
  const changeAttribute = (definition, value) => setAdvanced(current => [...current.filter(item => item.key !== definition.key), ...(value === '' || value === false || (Array.isArray(value) && !value.length) ? [] : [{ key: definition.key, op: Array.isArray(value) ? 'all' : 'eq', value }])]);
  const apply = () => { const next = { ...state, ...(!resort && { embarkation }), veganRatingMin: rating, attributes: advanced.length ? JSON.stringify(advanced) : '', page: '1' }; setOpen(false); navigate(next); };
  const attributes = parseAttributes(state);
  const count = attributes.length + Number(Boolean(state.veganRatingMin)) + Number(Boolean(state.embarkation));
  const applied = Object.entries(state).filter(([key, value]) => value && !['page', 'sort', 'attributes'].includes(key));
  const labels = { destination: 'Destination', startDate: 'Depart from', endDate: 'Depart by', minNights: 'Minimum nights', maxNights: 'Maximum nights', minPrice: 'Minimum USD', maxPrice: 'Maximum USD', embarkation: 'Embarkation', veganRatingMin: 'Deeparture’s Vegan Rating at least' };
  const products = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total || 0;
  return <CustomerShell title={resort ? 'Find a dive resort' : 'Find a liveaboard trip'} description="Explore diving journeys by destination and preferences. Find the details that matter, then enquire about your trip.">
    {pending && <div className={styles.loading} role="status" aria-label="Updating trips" />}
    <main className={styles.finder}>
      <div className={styles.finderHeader}><p className={styles.eyebrow}>Find your next deeparture</p><h1>{resort ? 'A place to stay. A world to explore.' : 'Find your next dive trip.'}</h1><p>{resort ? 'Discover dive resorts and explore rooms, packages and the details that make a stay yours.' : 'Choose where and when. Find the liveaboard that feels right for you.'}</p></div>
      <nav className={styles.productSwitch} aria-label="Trip type"><Link href="/explore/liveaboards" aria-current={!resort ? 'page' : undefined}>Liveaboards</Link><Link href="/explore/resorts" aria-current={resort ? 'page' : undefined}>Dive resorts</Link></nav>
      <form className={styles.searchForm} onSubmit={submit}>
        <div className={`${styles.mainFields} ${resort ? styles.resortFields : ''}`}>
          <label className={styles.field}>Destination<input name="destination" placeholder="Anywhere" value={draft.destination || ''} onChange={e => setDraft({ ...draft, destination: e.target.value })} /></label>
          {!resort && <><label className={styles.field}>Depart from<input type="date" name="startDate" value={draft.startDate || ''} onChange={e => setDraft({ ...draft, startDate: e.target.value })} /></label><label className={styles.field}>Depart by<input type="date" name="endDate" min={draft.startDate || undefined} value={draft.endDate || ''} onChange={e => setDraft({ ...draft, endDate: e.target.value })} /></label><label className={styles.field}>Trip length<select aria-label="Trip length" value={`${draft.minNights || ''}:${draft.maxNights || ''}`} onChange={e => { const [minNights, maxNights] = e.target.value.split(':'); setDraft({ ...draft, minNights, maxNights }); }}><option value=":">Any duration</option><option value="1:6">1–6 nights</option><option value="7:10">7–10 nights</option><option value="11:14">11–14 nights</option><option value="15:">15+ nights</option>{![':', '1:6', '7:10', '11:14', '15:'].includes(`${draft.minNights || ''}:${draft.maxNights || ''}`) && <option value={`${draft.minNights || ''}:${draft.maxNights || ''}`}>Custom duration</option>}</select></label></>}
          <label className={styles.field}>{resort ? 'Min package price · USD' : 'Min price · USD'}<input type="number" min="0" step="1" inputMode="numeric" placeholder="Any minimum" value={draft.minPrice || ''} onChange={e => setDraft({ ...draft, minPrice: e.target.value })} /></label>
          <label className={styles.field}>{resort ? 'Max package price · USD' : 'Max price · USD'}<input type="number" min="0" step="1" inputMode="numeric" placeholder="Any budget" value={draft.maxPrice || ''} onChange={e => setDraft({ ...draft, maxPrice: e.target.value })} /></label>
          <button className={styles.darkButton} disabled={pending}>{pending ? 'Searching…' : 'Search trips'}</button>
        </div>
        <p className={styles.criteriaNote}>{resort ? 'Package starting prices are not exact stay quotes. Check-in dates and room requirements can be included in your enquiry.' : 'Dates refer to the departure start, not the end of your trip. Budget is matched against USD departure prices; confirm cabin and price basis on the detail page.'}</p>
        {validation && <p className={styles.error} role="alert">{validation}</p>}
      </form>
      {invalid && <p className={styles.error} role="status">Some invalid search criteria were reset. Please check your filters.</p>}
      <div className={styles.resultBar} id="trip-results"><p role="status" aria-live="polite">{error ? 'Catalogue temporarily unavailable' : `${total} ${resort ? 'resorts' : 'liveaboards'} to explore`}</p><div className={styles.resultActions}><button type="button" className={styles.outlineButton} onClick={openFilters}>Filters{count ? ` (${count})` : ''}</button><label className={styles.field}>Sort by<select aria-label="Sort trips" value={state.sort} onChange={e => navigate({ ...state, sort: e.target.value, page: '1' })}>{sorts.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div></div>
      {(applied.length > 0 || attributes.length > 0) && <div className={styles.applied} aria-label="Applied filters">{applied.map(([key, value]) => <Link key={key} href={finderUrl(path, { ...state, [key]: '', page: '1' })} aria-label={`Remove ${labels[key] || key} ${value}`}>{labels[key] || key}: {value} · Remove</Link>)}{attributes.map(item => <Link key={item.key} href={finderUrl(path, { ...state, attributes: JSON.stringify(attributes.filter(a => a.key !== item.key)), page: '1' })}>{definitions.find(d => d.key === item.key)?.label || item.key} · Remove</Link>)}<Link href={path}>Clear all</Link></div>}
      {error ? <div className={styles.empty} role="alert"><h2>Search could not load</h2><p>{error}</p><a className={styles.textLink} href={finderUrl(path, state)}>Retry search</a></div> : products.length ? <div className={styles.resultList}>{products.map(item => <CatalogueCard key={item._id} item={item} returnTo={finderUrl(path, state)} type={resort ? 'resort' : 'vessel'} horizontal />)}</div> : <div className={styles.empty}><h2>No matching journeys yet.</h2><p>Try changing your destination, dates or budget. Your requirements stay selected until you change them.</p><Link className={styles.textLink} href={path}>Clear search filters</Link></div>}
      {!error && data?.pages > 1 && <nav className={styles.pagination} aria-label="Results pages">{data.hasPrevious && <Link href={finderUrl(path, { ...state, page: String(data.page - 1) })}>Previous</Link>}<span>Page {data.page} of {data.pages}</span>{data.hasNext && <Link href={finderUrl(path, { ...state, page: String(data.page + 1) })}>Next</Link>}</nav>}
      <dialog ref={dialog} className={styles.drawer} aria-labelledby="trip-filters-title" onCancel={e => { e.preventDefault(); setOpen(false); }} onClick={e => { if (e.target === dialog.current) setOpen(false); }}>
        <div className={styles.drawerHeader}><h2 id="trip-filters-title">Make it your journey</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
        <div className={styles.drawerBody}>
          <fieldset className={styles.filterGroup}><legend>Vegan Rating</legend><label className={styles.field}>Minimum rating<select value={rating} onChange={e => setRating(e.target.value)}><option value="">Any rating</option><option value="3">3 / 5 and above</option><option value="4">4 / 5 and above</option><option value="5">5 / 5</option></select></label><p>Use a minimum published Deeparture rating. Ask about specific requirements before you travel.</p></fieldset>
          {!resort && <label className={styles.field}>Embarkation point<EmbarkationSelect ports={ports} error={portsError} value={embarkation} onChange={setEmbarkation} /></label>}
          {definitionsError && <p role="status">Additional preferences couldn’t be loaded. Close and retry the page to load the current filters.</p>}
          {Object.entries(groups).map(([group, label]) => {
            const entries = definitions.filter(d => d.group === group && d.filterable !== false);
            if (!entries.length) return null;
            return <fieldset className={styles.filterGroup} key={group}><legend>{label}</legend>{entries.map(def => {
              const selected = advanced.find(item => item.key === def.key)?.value;
              if (def.dataType === 'boolean') return <label key={def.key}><input type="checkbox" checked={selected === true} onChange={e => changeAttribute(def, e.target.checked)} />{def.label}</label>;
              if (def.dataType === 'multi_select') return <fieldset className={styles.filterGroup} key={def.key}><legend>{def.label}</legend>{(def.options || []).map(option => <label key={option}><input type="checkbox" checked={Array.isArray(selected) && selected.includes(option)} onChange={e => changeAttribute(def, e.target.checked ? [...(Array.isArray(selected) ? selected : []), option] : (selected || []).filter(value => value !== option))} />{option}</label>)}</fieldset>;
              return <label className={styles.field} key={def.key}>{def.label}{def.dataType === 'select' ? <select value={selected || ''} onChange={e => changeAttribute(def, e.target.value)}><option value="">Any</option>{(def.options || []).map(option => <option key={option}>{option}</option>)}</select> : <input type={def.dataType === 'number' ? 'number' : 'text'} value={selected ?? ''} onChange={e => changeAttribute(def, e.target.value === '' ? '' : def.dataType === 'number' ? Number(e.target.value) : e.target.value)} />}</label>;
            })}</fieldset>;
          })}
          <p className={styles.criteriaNote}>Each selected requirement must be met. Current prices, dates and availability are confirmed through your enquiry.</p>
        </div>
        <div className={styles.drawerFooter}><button type="button" className={styles.outlineButton} onClick={() => { setAdvanced([]); setRating(''); setEmbarkation(''); }}>Clear preferences</button><button type="button" className={styles.darkButton} onClick={apply}>Apply filters</button></div>
      </dialog>
    </main>
  </CustomerShell>;
}
