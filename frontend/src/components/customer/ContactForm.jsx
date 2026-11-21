import { useState } from 'react';
import { contactLinks } from '@/src/lib/customer/contactLinks';
import HomeIcon from './HomeIcon';
import styles from './ContactPage.module.css';

const interests = ['Liveaboard', 'Resort', 'Special Offer', 'Other'];

export default function ContactForm({ initialInterest = '' }) {
  const [interest, setInterest] = useState(null);
  const [error, setError] = useState('');
  const [draftUrl, setDraftUrl] = useState('');

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const field = key => String(fields.get(key) || '').trim();
    const name = field('name');
    const enquiryType = field('interest');
    const message = field('message');
    if (!name || !interests.includes(enquiryType) || !message) {
      setError('Enter your name, what you’re interested in, and a message.');
      return;
    }
    const lines = [
      `Name: ${name}`,
      `Email: ${field('email')}`,
      field('phone') && `WhatsApp / Phone: ${field('phone')}`,
      `Interested in: ${enquiryType}`,
      field('destination') && `Destination or trip name: ${field('destination')}`,
    ].filter(Boolean);
    const subject = encodeURIComponent(`Deeparture enquiry — ${enquiryType}`);
    const body = encodeURIComponent([`${lines.join('\r\n')}`, '', message].join('\r\n'));
    const url = `${contactLinks.email.href}?subject=${subject}&body=${body}`;
    setError('');
    setDraftUrl(url);
    window.location.href = url;
  }

  return <form className={styles.form} onSubmit={submit} onChange={() => { setError(''); setDraftUrl(''); }}>
    <div className={styles.formFields}>
      <label>Name<input name="name" autoComplete="name" maxLength={150} required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label><span>WhatsApp / Phone <small>(optional)</small></span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
      <label>What are you interested in?
        <select name="interest" required value={interest ?? initialInterest} onChange={event => setInterest(event.target.value)}>
          <option value="">Select an option</option>
          {interests.map(option => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className={styles.fullWidth}><span>Destination or trip name <small>(optional)</small></span><input name="destination" maxLength={200} /></label>
      <label className={styles.fullWidth}>Your message<textarea name="message" rows={5} maxLength={5000} required /></label>
    </div>
    <p className={styles.formNote}>Send enquiry opens an email draft for you to send.</p>
    <button type="submit" className={styles.submit}>Send enquiry<HomeIcon name="arrow" size={18} /></button>
    {error && <p className={styles.formError} role="alert">{error}</p>}
    {draftUrl && <p className={styles.draftStatus} role="status">Send the draft from your email app. <a href={draftUrl}>Open the email draft again</a></p>}
  </form>;
}
