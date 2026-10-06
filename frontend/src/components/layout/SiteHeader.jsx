import Link from 'next/link';
import { useAuth } from '@/src/components/auth/AuthProvider';

export default function SiteHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
        <Link href="/" className="text-xl font-bold">Deeparture V2</Link>
        <nav className="flex flex-wrap gap-4 text-sm ml-auto">
          <Link href="/explore/liveaboards">Liveaboards</Link>
          <Link href="/explore/resorts">Resorts</Link>
          <Link href={user ? '/dashboard/v2' : '/login'}>Operator</Link>
          {user?.role === "admin" ? <Link href="/admin/v2">Admin</Link> : null}
          {user ? <button type="button" onClick={logout}>Logout</button> : <Link href="/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
