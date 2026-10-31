import { useEffect, useState } from "react";
import Link from "next/link";
import OperatorLayout from "@/src/components/operator/OperatorLayout";
import { Card, Badge } from "@/src/components/operator/Ui";
import { v2Api } from "@/src/lib/v2Api";

function Dashboard({ organisationId }) {
  const [data,setData]=useState(null); const [error,setError]=useState("");
  useEffect(()=>{ if (!organisationId) return; v2Api(`/operator/organisations/${organisationId}/dashboard`).then(setData).catch(e=>setError(e.message)); },[organisationId]);
  const c=data?.counts || {};
  return <div className="space-y-6">
    {error ? <div className="rounded-lg bg-red-50 text-red-800 p-3">{error}</div> : null}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[['Liveaboards',c.vessels],['Resorts',c.resorts],['Enquiries',c.pendingEnquiries],['Unread',c.unreadNotifications]].map(([k,v])=><Card key={k}><div className="text-gray-500 text-sm">{k}</div><div className="text-3xl font-bold mt-1">{v ?? '–'}</div></Card>)}
    </div>
    <div className="grid md:grid-cols-3 gap-3">
      <Card><div className="text-sm text-gray-500">Stale availability</div><div className="text-2xl font-bold">{c.staleAvailability ?? '–'}</div></Card>
      <Card><div className="text-sm text-gray-500">Availability conflicts</div><div className="text-2xl font-bold">{c.availabilityConflicts ?? '–'}</div></Card>
      <Card><div className="text-sm text-gray-500">Active offers</div><div className="text-2xl font-bold">{c.activeOffers ?? '–'}</div></Card>
    </div>
    <div className="grid lg:grid-cols-2 gap-5">
      <Card><div className="flex justify-between"><h2 className="font-semibold text-lg">Needs attention</h2><Link href="/operator/v2/liveaboards" className="text-sm underline">Catalogue</Link></div><div className="mt-3 space-y-3">{data?.incomplete?.map(x=><div key={`${x.productType}-${x.id}`} className="border rounded-lg p-3"><div className="flex justify-between"><strong>{x.name}</strong><Badge>{x.score}%</Badge></div><div className="text-xs text-gray-500 mt-1">Missing: {(x.missing||[]).join(', ') || '—'}</div></div>)}{!data?.incomplete?.length ? <p className="text-gray-500">No low-completeness listings.</p>:null}</div></Card>
      <Card><h2 className="font-semibold text-lg">Upcoming departures</h2><div className="mt-3 space-y-2">{data?.upcomingDepartures?.map(d=><div key={d._id} className="border rounded-lg p-3"><strong>{d.vessel?.name || 'Vessel'}</strong><div className="text-sm">{d.itinerary?.name || 'Itinerary'} · {new Date(d.startDate).toLocaleDateString()}</div></div>)}{!data?.upcomingDepartures?.length?<p className="text-gray-500">No departures in the next 90 days.</p>:null}</div></Card>
    </div>
    <Card><h2 className="font-semibold text-lg">Recent enquiries</h2><div className="mt-3 grid md:grid-cols-2 gap-3">{data?.enquiries?.map(e=><div key={e._id} className="border rounded-lg p-3"><div className="flex justify-between"><strong>{e.customer?.name || 'Customer'}</strong><Badge>{e.status}</Badge></div><div className="text-sm text-gray-600 mt-1">{e.customer?.email}</div></div>)}{!data?.enquiries?.length?<p className="text-gray-500">No active enquiries.</p>:null}</div></Card>
  </div>;
}
export default function Page(){ return <OperatorLayout title="Dashboard">{ctx=><Dashboard organisationId={ctx.organisationId}/>}</OperatorLayout>; }
