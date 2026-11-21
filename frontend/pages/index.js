import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import CustomerShell from '@/src/components/customer/CustomerShell';
import HomeSearch from '@/src/components/customer/HomeSearch';
import HomeIcon from '@/src/components/customer/HomeIcon';
import HomeCatalogueCard from '@/src/components/customer/HomeCatalogueCard';
import { catalogueRead, noStore } from '@/src/lib/customer/publicCatalogue';
import { destinations, values } from '@/src/lib/customer/destinations';
import { departureOffer } from '@/src/lib/customer/specialOffers';
import styles from '@/src/components/customer/HomePage.module.css';

const explore = [
  { title: 'Liveaboards', href: '/explore/liveaboards', image: '/phase4/vessel.jpg' },
  { title: 'Resorts', href: '/explore/resorts', image: '/phase4/hero-island.jpg' },
  { title: 'Special Offers', href: '/special-offers', image: '/phase4/hero-underwater.jpg' },
  { title: 'Destinations', href: '/destinations', image: '/phase4/reef.jpg' },
];
export default function Home({ featured = [], specialOffers = [], catalogueError = false, offersError = false, definitions = [], definitionsError = false, ports = [], portsError = false, palette = 'coral', colourPreview = false }) {
  return <CustomerShell homepage homePalette={palette} title="Inclusive dive adventures start here" description="Find liveaboards and dive resorts around your destination, budget, dietary needs, accessibility and diving preferences. Explore the details, then enquire.">
    {colourPreview && <Head><meta name="robots" content="noindex,follow" /></Head>}
    <main className={styles.home}>
      {colourPreview && <nav className={styles.paletteComparison} aria-label="Homepage colour comparison"><span>Compare colours</span>{[['coral', '01 · Ocean & Coral'], ['midnight', '02 · Midnight & Champagne']].map(([value, label]) => <Link key={value} href={`/?palette=${value}`} aria-current={palette === value ? 'page' : undefined}><span className={styles.paletteSwatch} data-palette={value} aria-hidden="true" />{label}</Link>)}</nav>}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.referenceHeroArt} role="img" aria-label="Scuba diver swimming above a whale shark in sea-green water" />
        <div className={styles.heroInner}><h1 id="home-title">Inclusive dive<br />adventures start here</h1><p>Travel for everyone.</p></div>
      </section>
      <div className={styles.body}>
        <HomeSearch definitions={definitions} definitionsError={definitionsError} ports={ports} portsError={portsError} />
        <section className={styles.discovery} aria-labelledby="explore-title"><h2 id="explore-title">Explore Deeparture</h2><div className={styles.exploreGrid}>{explore.map(tile => <Link key={tile.title} href={tile.href} className={styles.exploreTile}><Image src={tile.image} alt="" fill sizes="(max-width: 700px) 45vw, 23vw" quality={75} /><h3>{tile.title}</h3><HomeIcon size={19} /></Link>)}</div></section>
        <section className={styles.benefits} id="why-deeparture" aria-labelledby="why-title"><h2 id="why-title">Why Deeparture</h2>{values.map(([icon, title, text]) => <article key={title}><img src={`/brand/pictographs/${icon}.svg`} alt="" width="32" height="32" /><div><h3>{title}</h3><p>{text}</p></div></article>)}</section>
        <section id="featured-trips" className={styles.section} aria-labelledby="featured-title"><div className={styles.sectionHeading}><h2 id="featured-title">Featured trips</h2><Link href="/featured-trips" className={styles.textLink}>View all featured trips<HomeIcon size={18} /></Link></div>
          {featured.length ? <div className={styles.catalogueGrid}>{featured.map(({ item, departure, type, offer }) => <HomeCatalogueCard key={`${type}-${item._id}`} item={item} departure={departure} type={type} offer={offer} />)}</div> : <div className={styles.catalogueEmpty}><HomeIcon name="compass" size={34} /><div><h3>{catalogueError ? 'Featured trips couldn’t load.' : 'No featured trips to show.'}</h3><p>{catalogueError ? 'We couldn’t load the catalogue just now. Your next destination can still start with a little inspiration below.' : 'There are no featured listings to show right now. Explore the catalogue or browse by destination.'}</p></div>{catalogueError ? <a href="/">Retry catalogue<HomeIcon size={17} /></a> : <Link href="/explore/liveaboards">Explore trips<HomeIcon size={17} /></Link>}</div>}
          {catalogueError && featured.length > 0 && <p className={styles.sectionNote} role="status">Some featured trips couldn’t load. <a href="/">Retry catalogue</a></p>}
          <p className={styles.sectionNote}>Every journey starts with an enquiry. Prices, dates and availability are confirmed before a booking is agreed.</p>
        </section>
        <section id="special-offers" className={styles.section} aria-labelledby="offers-title"><div className={styles.sectionHeading}><h2 id="offers-title">Special Offers</h2><div className={styles.offerLinks}><Link href="/special-offers" className={styles.textLink}>View all special offers<HomeIcon size={16} /></Link><Link href="/contact?subject=special-offers" className={styles.textLink}>Enquire about special offers.<HomeIcon size={16} /></Link></div></div>{specialOffers.length ? <><div className={styles.catalogueGrid}>{specialOffers.map(({ item, departure, type, offer, activeOffer }) => <HomeCatalogueCard key={`offer-${type}-${item._id}`} item={item} departure={departure} type={type} offer={offer} activeOffer={activeOffer} />)}</div><p className={styles.sectionNote}>Confirm offer eligibility and final pricing by enquiry.</p></> : !offersError && <p className={styles.sectionNote}>No current offers to show. Ask our team about your preferred destination and dates.</p>}{offersError && <p className={styles.sectionNote} role="status">Some offers couldn’t load. <a href="/?retry=offers#special-offers">Retry offers</a></p>}</section>
        <section className={styles.destinations} id="destinations" aria-labelledby="destinations-title"><div><h2 id="destinations-title">Popular destinations</h2><p>Explore leading dive destinations around the world.</p></div><div className={styles.destinationGrid}>{destinations.map(destination => <Link key={destination.slug} className={styles.destination} href={`/destinations/${destination.slug}`}><Image src={destination.image} alt="" fill sizes="(max-width: 700px) 90vw, 13vw" /><h3>{destination.name}</h3><HomeIcon size={17} /></Link>)}</div></section>
      </div>
    </main>
  </CustomerShell>;
}
Home.customerPage = true;

export async function getServerSideProps({ res, query = {} }) {
  noStore(res);
  if (query.featuredPage !== undefined) return { redirect: { destination: "/featured-trips", permanent: false } };
  const [vessels, resorts, vesselOffers, resortOffers, definitions, ports] = await Promise.all([
    catalogueRead('liveaboards', { featured: true, limit: 3 }),
    catalogueRead('resorts', { featured: true, limit: 1 }),
    catalogueRead('liveaboards', { activeOffer: true, limit: 3 }),
    catalogueRead('resorts', { activeOffer: true, limit: 1 }),
    catalogueRead('attributes'),
    catalogueRead('embarkation-ports'),
  ]);

  const entries = (result, type) => (result.data?.items || []).filter(item => item.slug).map(item => ({ item, type }));
  const featuredVessels = entries(vessels, 'vessel');
  const featuredResorts = entries(resorts, 'resort');
  const promotedVessels = entries(vesselOffers, 'vessel');
  const promotedResorts = entries(resortOffers, 'resort');
  const vesselSlugs = [...new Set([...featuredVessels, ...promotedVessels].map(({ item }) => item.slug))];
  const details = new Map(await Promise.all(vesselSlugs.map(async slug => [slug, await catalogueRead(`liveaboards/${encodeURIComponent(slug)}`)])));
  const eligibleDepartures = slug => (details.get(slug)?.data?.departures || []).filter(departure => departure.status !== 'cancelled' && departure.status !== 'sold_out');

  const featured = [
    ...featuredVessels.map(entry => ({ ...entry, departure: eligibleDepartures(entry.item.slug)[0] || null })),
    ...featuredResorts,
  ];
  const specialOffers = [
    ...promotedVessels.map(entry => {
      for (const departure of eligibleDepartures(entry.item.slug)) {
        const offer = departureOffer(departure);
        if (offer) return { ...entry, departure, offer, activeOffer: true };
      }
      return { ...entry, activeOffer: true };
    }),
    ...promotedResorts.map(entry => ({ ...entry, activeOffer: true })),
  ];

  return { props: {
    featured,
    specialOffers,
    catalogueError: Boolean(vessels.error || resorts.error),
    offersError: Boolean(vesselOffers.error || resortOffers.error || promotedVessels.some(({ item }) => details.get(item.slug)?.error)),
    definitions: definitions.data || [],
    definitionsError: Boolean(definitions.error),
    ports: ports.data || [],
    portsError: Boolean(ports.error),
    palette: query.palette === 'midnight' ? 'midnight' : 'coral',
    colourPreview: query.palette === 'coral' || query.palette === 'midnight',
  } };
}
