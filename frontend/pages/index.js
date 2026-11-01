import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Travel inventory & operator portal</p>
      <h1 className="text-4xl md:text-6xl font-bold mt-3">Deeparture V2</h1>
      <p className="text-lg text-gray-600 mt-5 max-w-3xl">Explore liveaboards and dive resorts. Operators can manage their listings, availability, prices, team and enquiries in the Operator Portal.</p>
      <div className="flex flex-wrap gap-3 mt-8">
        <Link className="rounded-lg bg-green-700 text-white px-5 py-3 font-semibold" href="/explore/liveaboards">Explore liveaboards</Link>
        <Link className="rounded-lg border px-5 py-3 font-semibold" href="/explore/resorts">Explore resorts</Link>
      </div>
      <div className="mt-12 rounded-xl border bg-gray-50 p-6">
        <h2 className="text-xl font-semibold">Manage your organisation</h2>
        <p className="mt-2 text-gray-600">Sign in to update inventory, manage your team and respond to enquiries.</p>
        <Link className="inline-block mt-4 text-green-700 font-semibold underline" href="/login">Operator / Admin login</Link>
      </div>
    </main>
  );
}
