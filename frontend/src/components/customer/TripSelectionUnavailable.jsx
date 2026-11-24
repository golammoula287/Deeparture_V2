import Link from 'next/link';
import CustomerShell from './CustomerShell';

export default function TripSelectionUnavailable() {
  return <CustomerShell noIndex title="Trip option unavailable">
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-4 text-3xl">This trip option is temporarily unavailable</h1>
      <p className="mb-6">Try again in a moment or explore other departures, stays and offers.</p>
      <Link className="underline" href="/#find-your-trip">Find another trip</Link>
    </main>
  </CustomerShell>;
}
TripSelectionUnavailable.customerPage = true;
