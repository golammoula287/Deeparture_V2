import Link from 'next/link';
import { useRouter } from 'next/router';
import { contactLinks } from '@/src/lib/customer/contactLinks';
import ContactForm from '@/src/components/customer/ContactForm';
import CustomerShell from '@/src/components/customer/CustomerShell';
import HomeIcon from '@/src/components/customer/HomeIcon';
import styles from '@/src/components/customer/ContactPage.module.css';

const channels = [
  ['Email', contactLinks.email],
  ['WhatsApp', contactLinks.whatsapp],
  ['Phone', contactLinks.phone],
];

export default function Contact() {
  const { query } = useRouter();
  return <CustomerShell title="Contact Deeparture" description="Get in touch with Deeparture or start an enquiry about a liveaboard journey or dive resort.">
    <main>
      <section className={styles.hero} aria-labelledby="contact-title">
        <div className={styles.heroInner}>
          <h1 id="contact-title">Contact Deeparture</h1>
          <p>Every great journey begins with a question.</p>
        </div>
      </section>
      <div className={styles.content}>
        <div className={styles.layout}>
          <section className={styles.formCard} aria-labelledby="contact-form-title">
            <h2 id="contact-form-title">Send us a message.</h2>
            <p>Tell us what you’re planning, exploring or curious about.</p>
            <ContactForm initialInterest={query.subject === 'special-offers' ? 'Special Offer' : ''} />
          </section>
          <section className={styles.faq} aria-labelledby="questions-title">
            <h2 id="questions-title">Frequently asked questions</h2>
            <details>
              <summary>How do I ask about a specific trip?<HomeIcon name="chevron" size={18} /></summary>
              <p>Open the liveaboard or resort you are interested in and use its enquiry form. Include the departure or package that interests you and any questions you would like to discuss.</p>
            </details>
            <details>
              <summary>Can I ask about dietary or accessibility needs?<HomeIcon name="chevron" size={18} /></summary>
              <p>Yes. Review the information on the product page and include your particular requirements in your enquiry. Missing information does not mean support has been confirmed, so ask before making travel arrangements.</p>
            </details>
            <details>
              <summary>Does sending an enquiry confirm a booking?<HomeIcon name="chevron" size={18} /></summary>
              <p>No. An enquiry is a request for information. Availability, prices and any particular requirements still need to be confirmed before a booking is agreed.</p>
            </details>
            <details>
              <summary>Are you a liveaboard or resort operator?<HomeIcon name="chevron" size={18} /></summary>
              <p>Use the <Link href="/login">operator sign-in</Link> to access your account, or email the team if you need help with access.</p>
            </details>
          </section>
        </div>
        <address className={styles.contacts} aria-label="Direct contact">
          {channels.map(([label, channel]) => <a href={channel.href} key={label}>
            <span>{label}</span><strong>{channel.label}</strong>
          </a>)}
        </address>
      </div>
    </main>
  </CustomerShell>;
}
Contact.customerPage = true;
