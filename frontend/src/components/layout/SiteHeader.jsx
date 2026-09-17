import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
        <Link href="/" className="text-xl font-bold">Deeparture V2</Link>
        <nav className="flex flex-wrap gap-4 text-sm ml-auto">
          <Link href="/explore/liveaboards">Liveaboards</Link>
          <Link href="/explore/resorts">Resorts</Link>
          <Link href="/dashboard/v2">Operator</Link>
          <Link href="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
