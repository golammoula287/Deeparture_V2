import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { v2Api } from "@/src/lib/v2Api";

const links = [
  ["/admin/v2", "Dashboard"],
  ["/admin/v2/liveaboards", "Liveaboards"],
  ["/admin/v2/resorts", "Resorts"],
  ["/admin/v2/import", "Import"],
  ["/admin/v2/imports/history", "Import History"],
  ["/admin/v2/duplicates", "Duplicates"],
  ["/admin/v2/operators", "Operators"],
  ["/admin/v2/attributes", "Attributes"],
  ["/admin/v2/locations", "Locations"],
  ["/admin/v2/enquiries", "Enquiries"],
  ["/admin/v2/availability", "Availability"],
  ["/admin/v2/notifications", "Notifications"],
  ["/admin/v2/audit", "Audit"],
  ["/admin/v2/sources", "Sources"],
  ["/admin/v2/website-sources", "Website Queue"],
  ["/admin/v2/reports", "Reports"],
];

export default function AdminLayout({ title, children }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const refreshUnread = () => v2Api('/admin/notifications?unread=true&limit=1').then(data => setUnread(data?.unread || 0)).catch(() => {});
    refreshUnread();
    window.addEventListener('notifications-changed', refreshUnread);
    return () => window.removeEventListener('notifications-changed', refreshUnread);
  }, [router.pathname]);
  return (
    <main className="admin-v2 max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-60 rounded-xl border bg-white p-3 lg:sticky lg:top-4">
          <div className="font-semibold px-2 py-2 flex justify-between"><span>Admin V2</span>{unread > 0 ? <Link href="/admin/v2/notifications" className="text-xs rounded-full bg-red-600 text-white px-2 py-1" aria-label={`${unread} unread notifications`}>{unread}</Link> : null}</div>
          <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
            {links.map(([href,label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm ${router.pathname === href || (href !== "/admin/v2" && router.pathname.startsWith(href)) ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>{label}</Link>)}
          </nav>
        </aside>
        <section className="min-w-0 flex-1 w-full">
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          <div className="mt-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
