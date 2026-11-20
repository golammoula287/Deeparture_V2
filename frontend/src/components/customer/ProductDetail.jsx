import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerShell from './CustomerShell';
import EnquiryForm from '@/src/components/v2/EnquiryForm';
import styles from './ProductDetail.module.css';

const list = value => Array.isArray(value) ? value : [];
const idOf = value => typeof value === 'string' ? value : value?._id;
const words = value => String(value || '').replace(/[_-]/g, ' ');
const textOf = value => value === 'freediving' ? 'Freediving supported' : typeof value === 'string' ? words(value) : value?.label || value?.name || value?.value || '';
const date = value => {
  const parsed = new Date(value);
  return value && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed) : 'Dates on request';
};
const money = (amount, currency) => {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return 'Price on request';
  if (!currency || !/^[A-Za-z]{3}$/.test(currency)) return `${Number(amount).toLocaleString('en')} · currency on request`;
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amount); }
  catch { return 'Price on request'; }
};
const mediaUrl = value => {
  const source = typeof value === 'string' ? value : value?.url || value?.src;
  return typeof source === 'string' && (/^https?:\/\//.test(source) || /^\/(?!\/)/.test(source)) ? source : null;
};
function Photo({ src, alt, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`${styles.photoFallback} ${className}`}><span>Photographs on request</span></div>;
  return <img className={className} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
}
function Features({ title, values }) {
  const items = list(values).map(textOf).filter(value => typeof value === 'string' && value);
  return <section className={styles.featureGroup}><h3>{title}</h3>{items.length ? <ul>{items.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul> : <p>Ask us about your requirements.</p>}</section>;
}
function availability(departure) {
  if (departure.status === 'sold_out') return 'Sold out';
  if (departure.status === 'on_request') return 'Availability on request';
  return 'Check availability';
}
function Gallery({ images, name }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const prior = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; (prior || trigger.current)?.focus(); };
  }, [open]);
  return <>
    <div className={styles.gallery}>
      <Photo src={images[0]} alt={`${name} main photograph`} className={styles.mainPhoto} eager />
      {images.length > 1 && <div className={styles.gallerySide}>{images.slice(1, 3).map((src, position) => <Photo key={src} src={src} alt={`${name} photograph ${position + 2}`} />)}</div>}
      {images.length > 0 && <button type="button" ref={trigger} onClick={() => setOpen(true)} className={styles.galleryButton}>View {images.length === 1 ? 'photo' : `${images.length} photos`}</button>}
    </div>
    <dialog ref={dialog} className={styles.galleryDialog} aria-labelledby="product-gallery-title" onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => { if (event.target === dialog.current) setOpen(false); }} onKeyDown={event => { if (event.key === 'ArrowRight') setIndex(current => (current + 1) % images.length); if (event.key === 'ArrowLeft') setIndex(current => (current - 1 + images.length) % images.length); }}>
      <div className={styles.dialogHeader}><h2 id="product-gallery-title">{name} photographs</h2><button type="button" onClick={() => setOpen(false)}>Close</button></div>
      {images.length > 0 && <Photo src={images[index]} alt={`${name} photograph ${index + 1} of ${images.length}`} className={styles.dialogPhoto} />}
      <div className={styles.dialogActions}><button type="button" disabled={images.length < 2} onClick={() => setIndex(current => (current - 1 + images.length) % images.length)}>Previous</button><span aria-live="polite">{index + 1} / {images.length}</span><button type="button" disabled={images.length < 2} onClick={() => setIndex(current => (current + 1) % images.length)}>Next</button></div>
    </dialog>
  </>;
}

export default function ProductDetail({ product, type = 'vessel' }) {
  const resort = type === 'resort';
  const router = useRouter();
  const choices = list(resort ? product.packages : product.departures).filter(item => item.status !== 'cancelled');
  const [selectedId, setSelectedId] = useState('');
  const selected = choices.find(item => idOf(item) === selectedId);
  useEffect(() => {
    const requested = resort ? router.query.package : router.query.departure;
    setSelectedId('');
    if (typeof requested === 'string' && choices.some(item => idOf(item) === requested && item.status !== 'sold_out')) setSelectedId(requested);
  }, [router.query.package, router.query.departure, resort, product]);
  const images = [...new Set([product.featuredImage, ...list(product.gallery)].map(mediaUrl).filter(Boolean))];
  const cabins = resort ? list(product.roomTypes) : [...new Map(list(product.itineraries).flatMap(item => list(item.basePrices).map(price => price.cabinType)).filter(cabin => cabin && typeof cabin === 'object' && cabin.name).map(cabin => [idOf(cabin) || cabin.name, cabin])).values()];
  const location = list(product.destinationSlugs).map(words).join(' · ') || [product.region, product.country].filter(Boolean).join(', ');
  const baseFinder = resort ? '/explore/resorts' : '/explore/liveaboards';
  const returnTo = router.query.returnTo;
  const finder = typeof returnTo === 'string' && (returnTo === baseFinder || returnTo.startsWith(`${baseFinder}?`)) ? returnTo : baseFinder;
  const choose = id => { setSelectedId(id); document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const selectionDate = selected && !resort ? `${date(selected.startDate)} – ${date(selected.endDate)}` : '';
  return <CustomerShell title={`${product.name} ${resort ? 'dive resort' : 'liveaboard'}`} description={product.summary || `Explore ${product.name} and enquire about your next dive journey.`}>
    <main className={styles.page}>
      <Link href={finder} className={styles.back}>Back to {resort ? 'resorts' : 'liveaboards'}</Link>
      <div className={styles.identity}><div><p className={styles.eyebrow}>{resort ? 'Dive resort' : 'Liveaboard'}{location ? ` · ${location}` : ''}</p><h1>{product.name}</h1>{product.organisation?.name && <p className={styles.operator}>Operated by {product.organisation.name}</p>}</div><a href={choices.length ? '#trip-options' : '#enquire'} className={styles.primary}>{choices.length ? resort ? 'View packages' : 'View departures' : 'Enquire about this trip'}</a></div>
      <Gallery images={images} name={product.name} />
      <nav className={styles.sectionNav} aria-label="On this page"><a href="#overview">Overview</a><a href="#features">Features</a>{!resort && <a href="#itineraries">Itineraries</a>}<a href="#accommodation">{resort ? 'Rooms' : 'Cabins'}</a><a href="#trip-options">{resort ? 'Packages' : 'Departures'}</a><a href="#enquire">Enquire</a></nav>
      <div className={styles.columns}>
        <div className={styles.content}>
          <section id="overview" className={styles.section}><p className={styles.eyebrow}>Your time {resort ? 'by the ocean' : 'at sea'}</p><h2>A closer look at {product.name}</h2>{product.summary && <p className={styles.lead}>{product.summary}</p>}{product.description && <p className={styles.description}>{product.description}</p>}
            <dl className={styles.facts}>{!resort && product.maxGuests > 0 && <div><dt>Guests</dt><dd>{product.maxGuests}</dd></div>}{!resort && product.cabinCount > 0 && <div><dt>Cabins</dt><dd>{product.cabinCount}</dd></div>}{!resort && product.lengthMeters > 0 && <div><dt>Length</dt><dd>{product.lengthMeters} m</dd></div>}{Number.isFinite(product.veganRating) && <div><dt>Vegan Rating</dt><dd>{product.veganRating} / 5</dd></div>}</dl>
          </section>
          <section id="features" className={styles.section}><h2>Made for your kind of journey</h2><p className={styles.muted}>Explore the information provided, and ask us about any requirements that matter to you.</p><div className={styles.features}><Features title="Dietary support" values={product.dietary} /><Features title="Accessibility" values={product.accessibility} /><Features title="Diving" values={product.divingFeatures} /><Features title="Facilities" values={product.facilities} /></div></section>
          {!resort && <section id="itineraries" className={styles.section}><p className={styles.eyebrow}>Explore further</p><h2>Itineraries</h2>{list(product.itineraries).length ? list(product.itineraries).map(item => <article key={idOf(item) || item.name} className={styles.infoCard}><h3>{item.name}</h3><p className={styles.muted}>{[item.numberOfNights ? `${item.numberOfNights} nights` : '', item.numberOfDives ? `${item.numberOfDives} dives` : '', item.embarkation?.name && item.disembarkation?.name ? `${item.embarkation.name} to ${item.disembarkation.name}` : ''].filter(Boolean).join(' · ')}</p>{item.routeSummary && <p>{item.routeSummary}</p>}{item.description && <p className={styles.description}>{item.description}</p>}{item.minimumCertification && <p>Minimum certification: {item.minimumCertification}</p>}{item.minimumLoggedDives > 0 && <p>Minimum logged dives: {item.minimumLoggedDives}</p>}</article>) : <p className={styles.empty}>Ask us about current routes and itineraries.</p>}</section>}
          <section id="accommodation" className={styles.section}><p className={styles.eyebrow}>Rest between dives</p><h2>{resort ? 'Rooms' : 'Cabins'}</h2>{cabins.length ? <div className={styles.accommodation}>{cabins.map(cabin => <article key={idOf(cabin) || cabin.name} className={styles.room}>{mediaUrl(cabin.image || list(cabin.images)[0]) && <Photo src={mediaUrl(cabin.image || list(cabin.images)[0])} alt={cabin.name} />}<div><h3>{cabin.name}</h3>{cabin.description && <p>{cabin.description}</p>}<p className={styles.muted}>{[cabin.maxOccupancy > 0 ? `Up to ${cabin.maxOccupancy} guests` : '', cabin.ensuite === true ? 'Ensuite bathroom' : '', cabin.airConditioned === true ? 'Air conditioning' : ''].filter(Boolean).join(' · ')}</p></div></article>)}</div> : <p className={styles.empty}>Room and cabin details are available on enquiry.</p>}</section>
          <section id="trip-options" className={styles.section}><p className={styles.eyebrow}>{resort ? 'Plan your stay' : 'Find your dates'}</p><h2>{resort ? 'Packages' : 'Upcoming departures'}</h2><p className={styles.muted}>{resort ? 'Package starting prices are shown where provided. Ask us to confirm the rate for your preferred dates.' : 'Choose a departure to include its details in your enquiry. Prices and availability will be confirmed by the team.'}</p>
            {choices.length ? <div className={styles.options}>{choices.map(item => <article key={idOf(item)} className={`${styles.option} ${selectedId === idOf(item) ? styles.selected : ''}`}><div><h3>{resort ? item.name : `${date(item.startDate)} – ${date(item.endDate)}`}</h3><p className={styles.muted}>{resort ? [item.roomType?.name, item.numberOfNights ? `${item.numberOfNights} nights` : '', item.numberOfDives ? `${item.numberOfDives} dives` : ''].filter(Boolean).join(' · ') : item.itinerary?.name || 'Itinerary details on request'}</p>{item.description && <p>{item.description}</p>}{resort && list(item.inclusions).length > 0 && <p>Includes: {item.inclusions.join(' · ')}</p>}<p className={styles.status}>{resort ? 'Availability on request' : availability(item)}</p></div><div className={styles.optionAction}><strong>{money(resort ? item.basePrice?.amount : item.effectiveMinPrice, resort ? item.basePrice?.currency : item.effectiveCurrency)}</strong><span>{resort && item.basePrice?.pricingBasis ? words(item.basePrice.pricingBasis) : 'Starting price · confirm pricing basis'}</span><button type="button" disabled={item.status === 'sold_out'} onClick={() => choose(idOf(item))}>{item.status === 'sold_out' ? 'Sold out' : selectedId === idOf(item) ? 'Selected · Enquire' : resort ? 'Enquire about package' : 'Enquire about departure'}</button></div></article>)}</div> : <div className={styles.empty}><h3>{resort ? 'Packages on request' : 'Dates on request'}</h3><p>Send a general enquiry and tell us when you would like to travel.</p><a href="#enquire">Enquire about {product.name}</a></div>}
          </section>
        </div>
        <aside id="enquire" className={styles.enquiry}><p className={styles.eyebrow}>Start with a question</p><h2>Your next deeparture</h2><p className={styles.muted}>Tell us what you have in mind. An enquiry does not reserve space or confirm a price.</p><div className={styles.selection}><strong>{product.name}</strong>{selected ? <><p>{resort ? selected.name : selected.itinerary?.name || 'Selected departure'}</p>{selectionDate && <p>{selectionDate}</p>}<button type="button" onClick={() => setSelectedId('')}>Change to general enquiry</button></> : <p>General enquiry · dates flexible</p>}</div><EnquiryForm productType={type} productId={product._id} itineraryId={selected && !resort ? idOf(selected.itinerary) : undefined} departureId={selected && !resort ? idOf(selected) : undefined} packageId={selected && resort ? idOf(selected) : undefined} /></aside>
      </div>
    </main>
  </CustomerShell>;
}
