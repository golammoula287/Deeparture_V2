import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { defaultFilters, filterGroups, money, selectPreviewTrips, shortDate } from '@/src/lib/phase4/previewData';
import styles from './DesignPreview.module.css';

const asset = name => `/phase4/${name}`;
const tripUrl = trip => `/phase4-preview/liveaboards/${trip.slug}`;

function Icon({ name = 'arrow', size = 20 }) {
  const paths = { arrow: 'M4 12h16m-6-6 6 6-6 6', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', filter: 'M4 7h16M4 17h16M8 4v6m8 4v6', close: 'm6 6 12 12M6 18 18 6', wave: 'M2 8c4-8 7 8 11 0s7 0 9 0M2 16c4-8 7 8 11 0s7 0 9 0', check: 'm5 12 4 4L19 6', leaf: 'M20 3C7 1 2 9 6 16c7 6 16-1 14-13ZM5 21 16 8', clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg>;
}

export function PreviewShell({ title, children, detail = false }) {
  return <div className={styles.market}>
    <Head><title>{title} · Deeparture design preview</title><meta name="robots" content="noindex,nofollow,noarchive" /><meta name="description" content="Phase 4 visual review with fictional sample inventory. No live prices or availability." /></Head>
    <a href="#preview-main" className={styles.skip}>Skip to content</a>
    <div className={styles.previewNotice}><strong>PHASE 4 · DESIGN PREVIEW</strong><span>Sample trips, prices & imagery. No live availability or enquiry delivery.</span></div>
    <header className={styles.header}>
      <Link href="/phase4-preview" className={styles.logo} aria-label="Deeparture design preview home"><Icon name="wave" size={31} /><span>deeparture<span className={styles.logoDot}>.</span></span></Link>
      <nav aria-label="Preview navigation"><Link href="/phase4-preview" className={!detail ? styles.activeNav : undefined}>Liveaboards</Link><a href={detail ? '#overview' : '#how-it-works'}>{detail ? 'Life on board' : 'Our approach'}</a></nav>
      <Link className={styles.headerCta} href={detail ? '#enquire' : '/phase4-preview/liveaboards/coral-horizon'}>{detail ? 'Enquire about this trip' : 'Explore a sample trip'}<Icon size={17} /></Link>
    </header>
    {children}
    <footer className={styles.footer} id="how-it-works"><div><Link href="/phase4-preview" className={styles.logo}><Icon name="wave" size={28} />deeparture.</Link><p>Extraordinary places. Thoughtfully explored.</p></div><p>Phase 4 visual direction · Fictional sample inventory<br />Customer redesign on the shared V2 platform.</p></footer>
  </div>;
}

function Availability({ trip }) {
  const text = trip.availability === 'limited' ? `${trip.spaces} spaces remaining` : trip.availability === 'available' ? 'Spaces available' : trip.availability === 'sold-out' ? 'Sold out' : 'Availability on request';
  return <span className={`${styles.availability} ${['unknown', 'sold-out'].includes(trip.availability) ? styles.neutral : ''}`}><span aria-hidden="true" />{text}</span>;
}

function Price({ trip, large = false }) {
  return <div className={large ? styles.largePrice : styles.price}><span>{trip.rack ? <del>{money(trip.rack)}</del> : 'From'}</span><strong>{money(trip.price)} <small>USD</small></strong><span>per person · {trip.nights} nights</span></div>;
}

function Modal({ open, onClose, title, children, drawer = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open) { if (dialog?.open) dialog.close(); return; }
    const previous = document.activeElement;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} className={`${styles.dialog} ${drawer ? styles.drawer : ''}`} aria-labelledby={drawer ? 'filter-title' : 'gallery-title'} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className={styles.dialogHeader}><h2 id={drawer ? 'filter-title' : 'gallery-title'}>{title}</h2><button type="button" className={styles.iconButton} aria-label={`Close ${drawer ? 'filters' : 'gallery'}`} onClick={onClose}><Icon name="close" /></button></div>{children}
  </dialog>;
}

function AdvancedFilters({ value, onChange, prefix }) {
  const toggle = (key, item) => onChange({ ...value, [key]: value[key].includes(item) ? value[key].filter(v => v !== item) : [...value[key], item] });
  return <>
    <fieldset className={styles.filterGroup}><legend>Availability & offers</legend>{[['availableOnly', 'Available spaces only'], ['offersOnly', 'Special offers only']].map(([key, label]) => <label key={key}><input type="checkbox" checked={value[key]} onChange={e => onChange({ ...value, [key]: e.target.checked })} />{label}</label>)}</fieldset>
    <fieldset className={styles.filterGroup}><legend><Icon name="leaf" size={16} />Vegan Rating</legend><label htmlFor={`${prefix}-vegan`} className={styles.hint}>Minimum Deeparture rating</label><select id={`${prefix}-vegan`} value={value.vegan} onChange={e => onChange({ ...value, vegan: e.target.value })}><option value="">Any rating</option><option value="5">5 / 5</option><option value="4">4 / 5 and above</option><option value="3">3 / 5 and above</option></select></fieldset>
    {filterGroups.map(group => <fieldset key={group.key} className={styles.filterGroup}><legend>{group.title}</legend>{group.items.map(([key, label]) => <label key={key}><input type="checkbox" checked={value[group.key].includes(key)} onChange={() => toggle(group.key, key)} />{label}</label>)}</fieldset>)}
  </>;
}

function TripCard({ trip }) {
  return <article className={styles.card}>
    <Link href={tripUrl(trip)} className={styles.cardImage} tabIndex={-1} aria-hidden="true"><img src={asset(trip.image)} alt="" width="640" height="430" loading="lazy" />{trip.offer ? <span className={styles.offer}>{trip.offer}</span> : null}<span className={styles.imageCaption}>Illustrative image</span></Link>
    <div className={styles.cardBody}><div className={styles.eyebrow}>{trip.country} <span> / </span> {trip.destination}</div><h3><Link href={tripUrl(trip)}>{trip.name}</Link></h3><p className={styles.route}>{trip.route}</p><div className={styles.cardDate}><Icon name="calendar" size={17} />{shortDate(trip.date)}<span>·</span>{trip.nights} nights</div><div className={styles.tags}>{trip.attributes.map((tag, i) => <span key={tag} className={i === 0 && tag.includes('Vegan') ? styles.greenTag : ''}>{tag}</span>)}</div><div className={styles.cardBottom}><Price trip={trip} /><Link href={tripUrl(trip)} className={styles.roundLink} aria-label={`View ${trip.name}`}><Icon /></Link></div><Availability trip={trip} /></div>
  </article>;
}

export function SearchDesignPreview() {
  const [draft, setDraft] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [advanced, setAdvanced] = useState(defaultFilters);
  const [sort, setSort] = useState('recommended');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const results = selectPreviewTrips(filters, sort);
  const pages = Math.max(1, Math.ceil(results.length / 3));
  const selectedCount = filterGroups.reduce((n, group) => n + filters[group.key].length, 0) + Number(filters.availableOnly) + Number(filters.offersOnly) + Number(Boolean(filters.vegan));
  const updateAdvanced = value => { setFilters(value); setDraft(current => ({ ...value, destination: current.destination, from: current.from, to: current.to, nights: current.nights, maxPrice: current.maxPrice })); setPage(1); };
  const clear = () => { setFilters(defaultFilters); setDraft(defaultFilters); setAdvanced(defaultFilters); setPage(1); };
  return <PreviewShell title="Find your next blue horizon">
    <main id="preview-main">
      <section className={styles.hero}><img src={asset('ocean.jpg')} alt="Sunlight reaching a coral reef beneath the ocean surface" width="1600" height="900" fetchPriority="high" /><div className={styles.heroContent}><p className={styles.eyebrow}>A LITTLE FURTHER FROM THE EVERYDAY</p><h1>Find your next<br /><em>blue horizon.</em></h1><p>Extraordinary diving. Thoughtful travel.<br />A liveaboard that feels right for you.</p><span className={styles.heroNote}><Icon name="wave" size={17} />Discover a different world</span></div></section>
      <div className={styles.container}>
        <form className={styles.searchBox} onSubmit={e => { e.preventDefault(); setFilters(draft); setPage(1); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
          <div className={styles.searchIntro}><span>YOUR NEXT ADVENTURE</span><strong>Where will the ocean take you?</strong></div>
          <div className={styles.searchFields}>
            <label className={styles.destination}><span><Icon name="pin" size={16} />Destination</span><select aria-label="Destination" value={draft.destination} onChange={e => setDraft({ ...draft, destination: e.target.value })}><option value="">Anywhere extraordinary</option><option>Raja Ampat</option><option>Maldives</option><option>Red Sea</option></select></label>
            <label><span><Icon name="calendar" size={16} />Depart from</span><input aria-label="Depart from" type="date" value={draft.from} max={draft.to || undefined} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
            <label><span>Depart by</span><input aria-label="Depart by" type="date" value={draft.to} min={draft.from || undefined} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
            <label><span><Icon name="clock" size={16} />Trip length</span><select aria-label="Trip length" value={draft.nights} onChange={e => setDraft({ ...draft, nights: e.target.value })}><option value="">Any duration</option><option value="7">Up to 7 nights</option><option value="8">8–12 nights</option></select></label>
            <label><span>Budget · USD</span><select aria-label="Budget · USD" value={draft.maxPrice} onChange={e => setDraft({ ...draft, maxPrice: e.target.value })}><option value="">Any budget</option><option value="2500">Up to $2,500</option><option value="3500">Up to $3,500</option><option value="5000">Up to $5,000</option></select></label>
            <button className={styles.primary} type="submit">Find my trip<Icon size={18} /></button>
          </div>
        </form>
        <div className={styles.reassurance}><span><Icon name="check" size={16} />Find a trip that fits you</span><span><Icon name="leaf" size={16} />Dietary needs, thoughtfully considered</span><span><Icon name="wave" size={16} />Made for ocean people</span></div>
        <section className={styles.explore} id="results" aria-labelledby="results-title">
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>THE OCEAN IS CALLING</p><h2 id="results-title">A world worth diving into.</h2><p>Find your kind of adventure, above and below the surface.</p></div><span className={styles.sampleLabel}>6 sample journeys · design review</span></div>
          <div className={styles.resultsLayout}>
            <aside className={styles.sidebar} aria-label="Advanced search filters"><div className={styles.sidebarHeading}><h3>Make it your trip</h3><button type="button" onClick={clear}>Reset</button></div><AdvancedFilters value={filters} onChange={updateAdvanced} prefix="desktop" /><p className={styles.filterNote}>Accessibility needs are personal. Confirm specific arrangements before travelling.</p></aside>
            <div className={styles.results}>
              <div className={styles.resultsToolbar}><p role="status" aria-live="polite"><strong>{results.length}</strong> sample {results.length === 1 ? 'journey' : 'journeys'}{filters.destination ? ` in ${filters.destination}` : ' to discover'}</p><div><button type="button" className={styles.filterButton} onClick={() => { setAdvanced(filters); setDrawer(true); }}><Icon name="filter" size={18} />Filters{selectedCount > 0 ? <span>{selectedCount}</span> : null}</button><label className={styles.sort}>Sort by<select aria-label="Sort journeys" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="recommended">Recommended</option><option value="price">Price: low to high</option><option value="date">Departure date</option><option value="name">Name</option></select></label></div></div>
              {Object.entries(filters).some(([, value]) => Array.isArray(value) ? value.length : Boolean(value)) ? <div className={styles.activeFilters}><span>Filters applied</span>{filters.destination ? <strong>{filters.destination}</strong> : null}{filters.availableOnly ? <strong>Available spaces</strong> : null}{filters.vegan ? <strong>Vegan Rating {filters.vegan}+</strong> : null}<button type="button" onClick={clear}>Clear all filters ×</button></div> : null}
              {results.length ? <div className={styles.cardGrid}>{results.slice((page - 1) * 3, page * 3).map(trip => <TripCard key={trip.slug} trip={trip} />)}</div> : <div className={styles.empty}><Icon name="wave" size={40} /><h3>A different horizon awaits.</h3><p>Try a wider date range, another destination or fewer filters.</p><button type="button" className={styles.primary} onClick={clear}>Reset filters</button></div>}
              {results.length ? <nav aria-label="Results pages" className={styles.pagination}><span>Showing {(page - 1) * 3 + 1}–{Math.min(page * 3, results.length)} of {results.length}</span><div><button type="button" disabled={page === 1} aria-label="Previous results page" onClick={() => setPage(page - 1)}>←</button>{Array.from({ length: pages }, (_, i) => <button type="button" key={i} aria-label={`Results page ${i + 1}`} aria-current={page === i + 1 ? 'page' : undefined} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button type="button" disabled={page === pages} aria-label="Next results page" onClick={() => setPage(page + 1)}>→</button></div></nav> : null}
              <div className={styles.editorial}><Icon name="leaf" size={30} /><div><h3>Your needs belong in the journey.</h3><p>Vegan meals, dietary preferences and accessibility matter. Find the details that help you feel at home, wherever you dive.</p></div></div>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Modal open={drawer} onClose={() => setDrawer(false)} title="Make it your trip" drawer><div className={styles.drawerContent}><p className={styles.hint}>Fine-tune your sample journey.</p><AdvancedFilters value={advanced} onChange={setAdvanced} prefix="mobile" /></div><div className={styles.drawerActions}><button type="button" onClick={() => setAdvanced({ ...defaultFilters, destination: filters.destination, from: filters.from, to: filters.to, nights: filters.nights, maxPrice: filters.maxPrice })}>Reset advanced filters</button><button type="button" className={styles.primary} onClick={() => { updateAdvanced(advanced); setDrawer(false); }}>Show {selectPreviewTrips(advanced).length} {selectPreviewTrips(advanced).length === 1 ? 'journey' : 'journeys'}<Icon size={17} /></button></div></Modal>
  </PreviewShell>;
}

export function DetailDesignPreview({ trip }) {
  const [gallery, setGallery] = useState(false);
  const [image, setImage] = useState(0);
  const [selected, setSelected] = useState('first');
  const [enquiry, setEnquiry] = useState(false);
  const images = [{ src: 'vessel.jpg', alt: 'Illustrative white yacht in turquoise water' }, { src: 'boat.jpg', alt: 'Illustrative diver swimming beside reef fish' }, { src: 'ocean.jpg', alt: 'Illustrative reef illuminated by sunlight' }, { src: 'reef.jpg', alt: 'Illustrative colourful coral formations' }];
  const departures = [{ id: 'first', date: trip.date, end: trip.end, ...trip }, { ...trip, id: 'second', date: '2027-05-12', end: '2027-05-22', price: 4295, rack: null, offer: null, availability: 'unknown' }, { ...trip, id: 'third', date: '2027-06-12', end: '2027-06-22', price: 4295, rack: null, offer: null, availability: 'sold-out' }];
  const current = departures.find(d => d.id === selected);
  const chooseDeparture = id => { setSelected(id); setEnquiry(false); document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return <PreviewShell title={trip.name} detail>
    <main id="preview-main" className={`${styles.container} ${styles.detailMain}`}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/phase4-preview">Liveaboards</Link><span>/</span><Link href="/phase4-preview">{trip.destination}</Link><span>/</span><span aria-current="page">{trip.name}</span></nav>
      <div className={styles.detailTitle}><div><p className={styles.eyebrow}>{trip.country} · {trip.destination}</p><h1>{trip.name}</h1><p><Icon name="pin" size={17} />{trip.route}</p></div><span className={styles.rating}><Icon name="leaf" /><strong>{trip.vegan}/5</strong> Vegan Rating <small>Sample rating</small></span></div>
      <div className={styles.galleryGrid}><button type="button" className={styles.galleryMain} onClick={() => { setImage(0); setGallery(true); }} aria-label="Open image gallery"><img src={asset(images[0].src)} alt={images[0].alt} width="1000" height="670" fetchPriority="high" /></button>{images.slice(1, 3).map((item, i) => <button type="button" key={item.src} onClick={() => { setImage(i + 1); setGallery(true); }} aria-label={`Open gallery image ${i + 2}`}><img src={asset(item.src)} alt={item.alt} width="650" height="400" /></button>)}<button type="button" className={styles.galleryCount} onClick={() => { setImage(0); setGallery(true); }}>View all 4 photos</button></div>
      <p className={styles.photoDisclaimer}>Illustrative photography · Sample vessel, itinerary, ratings, prices and availability.</p>
      <div className={styles.detailLayout}>
        <div className={styles.detailContent}>
          <nav aria-label="On this page" className={styles.anchorNav}><a href="#overview">Overview</a><a href="#on-board">On board</a><a href="#itinerary">Itinerary</a><a href="#departures">Dates & prices</a></nav>
          <section id="overview" className={styles.detailSection}><p className={styles.eyebrow}>SOME JOURNEYS STAY WITH YOU</p><h2>A little closer to the extraordinary.</h2><p>Wake to quiet anchorages. Slip beneath the surface into a world of colour. Return to a welcoming table and a horizon that changes every day.</p><p>This sample journey through {trip.destination} pairs unforgettable diving with the space to slow down. Small groups, thoughtful food and time on the water, at your own pace.</p><div className={styles.tripStats}><div><strong>{trip.nights}</strong><span>nights at sea</span></div><div><strong>{trip.guests}</strong><span>guests on board</span></div><div><strong>{trip.cabins}</strong><span>guest cabins</span></div><div><strong>3–4</strong><span>dives per day*</span></div></div><small className={styles.hint}>*Illustrative itinerary; actual diving depends on conditions and operator confirmation.</small></section>
          <section id="on-board" className={styles.detailSection}><h2>Make yourself at home.</h2><p>Room to unwind, good company and the details that make a difference.</p><div className={styles.features}><div><Icon name="leaf" /><h3>Food for your journey</h3><p>Sample menu includes vegan and gluten-free options. Confirm individual requirements when enquiring.</p></div><div><Icon name="wave" /><h3>Designed around diving</h3><p>Sample facilities include nitrox, camera preparation space and guided dives.</p></div><div><Icon name="check" /><h3>Thoughtful access</h3><p>Step-free saloon access in this sample. Cabins and dive entry may involve steps; discuss your specific needs.</p></div><div><Icon name="pin" /><h3>Your space to recharge</h3><p>{trip.cabins} sample twin/double cabins, air conditioning and shared indoor/outdoor spaces.</p></div></div><details className={styles.cabin}><summary>Cabin options & what’s included</summary><p>Sample cabin: twin or double occupancy with ensuite bathroom. Sample inclusions: accommodation, meals and guided diving. Equipment hire, flights and local fees require confirmation. Images do not depict actual cabins.</p></details></section>
          <section id="itinerary" className={styles.detailSection}><p className={styles.eyebrow}>A ROUTE LESS ORDINARY</p><h2>{trip.nights} nights. Countless discoveries.</h2><p>Sample itinerary · Subject to weather, conditions and operator confirmation.</p><ol className={styles.itinerary}><li><span>01</span><div><h3>A warm welcome in {trip.route.split(' · ')[0]}</h3><p>Settle in, meet your crew and sail towards your first anchorage.</p><small>Day 1 · Embarkation</small></div></li><li><span>02</span><div><h3>The reefs of {trip.destination}</h3><p>Colourful walls, schools of fish and unhurried evenings on deck.</p><small>Days 2–{Math.ceil(trip.nights / 2)} · Diving & discovery</small></div></li><li><span>03</span><div><h3>More time below the surface</h3><p>Explore reef gardens and sheltered anchorages before your return.</p><small>Days {Math.ceil(trip.nights / 2) + 1}–{trip.nights + 1} · Explore & return</small></div></li></ol></section>
          <section id="departures" className={styles.detailSection}><h2>Find your time to go.</h2><p>Sample departures. All prices in USD per person, sharing a cabin.</p><div className={styles.departureList}><div className={styles.departureHeading}><span>Departure</span><span>From / person</span><span>Availability</span><span>Enquiry</span></div>{departures.map(d => <article className={styles.departure} key={d.id}><div><strong>{shortDate(d.date)}</strong><span>to {shortDate(d.end)} · {d.nights} nights</span></div><div>{d.rack ? <del>{money(d.rack)}</del> : null}<strong>{money(d.price)} <small>USD</small></strong>{d.offer ? <span className={styles.inlineOffer}>{d.offer}</span> : null}</div><Availability trip={d} /><button type="button" className={styles.secondary} disabled={d.availability === 'sold-out'} onClick={() => chooseDeparture(d.id)}>{d.availability === 'sold-out' ? 'Sold out' : 'Enquire'}<Icon size={16} /></button></article>)}</div></section>
        </div>
        <aside className={styles.enquiryCard} id="enquire"><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h2>A journey worth<br />looking forward to.</h2><Price trip={current} large /><Availability trip={current} /><hr /><form onSubmit={e => { e.preventDefault(); setEnquiry(true); }}><label>Sample departure<select aria-label="Sample departure" value={selected} onChange={e => { setSelected(e.target.value); setEnquiry(false); }}>{departures.filter(d => d.availability !== 'sold-out').map(d => <option key={d.id} value={d.id}>{shortDate(d.date)} · {d.nights} nights</option>)}</select></label><label>Your name<input required autoComplete="name" placeholder="Full name" onChange={() => setEnquiry(false)} /></label><label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" onChange={() => setEnquiry(false)} /></label><label>What would make this trip yours?<textarea rows="3" placeholder="Diving experience, dietary or access needs…" onChange={() => setEnquiry(false)} /></label><button className={styles.primary} type="submit">Preview enquiry<Icon size={17} /></button><p className={styles.enquiryNote}>Design preview only. Nothing is sent or saved.</p>{enquiry ? <p role="status" className={styles.success}><Icon name="check" />Preview complete for {trip.name}, {shortDate(current.date)}. No enquiry was submitted.</p> : null}</form></aside>
      </div>
      <div className={styles.mobileCta}><div><span>Sample price · USD / person</span><strong>{money(current.price)}</strong></div><a href="#enquire" className={styles.primary}>Enquire<Icon size={16} /></a></div>
    </main>
    <Modal open={gallery} onClose={() => setGallery(false)} title="A glimpse of the journey"><div className={styles.galleryViewer} onKeyDown={e => { if (e.key === 'ArrowRight') setImage((image + 1) % images.length); if (e.key === 'ArrowLeft') setImage((image + images.length - 1) % images.length); }}><img src={asset(images[image].src)} alt={images[image].alt} width="1200" height="800" /><div><button className={styles.secondary} type="button" aria-label="Previous image" onClick={() => setImage((image + images.length - 1) % images.length)}>←</button><p aria-live="polite">{image + 1} / {images.length} · Illustrative photography</p><button className={styles.secondary} type="button" aria-label="Next image" onClick={() => setImage((image + 1) % images.length)}>→</button></div></div></Modal>
  </PreviewShell>;
}
