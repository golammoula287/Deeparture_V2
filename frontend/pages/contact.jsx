import Link from 'next/link';
import CustomerShell from '@/src/components/customer/CustomerShell';
import styles from '@/src/components/customer/CustomerShell.module.css';

// Contact channels supplied in the owner's Deeparture footer reference screenshot
// (Screenshot 2026-11-05 at 21.10.42.png); no general-contact submission API is assumed.
export default function Contact() {
  return <CustomerShell title="Contact" description="Get in touch with Deeparture or start an enquiry about a liveaboard journey or dive resort.">
    <main className={styles.page}>
      <p className={styles.eyebrow}>Contact Deeparture</p><h1 className={styles.title}>Every great journey<br />starts with a question.</h1><p className={styles.lead}>Need a little guidance, or want to talk through what matters for your next dive trip? Get in touch.</p>
      <div className={styles.contactGrid}>
        <section className={styles.contactCard}><h2>Let’s talk.</h2><p>For general questions, contact the Deeparture team directly.</p><a className={styles.contactChannel} href="mailto:info@deeparture.travel"><span>Email</span><strong>info@deeparture.travel</strong></a><a className={styles.contactChannel} href="tel:+642102413170"><span>Phone</span><strong>+64 21 024 13170</strong></a><p className={styles.notice}>For dates, prices or availability, send an enquiry from the relevant liveaboard or resort page so your trip details stay together.</p><Link className={styles.action} href="/explore/liveaboards">Find a trip to enquire about</Link></section>
        <section className={styles.questionList}><h2>A few helpful answers.</h2>
          <details><summary>How do I ask about a specific trip?</summary><p>Open the liveaboard or resort you are interested in and use its enquiry form. Include the departure or package that interests you and any questions you would like to discuss.</p></details>
          <details><summary>Can I ask about dietary or accessibility needs?</summary><p>Yes. Review the information on the product page and include your particular requirements in your enquiry. Missing information does not mean support has been confirmed, so ask before making travel arrangements.</p></details>
          <details><summary>Does sending an enquiry confirm a booking?</summary><p>No. An enquiry is a request for information. Availability, prices and any particular requirements still need to be confirmed before a booking is agreed.</p></details>
          <details><summary>Are you a liveaboard or resort operator?</summary><p>Use the <Link href="/login">operator sign-in</Link> to access your account, or email the team if you need help with access.</p></details>
        </section>
      </div>
    </main>
  </CustomerShell>;
}
Contact.customerPage = true;
