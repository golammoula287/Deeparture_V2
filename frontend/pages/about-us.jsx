import Link from 'next/link';
import CustomerShell from '@/src/components/customer/CustomerShell';
import styles from '@/src/components/customer/CustomerShell.module.css';

export default function AboutUs() {
  return <CustomerShell title="About us" description="Get to know Deeparture: liveaboard journeys, dive resorts and thoughtful ways to explore the ocean.">
    <main className={styles.page}>
      <section className={styles.introduction}>
        <div><p className={styles.eyebrow}>About Deeparture</p><h1 className={styles.title}>For the ocean in you.</h1><p className={styles.lead}>A dive trip is personal. The place, the people, the pace — and the details that help you feel at home.</p><p className={styles.lead}>Deeparture brings liveaboard journeys and dive resorts into one place, so you can explore your options and ask the questions that matter before you travel.</p><Link className={styles.action} href="/explore/liveaboards">Find your next trip</Link></div>
        <img className={styles.editorialImage} src="/phase4/hero-elegant-reef-v2.jpg" alt="Underwater reef scene with sunlight and a distant diver" width="836" height="941" />
      </section>
      <section className={styles.statement}><h2>Different journeys.<br />Thoughtfully explored.</h2><p>Whether you want life at sea or a place to return to after each dive, start with the experience that suits you. Explore product details, compare your options and send an enquiry about a specific trip or resort. An enquiry starts a conversation; it does not reserve a space or confirm a booking.</p></section>
      <section className={styles.principles} aria-label="Our approach">
        <article><h3>Make room for your needs.</h3><p>Dietary preferences, accessibility and diving features belong in the conversation. Look for the details provided by each property and ask when something important is not yet confirmed.</p></article>
        <article><h3>Know what you are exploring.</h3><p>Dates, durations, cabins, rooms and packages help you understand a journey. Review the available information and confirm the details that matter to you before making travel plans.</p></article>
        <article><h3>Go at your own pace.</h3><p>Browse without creating an account. Take time to compare liveaboards and resorts, then start an enquiry when you find an experience you want to know more about.</p></article>
      </section>
    </main>
  </CustomerShell>;
}
AboutUs.customerPage = true;
