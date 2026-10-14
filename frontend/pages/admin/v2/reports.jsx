import {useEffect,useState} from 'react';
import AdminLayout from '@/src/components/admin/AdminLayout';
import {v2Api} from '@/src/lib/v2Api';

export default function Reports(){
 const [data,setData]=useState(null),[message,setMessage]=useState('');
 const load=()=>v2Api('/admin/reports/operational').then(setData).catch(e=>setMessage(e.message));
 useEffect(()=>{load()},[]);
 const cards=data?[
  ['Catalogue',data.catalogue?.total,`${data.catalogue?.published||0} published · ${data.catalogue?.createdLast30Days||0} created in 30d`],
  ['Claimed operators',data.organisations?.claimed,`${data.organisations?.unclaimed||0} unclaimed/invited`],
  ['Import error rate',`${data.imports?.errorRate||0}%`,`${data.imports?.withErrors||0} batches with errors`],
  ['Stale availability',data.availability?.stale,`${data.availability?.conflicts||0} conflicts · ${data.availability?.manualOverrides||0} overrides`],
  ['Incomplete listings',(data.incomplete?.vessels||0)+(data.incomplete?.resorts||0),`${data.incomplete?.vessels||0} vessels / ${data.incomplete?.resorts||0} resorts`],
  ['Source attention',data.availability?.sourcesRequiringAttention,`${data.catalogue?.staleChecks||0} listings not checked in 90d`],
  ['Verification attention',data.verification?.unverifiedOrOperatorVerified,`${data.verification?.vessels||0} vessels / ${data.verification?.resorts||0} resorts`],
 ]:[];
 return <AdminLayout title="Operational Reporting">{message&&<p>{message}</p>}<div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">{cards.map(([label,value,sub])=><div key={label} className="rounded-xl border bg-white p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-3xl font-bold mt-1">{value??'—'}</div><div className="text-xs text-gray-500 mt-2">{sub}</div></div>)}</div><section className="mt-5 rounded-xl border bg-white p-4"><div className="flex justify-between gap-2"><h2 className="font-semibold">Enquiries by state</h2><button className="border rounded px-3 py-1" onClick={load}>Refresh</button></div><div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">{Object.entries(data?.enquiries||{}).map(([k,v])=><div key={k} className="border rounded p-3"><b>{v}</b><div className="text-xs text-gray-500">{k}</div></div>)}</div></section></AdminLayout>;
}
