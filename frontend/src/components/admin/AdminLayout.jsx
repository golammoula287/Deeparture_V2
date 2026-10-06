import Link from "next/link";
import { useRouter } from "next/router";

const links = [
  ["/admin/v2", "Dashboard"],
  ["/admin/v2/liveaboards", "Liveaboards"],
  ["/admin/v2/resorts", "Resorts"],
  ["/admin/v2/import", "Import"],
  ["/admin/v2/operators", "Operators"],
  ["/admin/v2/attributes", "Attributes"],
  ["/admin/v2/locations", "Locations"],
  ["/admin/v2/enquiries", "Enquiries"],
];

export default function AdminLayout({ title, children }) {
  const router = useRouter();
  return (
    <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-56 rounded-xl border bg-white p-3 lg:sticky lg:top-4">
          <div className="font-semibold px-2 py-2">Admin V2</div>
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
