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
              <p>Open the liveaboard or resort you’re interested in and use its enquiry form. Include the specific departure or stay you’re interested in, along with any questions you’d like to ask.</p>
            </details>
            <details>
              <summary>Can you help with dietary or accessibility requirements?<HomeIcon name="chevron" size={18} /></summary>
              <p>Yes. Please include any dietary or accessibility requirements in your enquiry so we can confirm what can be accommodated before you make your travel arrangements.</p>
            </details>
            <details>
              <summary>Does sending an enquiry confirm a booking?<HomeIcon name="chevron" size={18} /></summary>
              <p>No. An enquiry does not confirm a booking. Availability, pricing and any specific requirements must be confirmed before your booking is finalised.</p>
            </details>
            <details>
              <summary>Are you a liveaboard or resort operator?<HomeIcon name="chevron" size={18} /></summary>
              <p>Yes. Operators can use the <Link href="/login">Operator login</Link> to sign in or sign up. If you need help accessing your account, please contact us.</p>
            </details>
            <details>
              <summary>Can you help me choose the right trip?<HomeIcon name="chevron" size={18} /></summary>
              <p>Yes. If you’re unsure which liveaboard, resort or destination suits you, tell us what you’re looking for and we’ll help you explore the options.</p>
            </details>
            <details>
              <summary>Do you only arrange scuba diving trips?<HomeIcon name="chevron" size={18} /></summary>
              <p>No. We can also help with resorts, snorkelling, freediving and other dive-related travel experiences where available.</p>
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
