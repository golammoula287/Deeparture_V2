import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Standalone development build</p>
      <h1 className="text-4xl md:text-6xl font-bold mt-3">Deeparture V2</h1>
      <p className="text-lg text-gray-600 mt-5 max-w-3xl">A standalone Phase 1 repository for the V2 data model, catalogue-first listings, operator claiming, bulk inventory updates and public liveaboard/resort pages.</p>
      <div className="flex flex-wrap gap-3 mt-8">
        <Link className="rounded-lg bg-green-700 text-white px-5 py-3 font-semibold" href="/explore/liveaboards">Explore liveaboards</Link>
        <Link className="rounded-lg border px-5 py-3 font-semibold" href="/explore/resorts">Explore resorts</Link>
      </div>
      <div className="mt-12 rounded-xl border bg-gray-50 p-6">
        <h2 className="text-xl font-semibold">Local setup</h2>
        <p className="mt-2 text-gray-600">Run the demo seed from the backend to create sample records. See the repository README for the exact commands.</p>
      </div>
    </main>
  );
}
