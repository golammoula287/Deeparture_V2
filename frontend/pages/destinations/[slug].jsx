import Link from 'next/link';
import CustomerShell from '@/src/components/customer/CustomerShell';
import CatalogueCard from '@/src/components/customer/CatalogueCard';
import { destinations } from '@/src/lib/customer/destinations';
import { catalogueRead, noStore } from '@/src/lib/customer/publicCatalogue';
import styles from '@/src/components/customer/Marketplace.module.css';

const types = [{ kind: 'vessel', route: 'liveaboards', label: 'Liveaboards' }, { kind: 'resort', route: 'resorts', label: 'Resorts' }];

export default function DestinationGuide({ destination, results }) {
  const path = `/destinations/${destination.slug}`;
  return <CustomerShell title={destination.name} description={destination.description || `Explore liveaboards and dive resorts in ${destination.name} with Deeparture.`}>
    <main>
      <section className={styles.finderHero} aria-labelledby="guide-title">
        <div className={styles.finderHeroInner}><p>{destination.region}</p><h1 id="guide-title">{destination.name}</h1></div>
      </section>
      <div className={styles.finder}>
        <Link href="/destinations" className={styles.textLink}>All destinations</Link>
        {results.map(({ kind, route, label, data, error }) => <section key={kind} className={styles.discoverySection} aria-label={label}>
          <h2>{label}</h2>
          {error ? <p role="alert">These listings couldn’t load. <a href={path}>Retry</a></p>
            : data?.items?.length ? <div className={styles.discoveryCards}>
              {data.items.map(item => <CatalogueCard key={item._id} item={item} type={kind} departure={item.departure} startingRate={item.startingRate} returnTo={path} />)}
            </div> : <p>No published {label.toLowerCase()} for this destination yet.</p>}
          <Link href={`/explore/${route}?destination=${destination.slug}`} className={styles.textLink}>Explore {label.toLowerCase()} in {destination.name}</Link>
        </section>)}
      </div>
    </main>
  </CustomerShell>;
}
DestinationGuide.customerPage = true;

export async function getServerSideProps({ params, res }) {
  const destination = destinations.find(item => item.slug === params.slug);
  if (!destination) return { notFound: true };
  noStore(res);
  const results = await Promise.all(types.map(async type => ({
    ...type, ...await catalogueRead(type.route, { destination: destination.slug, view: 'finder', limit: 3 }),
  })));
  return { props: { destination, results } };
}
