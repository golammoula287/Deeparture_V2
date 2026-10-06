import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import { v2Api } from "@/src/lib/v2Api";
const cards = [["liveaboards","Liveaboards"],["resorts","Resorts"],["drafts","Draft listings"],["pending","Pending review"],["unclaimed","Unclaimed operators"],["invited","Invited operators"],["claimed","Claimed / verified operators"],["enquiries","New enquiries"]];
const links = {liveaboards:"liveaboards",resorts:"resorts",drafts:"liveaboards?status=draft",pending:"liveaboards?status=pending_review",unclaimed:"operators",invited:"operators",claimed:"operators",enquiries:"enquiries?status=new"};
export default function AdminDashboard(){
  const [data,setData]=useState(null); const [error,setError]=useState("");
  useEffect(()=>{v2Api("/admin/dashboard").then(setData).catch(e=>setError(e.message));},[]);
  return <AdminLayout title="Admin Dashboard">{error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>:null}
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{cards.map(([k,l])=><Link href={`/admin/v2/${links[k]}`} key={k} className="rounded-xl border bg-white p-4"><div className="text-sm text-gray-500">{l}</div><div className="text-3xl font-bold mt-1">{data?.counts?.[k] ?? "-"}</div></Link>)}</div>
    <section className="mt-6 rounded-xl border bg-white p-4"><h2 className="font-semibold text-lg">Recent activity</h2><div className="mt-3 divide-y">{(data?.recent||[]).map(x=><div key={x._id} className="py-3 text-sm"><strong>{x.action}</strong><span className="text-gray-500"> · {x.entityType || "record"} · {new Date(x.createdAt).toLocaleString()}</span></div>)}{data && !data.recent?.length?<p className="text-gray-500 py-3">No recent activity.</p>:null}</div></section>
  </AdminLayout>;
}
