import { useRef, useState } from 'react';
import { v2BaseUrl } from '@/src/config/serverConfig';
import HomeIcon from './HomeIcon';
import styles from './ContactPage.module.css';

const interests = ['Liveaboard', 'Resort', 'Special Offer', 'Other'];

export default function ContactForm({ initialInterest = '' }) {
  const [interest, setInterest] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const field = key => String(fields.get(key) || '').trim();
    const name = field('name');
    const enquiryType = field('interest');
    const message = field('message');
    if (!name || !interests.includes(enquiryType) || !message) {
      setError('Enter your name, what you’re interested in, and a message.');
      return;
    }
    submitting.current = true;
    setError('');
    setStatus('pending');
    try {
      const response = await fetch(`${v2BaseUrl}/enquiries/general`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, email: field('email'), phone: field('phone') },
          interest: enquiryType,
          destination: field('destination'),
          message,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.message || 'We couldn’t receive your enquiry. Please try again.');
      form.reset();
      setInterest(null);
      setStatus('received');
    } catch (error) {
      setStatus('idle');
      setError(error.name === 'TimeoutError'
        ? 'We couldn’t confirm receipt. Please contact us if you’re unsure whether your enquiry was received.'
        : error.message);
    } finally {
      submitting.current = false;
    }
  }

  return <form className={styles.form} onSubmit={submit} onChange={() => { setError(''); if (status === 'received') setStatus('idle'); }}>
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
    <button type="submit" className={styles.submit} disabled={status === 'pending'}>{status === 'pending' ? 'Sending…' : 'Send enquiry'}<HomeIcon name="arrow" size={18} /></button>
    {error && <p className={styles.formError} role="alert">{error}</p>}
    {status === 'received' && <p className={styles.draftStatus} role="status">Enquiry received. The Deeparture team will review your message and get back to you.</p>}
  </form>;
}
