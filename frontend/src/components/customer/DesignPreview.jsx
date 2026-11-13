import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { defaultFilters, filterGroups, money, selectPreviewTrips, shortDate } from '@/src/lib/phase4/previewData';
import styles from './DesignPreview.module.css';

const asset = name => `/phase4/${name}`;
const tripUrl = trip => `/phase4-preview/liveaboards/${trip.slug}`;

function BrandLogo({ footer = false }) {
  return <img src={`/brand/${footer ? 'footerLogo.svg' : 'logo.svg'}`} alt="Deeparture" width="240" height="39" />;
}

export function PreviewShell({ title, children, detail = false }) {
  return <div className={`${styles.market} ${!detail ? styles.oceanLanding : ''}`}>
    <Head><title>{`${title} | Deeparture`}</title><meta name="robots" content="noindex,nofollow,noarchive" /><meta name="description" content="Explore liveaboard journeys, destinations and diving experiences with Deeparture." /></Head>
    <a href="#preview-main" className={styles.skip}>Skip to content</a>
    <header className={styles.header}>
      <Link href="/phase4-preview" className={styles.logo} aria-label="Deeparture home"><BrandLogo /></Link>
      <nav aria-label="Main navigation"><Link href="/phase4-preview" className={!detail ? styles.activeNav : undefined}>Liveaboards</Link><a href={detail ? '#overview' : '#our-approach'}>{detail ? 'Life on board' : 'Our approach'}</a></nav>
      {detail ? <Link className={styles.headerCta} href="#enquire">Enquire about this trip</Link> : null}
    </header>
    {children}
    <footer className={styles.footer} id="how-it-works">
      <div className={styles.footerTop}><div className={styles.footerBrand}><Link href="/phase4-preview" className={styles.logo}><BrandLogo footer /></Link><p>For the ocean in you.<br />And the adventures still to come.</p></div>
        <nav aria-label="Explore Deeparture"><h2>Find your adventure</h2><Link href="/phase4-preview">Explore liveaboards</Link><Link href="/phase4-preview/liveaboards/coral-horizon">Discover a journey</Link><Link href="/phase4-preview#our-approach">Our approach</Link></nav>
        <nav aria-label="Plan your journey"><h2>Make it yours</h2><Link href="/phase4-preview/liveaboards/coral-horizon#on-board">Life on board</Link><Link href="/phase4-preview/liveaboards/coral-horizon#departures">Dates & trip details</Link><Link href="/phase4-preview/liveaboards/coral-horizon#enquire">Start with a question</Link></nav>
        <nav aria-label="Operator access"><h2>For operators</h2><Link href="/login">Sign in</Link><Link href="/operator/v2">Operator portal</Link></nav>
      </div><div className={styles.footerBottom}><p>Deeparture · Thoughtfully explored.</p><p>Liveaboards · Dive journeys · Thoughtful travel</p></div>
    </footer>
  </div>;
}

function OceanHero() {
  return <section className={`${styles.hero} ${styles.immersiveHero} ${styles.oceanHero}`} aria-label="Ocean adventures">
    <img src={asset('hero-diver-portrait-v3.jpg')} alt="Close-up underwater portrait of a scuba diver with a white mask and rising bubbles" width="1672" height="941" fetchPriority="high" />
    <div className={styles.heroContent}>
      <p className={styles.oceanEyebrow}>Thoughtfully explored. Deeply remembered.</p>
      <div className={styles.oceanSlide}>
        <h1>Dive beyond<br /><em>the everyday.</em></h1>
        <p>Find your next liveaboard adventure.<br />Extraordinary diving, at your own pace.</p>
      </div>
      <a className={styles.heroNote} href="#results">Explore journeys</a>
    </div>

  </section>;
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
    <div className={styles.dialogHeader}><h2 id={drawer ? 'filter-title' : 'gallery-title'}>{title}</h2><button type="button" className={styles.iconButton} aria-label={`Close ${drawer ? 'filters' : 'gallery'}`} onClick={onClose}>Close</button></div>{children}
  </dialog>;
}

function AdvancedFilters({ value, onChange, prefix }) {
  const toggle = (key, item) => onChange({ ...value, [key]: value[key].includes(item) ? value[key].filter(v => v !== item) : [...value[key], item] });
  return <>
    <fieldset className={styles.filterGroup}><legend>Availability & offers</legend>{[['availableOnly', 'Available spaces only'], ['offersOnly', 'Special offers only']].map(([key, label]) => <label key={key}><input type="checkbox" checked={value[key]} onChange={e => onChange({ ...value, [key]: e.target.checked })} />{label}</label>)}</fieldset>
    <fieldset className={styles.filterGroup}><legend>Vegan Rating</legend><label htmlFor={`${prefix}-vegan`} className={styles.hint}>Minimum Deeparture rating</label><select id={`${prefix}-vegan`} value={value.vegan} onChange={e => onChange({ ...value, vegan: e.target.value })}><option value="">Any rating</option><option value="5">5 / 5</option><option value="4">4 / 5 and above</option><option value="3">3 / 5 and above</option></select></fieldset>
    {filterGroups.map(group => <fieldset key={group.key} className={styles.filterGroup}><legend>{group.title}</legend>{group.items.map(([key, label]) => <label key={key}><input type="checkbox" checked={value[group.key].includes(key)} onChange={() => toggle(group.key, key)} />{label}</label>)}</fieldset>)}
  </>;
}

function TripCard({ trip }) {
  const location = trip.destination === trip.country ? trip.destination : `${trip.destination}, ${trip.country}`;
  return <article className={styles.card}>
    <Link href={tripUrl(trip)} className={styles.cardImage} tabIndex={-1} aria-hidden="true"><img src={asset(trip.image)} alt="" width="640" height="430" loading="lazy" />{trip.offer ? <span className={styles.offer}>{trip.offer}</span> : null}</Link>
    <div className={styles.cardBody}>
      <p className={styles.cardLocation}>{location}</p>
      <h3><Link href={tripUrl(trip)}>{trip.name}</Link></h3>
      <p className={styles.cardDate}>{shortDate(trip.date)}<span>·</span>{trip.nights} nights</p>
      <div className={styles.tags}>{trip.attributes.map(tag => <span key={tag}>{tag}</span>)}</div>
      <div className={styles.cardBottom}><Price trip={trip} /><Availability trip={trip} /></div>
      <Link href={tripUrl(trip)} className={styles.cardLink}>View trip</Link>
    </div>
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
  return <PreviewShell title="Inclusive dive adventures start here">
    <main id="preview-main">
      <OceanHero />
      <div className={styles.container}>
        <form className={styles.searchBox} onSubmit={e => { e.preventDefault(); setFilters(draft); setPage(1); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
          <div className={styles.searchIntro}><strong>Find your dive trip</strong></div>
          <div className={styles.searchFields}>
            <label className={styles.destination}><span>Destination</span><select aria-label="Destination" value={draft.destination} onChange={e => setDraft({ ...draft, destination: e.target.value })}><option value="">Anywhere extraordinary</option><option>Raja Ampat</option><option>Maldives</option><option>Red Sea</option></select></label>
            <label><span>Depart from</span><input aria-label="Depart from" type="date" value={draft.from} max={draft.to || undefined} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
            <label><span>Depart by</span><input aria-label="Depart by" type="date" value={draft.to} min={draft.from || undefined} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
            <label><span>Trip length</span><select aria-label="Trip length" value={draft.nights} onChange={e => setDraft({ ...draft, nights: e.target.value })}><option value="">Any duration</option><option value="7">Up to 7 nights</option><option value="8">8–12 nights</option></select></label>
            <label><span>Budget · USD</span><select aria-label="Budget · USD" value={draft.maxPrice} onChange={e => setDraft({ ...draft, maxPrice: e.target.value })}><option value="">Any budget</option><option value="2500">Up to $2,500</option><option value="3500">Up to $3,500</option><option value="5000">Up to $5,000</option></select></label>
            <button className={styles.primary} type="submit">Search trips</button>
          </div>
        </form>
        <div className={styles.reassurance}><span>Somewhere in mind?</span>{['Raja Ampat', 'Maldives', 'Red Sea'].map(destination => <button key={destination} type="button" onClick={() => { const next = { ...filters, destination }; setFilters(next); setDraft(next); setPage(1); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }); }}>{destination}</button>)}</div>
        <section className={styles.explore} id="results" aria-labelledby="results-title">
          <div className={styles.sectionHeader}><div><h2 id="results-title">Extraordinary days, at sea.</h2><p>Find your next journey. Make it yours.</p></div></div>
          <div className={styles.resultsLayout}>

            <div className={styles.results}>
              <div className={styles.resultsToolbar}><p role="status" aria-live="polite"><strong>{results.length}</strong> {results.length === 1 ? 'journey' : 'journeys'}{filters.destination ? ` in ${filters.destination}` : ' to discover'}</p><div><button type="button" className={styles.filterButton} onClick={() => { setAdvanced(filters); setDrawer(true); }}>Filters{selectedCount > 0 ? <span>{selectedCount}</span> : null}</button><label className={styles.sort}>Sort by<select aria-label="Sort journeys" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="recommended">Recommended</option><option value="price">Price: low to high</option><option value="date">Departure date</option><option value="name">Name</option></select></label></div></div>
              {Object.entries(filters).some(([, value]) => Array.isArray(value) ? value.length : Boolean(value)) ? <div className={styles.activeFilters}><span>Filters applied</span>{filters.destination ? <strong>{filters.destination}</strong> : null}{filters.availableOnly ? <strong>Available spaces</strong> : null}{filters.vegan ? <strong>Vegan Rating {filters.vegan}+</strong> : null}<button type="button" onClick={clear}>Clear all filters ×</button></div> : null}
              {results.length ? <div className={styles.cardGrid}>{results.slice((page - 1) * 3, page * 3).map(trip => <TripCard key={trip.slug} trip={trip} />)}</div> : <div className={styles.empty}><h3>A different horizon awaits.</h3><p>Try a wider date range, another destination or fewer filters.</p><button type="button" className={styles.primary} onClick={clear}>Reset filters</button></div>}
              {results.length ? <nav aria-label="Results pages" className={styles.pagination}><span>Showing {(page - 1) * 3 + 1}–{Math.min(page * 3, results.length)} of {results.length}</span><div><button type="button" disabled={page === 1} aria-label="Previous results page" onClick={() => setPage(page - 1)}>Previous</button>{Array.from({ length: pages }, (_, i) => <button type="button" key={i} aria-label={`Results page ${i + 1}`} aria-current={page === i + 1 ? 'page' : undefined} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button type="button" disabled={page === pages} aria-label="Next results page" onClick={() => setPage(page + 1)}>Next</button></div></nav> : null}

            </div>
          </div>
        </section>
        <section className={styles.whySection} id="our-approach" aria-labelledby="why-title">
          <div className={styles.whyIntro}><h2 id="why-title">A big blue world.<br />A more personal journey.</h2><p>Good travel starts with the details that matter to you. We make room for them.</p></div>
          <div className={styles.whyGrid}>{[
            ['Inclusive by design', 'Dietary preferences and accessibility belong in the conversation from the very start.'],
            ['Clarity before you go', 'See trip dates, price context and availability together, with the details that help you decide.'],
            ['Made for ocean people', 'Explore diving features and itineraries to find the experience that suits your curiosity.'],
            ['Your journey, your pace', 'Compare adventures, ask questions and enquire when you have found something that feels right.'],
          ].map(([title, description]) => <div key={title} className={styles.whyCard}><h3>{title}</h3><p>{description}</p></div>)}</div>
        </section>
      </div>
    </main>
    <Modal open={drawer} onClose={() => setDrawer(false)} title="Make it your trip" drawer><div className={styles.drawerContent}><p className={styles.hint}>Choose what matters to you.</p><AdvancedFilters value={advanced} onChange={setAdvanced} prefix="mobile" /></div><div className={styles.drawerActions}><button type="button" onClick={() => setAdvanced({ ...defaultFilters, destination: filters.destination, from: filters.from, to: filters.to, nights: filters.nights, maxPrice: filters.maxPrice })}>Reset advanced filters</button><button type="button" className={styles.primary} onClick={() => { updateAdvanced(advanced); setDrawer(false); }}>Show {selectPreviewTrips(advanced).length} {selectPreviewTrips(advanced).length === 1 ? 'journey' : 'journeys'}</button></div></Modal>
  </PreviewShell>;
}

export function DetailDesignPreview({ trip }) {
  const [gallery, setGallery] = useState(false);
  const [image, setImage] = useState(0);
  const [selected, setSelected] = useState('first');
  const [enquiry, setEnquiry] = useState(false);
  const images = [{ src: 'vessel.jpg', alt: 'white yacht in turquoise water' }, { src: 'boat.jpg', alt: 'diver swimming beside reef fish' }, { src: 'ocean.jpg', alt: 'reef illuminated by sunlight' }, { src: 'reef.jpg', alt: 'colourful coral formations' }];
  const departures = [{ id: 'first', date: trip.date, end: trip.end, ...trip }, { ...trip, id: 'second', date: '2027-05-12', end: '2027-05-22', price: 4295, rack: null, offer: null, availability: 'unknown' }, { ...trip, id: 'third', date: '2027-06-12', end: '2027-06-22', price: 4295, rack: null, offer: null, availability: 'sold-out' }];
  const current = departures.find(d => d.id === selected);
  const chooseDeparture = id => { setSelected(id); setEnquiry(false); document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return <PreviewShell title={trip.name} detail>
    <main id="preview-main" className={`${styles.container} ${styles.detailMain}`}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/phase4-preview">Liveaboards</Link><span>/</span><Link href="/phase4-preview">{trip.destination}</Link><span>/</span><span aria-current="page">{trip.name}</span></nav>
      <div className={styles.detailTitle}><div><p className={styles.eyebrow}>{trip.country} · {trip.destination}</p><h1>{trip.name}</h1><p>{trip.route}</p></div><span className={styles.rating}><strong>{trip.vegan}/5</strong> Vegan Rating </span></div>
      <div className={styles.galleryGrid}><button type="button" className={styles.galleryMain} onClick={() => { setImage(0); setGallery(true); }} aria-label="Open image gallery"><img src={asset(images[0].src)} alt={images[0].alt} width="1000" height="670" fetchPriority="high" /></button>{images.slice(1, 3).map((item, i) => <button type="button" key={item.src} onClick={() => { setImage(i + 1); setGallery(true); }} aria-label={`Open gallery image ${i + 2}`}><img src={asset(item.src)} alt={item.alt} width="650" height="400" /></button>)}<button type="button" className={styles.galleryCount} onClick={() => { setImage(0); setGallery(true); }}>View all 4 photos</button></div>
      <div className={styles.detailLayout}>
        <div className={styles.detailContent}>
          <nav aria-label="On this page" className={styles.anchorNav}><a href="#overview">Overview</a><a href="#on-board">On board</a><a href="#itinerary">Itinerary</a><a href="#departures">Dates & prices</a></nav>
          <section id="overview" className={styles.detailSection}><h2>A little closer to the extraordinary.</h2><p>Wake to quiet anchorages. Slip beneath the surface into a world of colour. Return to a welcoming table and a horizon that changes every day.</p><p>This journey through {trip.destination} pairs unforgettable diving with the space to slow down. Small groups, thoughtful food and time on the water, at your own pace.</p><div className={styles.tripStats}><div><strong>{trip.nights}</strong><span>nights at sea</span></div><div><strong>{trip.guests}</strong><span>guests on board</span></div><div><strong>{trip.cabins}</strong><span>guest cabins</span></div><div><strong>3–4</strong><span>dives per day*</span></div></div><small className={styles.hint}>*Daily diving depends on conditions and operator confirmation.</small></section>
          <section id="on-board" className={styles.detailSection}><h2>Make yourself at home.</h2><p>Room to unwind, good company and the details that make a difference.</p><div className={styles.features}><div><h3>Food for your journey</h3><p>Share your dietary preferences so the crew can confirm suitable meal options.</p></div><div><h3>Designed around diving</h3><p>Confirm nitrox, camera facilities and any specialist diving requirements before travel.</p></div><div><h3>Thoughtful access</h3><p>Discuss saloon access, cabin routes and dive entry arrangements that suit your needs.</p></div><div><h3>Your space to recharge</h3><p>{trip.cabins} guest cabins. Confirm bedding arrangements and on-board facilities when enquiring.</p></div></div><details className={styles.cabin}><summary>Cabin options & what’s included</summary><p>Cabin arrangements, meals and diving inclusions vary by itinerary. Ask about equipment hire, flights and local fees before confirming your trip.</p></details></section>
          <section id="itinerary" className={styles.detailSection}><h2>{trip.nights} nights. Countless discoveries.</h2><p>Routes are subject to weather, conditions and operator confirmation.</p><ol className={styles.itinerary}><li><span>01</span><div><h3>A warm welcome in {trip.route.split(' · ')[0]}</h3><p>Settle in, meet your crew and sail towards your first anchorage.</p><small>Day 1 · Embarkation</small></div></li><li><span>02</span><div><h3>The reefs of {trip.destination}</h3><p>Colourful walls, schools of fish and unhurried evenings on deck.</p><small>Days 2–{Math.ceil(trip.nights / 2)} · Diving & discovery</small></div></li><li><span>03</span><div><h3>More time below the surface</h3><p>Explore reef gardens and sheltered anchorages before your return.</p><small>Days {Math.ceil(trip.nights / 2) + 1}–{trip.nights + 1} · Explore & return</small></div></li></ol></section>
          <section id="departures" className={styles.detailSection}><h2>Find your time to go.</h2><p>All prices in USD per person, sharing a cabin.</p><div className={styles.departureList}><div className={styles.departureHeading}><span>Departure</span><span>From / person</span><span>Availability</span><span>Enquiry</span></div>{departures.map(d => <article className={styles.departure} key={d.id}><div><strong>{shortDate(d.date)}</strong><span>to {shortDate(d.end)} · {d.nights} nights</span></div><div>{d.rack ? <del>{money(d.rack)}</del> : null}<strong>{money(d.price)} <small>USD</small></strong>{d.offer ? <span className={styles.inlineOffer}>{d.offer}</span> : null}</div><Availability trip={d} /><button type="button" className={styles.secondary} disabled={d.availability === 'sold-out'} onClick={() => chooseDeparture(d.id)}>{d.availability === 'sold-out' ? 'Sold out' : 'Enquire'}</button></article>)}</div></section>
        </div>
        <aside className={styles.enquiryCard} id="enquire"><h2>A journey worth<br />looking forward to.</h2><Price trip={current} large /><Availability trip={current} /><hr /><form onSubmit={e => { e.preventDefault(); setEnquiry(true); }}><label>Departure<select aria-label="Departure" value={selected} onChange={e => { setSelected(e.target.value); setEnquiry(false); }}>{departures.filter(d => d.availability !== 'sold-out').map(d => <option key={d.id} value={d.id}>{shortDate(d.date)} · {d.nights} nights</option>)}</select></label><label>Your name<input required autoComplete="name" placeholder="Full name" onChange={() => setEnquiry(false)} /></label><label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" onChange={() => setEnquiry(false)} /></label><label>What would make this trip yours?<textarea rows="3" placeholder="Diving experience, dietary or access needs…" onChange={() => setEnquiry(false)} /></label><button className={styles.primary} type="submit">Review enquiry</button>{enquiry ? <p role="status" className={styles.success}>Review your enquiry for {trip.name}, {shortDate(current.date)}. Check your trip details before sending.</p> : null}</form></aside>
      </div>
      <div className={styles.mobileCta}><div><span>USD / person</span><strong>{money(current.price)}</strong></div><a href="#enquire" className={styles.primary}>Enquire</a></div>
    </main>
    <Modal open={gallery} onClose={() => setGallery(false)} title="A glimpse of the journey"><div className={styles.galleryViewer} onKeyDown={e => { if (e.key === 'ArrowRight') setImage((image + 1) % images.length); if (e.key === 'ArrowLeft') setImage((image + images.length - 1) % images.length); }}><img src={asset(images[image].src)} alt={images[image].alt} width="1200" height="800" /><div><button className={styles.secondary} type="button" aria-label="Previous image" onClick={() => setImage((image + images.length - 1) % images.length)}>Previous</button><p aria-live="polite">{image + 1} / {images.length}</p><button className={styles.secondary} type="button" aria-label="Next image" onClick={() => setImage((image + 1) % images.length)}>Next</button></div></div></Modal>
  </PreviewShell>;
}
