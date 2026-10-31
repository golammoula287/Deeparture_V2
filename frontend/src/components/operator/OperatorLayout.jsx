import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { v2Api } from "@/src/lib/v2Api";

const links = [
  ["/operator/v2", "Dashboard"],
  ["/operator/v2/liveaboards", "Liveaboards"],
  ["/operator/v2/resorts", "Resorts"],
  ["/operator/v2/availability", "Availability"],
  ["/operator/v2/enquiries", "Enquiries"],
  ["/operator/v2/imports", "Bulk Upload"],
  ["/operator/v2/notifications", "Notifications"],
  ["/operator/v2/team", "Team"],
  ["/operator/v2/profile", "Profile"],
];

export default function OperatorLayout({ title, children }) {
  const router = useRouter();
  const [organisations, setOrganisations] = useState([]);
  const [organisationId, setOrganisationId] = useState("");
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    v2Api("/operator/organisations").then(items => {
      const values = items || [];
      setOrganisations(values);
      const saved = typeof window !== "undefined" ? localStorage.getItem("deeparture-operator-org") : "";
      const next = values.find(item => item._id === saved)?._id || values[0]?._id || "";
      setOrganisationId(next);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!organisationId) return;
    localStorage.setItem("deeparture-operator-org", organisationId);
    v2Api(`/operator/organisations/${organisationId}/notifications?unread=true&limit=1`)
      .then(data => setUnread(data?.unread || 0)).catch(() => {});
  }, [organisationId, router.pathname]);

  const selected = useMemo(() => organisations.find(item => item._id === organisationId), [organisations, organisationId]);
  const context = { organisations, organisationId, setOrganisationId, selected, refreshUnread: () => organisationId && v2Api(`/operator/organisations/${organisationId}/notifications?unread=true&limit=1`).then(data => setUnread(data?.unread || 0)).catch(() => {}) };

  return (
    <main className="max-w-7xl mx-auto px-4 py-5 md:py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-60 rounded-2xl border bg-white p-3 lg:sticky lg:top-4">
          <div className="px-2 py-2">
            <div className="font-semibold flex items-center justify-between"><span>Operator Portal</span>{unread > 0 ? <Link href="/operator/v2/notifications" className="text-xs rounded-full bg-red-600 text-white px-2 py-1">{unread}</Link> : null}</div>
            <select className="mt-3 border rounded-lg p-2 w-full text-sm" value={organisationId} onChange={e => setOrganisationId(e.target.value)}>{organisations.map(org => <option key={org._id} value={org._id}>{org.name}</option>)}</select>
            {selected?.membershipRole ? <div className="text-xs text-gray-500 mt-1">Role: {selected.membershipRole}</div> : null}
          </div>
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1 mt-2">
            {links.map(([href,label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm ${router.pathname === href || (href !== "/operator/v2" && router.pathname.startsWith(href)) ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>{label}</Link>)}
          </nav>
        </aside>
        <section className="min-w-0 flex-1 w-full">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl md:text-3xl font-bold">{title}</h1>{selected ? <p className="text-gray-500 mt-1">{selected.name}</p> : null}</div></div>
          {error ? <div className="mt-4 rounded-lg bg-red-50 text-red-800 p-3">{error}</div> : null}
          <div className="mt-5">{typeof children === "function" ? children(context) : children}</div>
        </section>
      </div>
    </main>
  );
}
