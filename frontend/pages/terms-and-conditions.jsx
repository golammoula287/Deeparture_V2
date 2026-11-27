import Link from 'next/link';
import LegalPage from '@/src/components/customer/LegalPage';

export default function TermsAndConditions() {
  return <LegalPage title="Terms and Conditions" description="How Deeparture trip enquiries, listing prices and booking confirmations work.">
    <p>Deeparture helps you explore liveaboard trips and dive resorts and send an enquiry about a trip or stay.</p>
    <h2>Enquiries and booking confirmation</h2>
    <p>Use the listing’s enquiry form to tell us which departure or stay you are interested in. Sending an enquiry does not reserve a place or confirm a booking. Confirm availability, the total price, inclusions and any special arrangements before making travel plans.</p>
    <h2>Prices and offers</h2>
    <p>Prices shown on the site can be starting prices. The total can depend on the dates, cabin or room type, and the services included. Ask for the full price and confirm whether an advertised offer still applies.</p>
    <h2>Changes and cancellations</h2>
    <p>Before paying, ask for the payment schedule and the change, cancellation and refund terms that apply to your booking. Check who to contact if your plans change.</p>
    <h2>Diving and travel requirements</h2>
    <p>Confirm certification and experience requirements, insurance and equipment with the trip operator. If you have dietary or accessibility requirements, ask which arrangements can be accommodated before you book.</p>
    <h2>Questions</h2>
    <p><Link href="/contact">Contact Deeparture</Link> about an enquiry or read the <Link href="/privacy-policy">Privacy Policy</Link> for information about enquiry details.</p>
  </LegalPage>;
}
TermsAndConditions.customerPage = true;
