import Link from 'next/link';
import CustomerShell from '@/src/components/customer/CustomerShell';
import { values } from '@/src/lib/customer/destinations';
import styles from '@/src/components/customer/Marketplace.module.css';

export default function WhyDeeparture() {
  return <CustomerShell title="Why Deeparture" description="Explore how Deeparture helps you find dive travel that suits your dietary, accessibility and diving needs.">
    <main>
      <section className={styles.finderHero} aria-labelledby="why-title">
        <div className={styles.finderHeroInner}><h1 id="why-title">Why Deeparture</h1></div>
      </section>
      <div className={styles.finder}>
        <div className={styles.valuesGrid}>
          {values.map(([icon, title, text]) => <article className={styles.valueCard} key={icon}>
            <img src={`/brand/pictographs/${icon}.svg`} alt="" width="44" height="44" />
            <div><h2>{title}</h2><p>{text}</p></div>
          </article>)}
        </div>
        <Link href="/about-us" className={styles.textLink}>About us</Link>
      </div>
    </main>
  </CustomerShell>;
}
WhyDeeparture.customerPage = true;
