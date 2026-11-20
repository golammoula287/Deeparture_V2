import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import CustomerShell from '@/src/components/customer/CustomerShell';
import HomeSearch from '@/src/components/customer/HomeSearch';
import HomeIcon from '@/src/components/customer/HomeIcon';
import HomeCatalogueCard from '@/src/components/customer/HomeCatalogueCard';
import { catalogueRead, noStore } from '@/src/lib/customer/publicCatalogue';
import { departureOffer } from '@/src/lib/customer/specialOffers';
import styles from '@/src/components/customer/HomePage.module.css';

const explore = [
  { title: 'Liveaboards', href: '/explore/liveaboards', image: '/phase4/vessel.jpg' },
  { title: 'Resorts', href: '/explore/resorts', image: '/phase4/hero-island.jpg' },
  { title: 'Special Offers', href: '#special-offers', image: '/phase4/hero-underwater.jpg' },
  { title: 'Destinations', href: '#destinations', image: '/phase4/reef.jpg' },
];
const destinations = [
  { name: 'Raja Ampat', slug: 'raja-ampat', caption: 'Indonesia' },
  { name: 'Maldives', slug: 'maldives', caption: 'Indian Ocean' },
  { name: 'Komodo', slug: 'komodo', caption: 'Indonesia' },
  { name: 'Red Sea', slug: 'red-sea', caption: 'Northeast Africa & Arabia' },
  { name: 'Galápagos', slug: 'galapagos', caption: 'Ecuador' },
  { name: 'Philippines', slug: 'philippines', caption: 'Southeast Asia' },
];

export default function Home({ featured = [], catalogueError = false, offersError = false, definitions = [], definitionsError = false, ports = [], portsError = false, palette = 'coral', colourPreview = false }) {
  const specialOffers = featured.filter(entry => entry.offer);
  return <CustomerShell homepage homePalette={palette} title="Inclusive dive adventures start here" description="Find liveaboards and dive resorts around your destination, budget, dietary needs, accessibility and diving preferences. Explore the details, then enquire.">
    {colourPreview && <Head><meta name="robots" content="noindex,follow" /></Head>}
    <main className={styles.home}>
      {colourPreview && <nav className={styles.paletteComparison} aria-label="Homepage colour comparison"><span>Compare colours</span>{[['coral', '01 · Ocean & Coral'], ['midnight', '02 · Midnight & Champagne']].map(([value, label]) => <Link key={value} href={`/?palette=${value}`} aria-current={palette === value ? 'page' : undefined}><span className={styles.paletteSwatch} data-palette={value} aria-hidden="true" />{label}</Link>)}</nav>}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.referenceHeroArt} role="img" aria-label="Scuba diver swimming above a whale shark in sea-green water" />
        <div className={styles.heroInner}><h1 id="home-title">Inclusive dive<br />adventures start here</h1><p>Book your diving trip online</p></div>
      </section>
      <div className={styles.body}>
        <HomeSearch definitions={definitions} definitionsError={definitionsError} ports={ports} portsError={portsError} />
        <section className={styles.discovery} aria-label="Explore diving holidays"><div className={styles.exploreGrid}>{explore.map(tile => <Link key={tile.title} href={tile.href} className={styles.exploreTile}><Image src={tile.image} alt="" fill sizes="(max-width: 700px) 45vw, 23vw" quality={75} /><h2>{tile.title}</h2><HomeIcon size={19} /></Link>)}</div></section>
        <section className={styles.benefits} id="why-deeparture" aria-labelledby="why-title"><h2 id="why-title">Why Deeparture</h2>{[
          ['inclusivity', 'Inclusivity', 'Dive travel designed around individual needs.'],
          ['trust', 'Trust', 'Explore the details. Enquire with confidence.'],
          ['experience', 'Experience', 'Find your next diving adventure.'],
          ['best-price', 'Best price', 'Found a better deal? Ask our team to compare.'],
        ].map(([icon, title, text]) => <article key={title}><img src={`/brand/pictographs/${icon}.svg`} alt="" width="32" height="32" /><div><h3>{title}</h3><p>{text}</p></div></article>)}</section>
        <section className={styles.section} aria-labelledby="featured-title"><div className={styles.sectionHeading}><div><h2 id="featured-title">Featured trips &amp; special offers</h2></div><Link href="#special-offers" className={styles.textLink}>View all special offers<HomeIcon size={18} /></Link></div>
          {featured.length ? <div className={styles.catalogueGrid}>{featured.map(({ item, departure, type, offer }) => <HomeCatalogueCard key={`${type}-${item._id}`} item={item} departure={departure} type={type} offer={offer} />)}</div> : <div className={styles.catalogueEmpty}><HomeIcon name="compass" size={34} /><div><h3>{catalogueError ? 'A little pause in your journey.' : 'Your next adventure starts with exploring.'}</h3><p>{catalogueError ? 'We couldn’t load the catalogue just now. Your next destination can still start with a little inspiration below.' : 'There are no featured listings to show right now. Explore the catalogue or browse by destination.'}</p></div>{catalogueError ? <a href="/">Retry catalogue<HomeIcon size={17} /></a> : <Link href="/explore/liveaboards">Explore trips<HomeIcon size={17} /></Link>}</div>}
          {catalogueError && featured.length > 0 && <p className={styles.sectionNote} role="status">Some listings couldn’t load. <a href="/">Retry catalogue</a></p>}
          <p className={styles.sectionNote}>Every journey starts with an enquiry. Prices, dates and availability are confirmed before a booking is agreed.</p>
        </section>
        <section id="special-offers" className={styles.section} aria-labelledby="offers-title"><div className={styles.sectionHeading}><h2 id="offers-title">Special Offers</h2><Link href="/contact?subject=special-offers" className={styles.textLink}>Ask about offers<HomeIcon size={16} /></Link></div>{specialOffers.length ? <><div className={styles.catalogueGrid}>{specialOffers.map(({ item, departure, type, offer }) => <HomeCatalogueCard key={`offer-${item._id}`} item={item} departure={departure} type={type} offer={offer} />)}</div><p className={styles.sectionNote}>Selected departures and cabin prices only. Confirm eligibility and final pricing by enquiry.</p></> : !offersError && <p className={styles.sectionNote}>No current offers to show. Ask our team about your preferred destination and dates.</p>}{offersError && <p className={styles.sectionNote} role="status">Some offers couldn’t load. <a href="/?retry=offers#special-offers">Retry offers</a></p>}</section>
        <section className={styles.destinations} id="destinations" aria-labelledby="destinations-title"><div><h2 id="destinations-title">Popular Destinations</h2><p>Explore top dive regions<br />around the world.</p></div><div className={styles.destinationGrid}>{destinations.map((destination, index) => <Link key={destination.slug} className={styles.destination} href={`/explore/liveaboards?destination=${destination.slug}`}><Image src={['/phase4/hero-island.jpg', '/phase4/ocean.jpg', '/phase4/reef.jpg', '/phase4/hero-underwater.jpg', '/phase4/hero-scuba.jpg', '/phase4/hero-clear-water-diver.jpg'][index]} alt="" fill sizes="(max-width: 700px) 90vw, 13vw" /><h3>{destination.name}</h3><HomeIcon size={17} /></Link>)}</div></section>
      </div>
    </main>
  </CustomerShell>;
}
Home.customerPage = true;

export async function getServerSideProps({ res, query = {} }) {
  noStore(res);
  const [vesselsResult, resortsResult, definitionsResult, portsResult] = await Promise.all([
    catalogueRead('liveaboards', { limit: 3, sort: 'name' }),
    catalogueRead('resorts', { limit: 1, sort: 'name' }),
    catalogueRead('attributes'),
    catalogueRead('embarkation-ports'),
  ]);
  const vessels = Array.isArray(vesselsResult.data?.items) ? vesselsResult.data.items.filter(item => item.slug) : [];
  const resorts = Array.isArray(resortsResult.data?.items) ? resortsResult.data.items.filter(item => item.slug) : [];
  const details = await Promise.all(vessels.map(item => catalogueRead(`liveaboards/${encodeURIComponent(item.slug)}`)));
  const featured = [...vessels.map((item, index) => ({ item, type: 'vessel', departure: details[index].data?.departures?.find(departure => departure.status !== 'cancelled' && departure.status !== 'sold_out') || null })), ...resorts.map(item => ({ item, type: 'resort', departure: null }))];
  const withOffers = featured.map(entry => ({ ...entry, offer: departureOffer(entry.departure) }));
  return { props: { featured: withOffers, catalogueError: Boolean(vesselsResult.error || resortsResult.error), offersError: Boolean(vesselsResult.error || details.some(result => result.error)), definitions: Array.isArray(definitionsResult.data) ? definitionsResult.data : [], definitionsError: Boolean(definitionsResult.error), ports: portsResult.data || [], portsError: Boolean(portsResult.error), palette: query.palette === 'midnight' ? 'midnight' : 'coral', colourPreview: query.palette === 'coral' || query.palette === 'midnight' } };
}
