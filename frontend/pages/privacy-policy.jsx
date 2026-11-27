import LegalPage from '@/src/components/customer/LegalPage';
import { contactLinks } from '@/src/lib/customer/contactLinks';

export default function PrivacyPolicy() {
  return <LegalPage title="Privacy Policy" description="Information about the details Deeparture receives when you submit a message or trip enquiry.">
    <h2>Information you send us</h2>
    <p>When you use a contact or enquiry form, Deeparture receives the contact details you provide and your message. A trip enquiry can also include the listing, departure, stay or offer you ask about, along with any preferences you choose to share.</p>
    <h2>How enquiry information is used</h2>
    <p>Enquiries are recorded so the team can respond, follow up and refer to the trip details you supplied. Please keep your message focused on your enquiry and avoid sending payment card details, passwords or copies of identity documents through the form.</p>
    <h2>External services</h2>
    <p>Links to WhatsApp and social media take you to services with their own privacy policies. Review the applicable policy before sending personal information through those services.</p>
    <h2>Privacy questions and requests</h2>
    <p>Email <a href={contactLinks.email.href}>{contactLinks.email.label}</a> if you have a privacy question or want to ask about access to, correction of or deletion of information you have provided.</p>
  </LegalPage>;
}
PrivacyPolicy.customerPage = true;
