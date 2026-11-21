import Link from 'next/link';
import Image from 'next/image';
import CustomerShell from '@/src/components/customer/CustomerShell';
import { destinations } from '@/src/lib/customer/destinations';
import styles from '@/src/components/customer/Marketplace.module.css';

export default function Destinations() {
  return <CustomerShell title="Destinations">
    <main>
      <section className={styles.finderHero} aria-labelledby="destinations-title">
        <div className={styles.finderHeroInner}><h1 id="destinations-title">Destinations</h1><p>Explore leading dive destinations around the world.</p></div>
      </section>
      <div className={`${styles.finder} ${styles.discoveryCards}`}>
        {destinations.map(destination => <Link key={destination.slug} href={`/destinations/${destination.slug}`} className={styles.card}>
          <div className={styles.cardImage}><Image src={destination.image} alt="" fill sizes="(max-width: 620px) 90vw, (max-width: 930px) 45vw, 30vw" /></div>
          <div className={styles.cardContent}><h2>{destination.name}</h2><p className={styles.location}>{destination.region}</p></div>
        </Link>)}
      </div>
    </main>
  </CustomerShell>;
}
Destinations.customerPage = true;
