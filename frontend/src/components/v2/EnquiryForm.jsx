import { useRef, useState } from 'react';
import { v2BaseUrl } from '@/src/config/serverConfig';
import styles from './EnquiryForm.module.css';

export default function EnquiryForm({ productType, productId, itineraryId, departureId, packageId, offerId }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', guests: 2, message: '' });
  const [state, setState] = useState({ status: 'idle', message: '' });
  const submitting = useRef(false);
  const context = JSON.stringify([productType, productId, itineraryId, departureId, packageId, offerId]);
  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setState({ status: 'pending', message: '' });
    try {
      const response = await fetch(`${v2BaseUrl}/enquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productType, product: productId, itinerary: itineraryId, departure: departureId, package: packageId, offer: offerId, customer: form, message: form.message }), signal: AbortSignal.timeout(20000) });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error(json?.message || 'We couldn’t receive your enquiry. Please check your connection and try again.');
      setState({ status: 'success', message: 'Our team will review your enquiry and contact you about the next steps. Space and pricing are not confirmed.', context });
    } catch (error) {
      setState({ status: 'error', message: error.name === 'TimeoutError' ? 'The request timed out. Please contact us before retrying if you are unsure whether your enquiry was received.' : error.message });
    } finally { submitting.current = false; }
  };
  if (state.status === 'success') return <section className={styles.success} role="status"><h3>Enquiry received</h3><p>{state.message}</p>{state.context !== context && <p>This confirmation is for your previous selection. Send a new enquiry for the changed trip details.</p>}<button type="button" onClick={() => { setState({ status: 'idle', message: '' }); setForm({ name: '', email: '', phone: '', guests: 2, message: '' }); }}>Start another enquiry</button></section>;
  return <form onSubmit={submit} className={styles.form}>
    <h3>Your enquiry</h3>
    <div className={styles.grid}>
      <label>Name<input required autoComplete="name" maxLength={150} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label>Email<input required type="email" autoComplete="email" maxLength={254} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label>Phone <span>(optional)</span><input type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
      <label>Guests<input required type="number" min="1" max="100" inputMode="numeric" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
    </div>
    <label>What do you have in mind?<textarea required rows={4} maxLength={5000} placeholder="Preferred dates, diving plans or any requirements…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></label>
    <p className={styles.note}>We’ll use these details to respond to your enquiry. Please avoid including sensitive personal information.</p>
    <button disabled={state.status === 'pending'}>{state.status === 'pending' ? 'Sending…' : 'Send enquiry'}</button>
    {state.status === 'pending' && <p role="status">Sending your enquiry…</p>}
    {state.status === 'error' && <p role="alert" className={styles.error}>{state.message}</p>}
  </form>;
}
