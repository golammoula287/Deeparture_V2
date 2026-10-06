import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from './AdminLayout';
import StatusBadge from './StatusBadge';
import { v2Api } from '@/src/lib/v2Api';
export default function CatalogueList({ kind, title }) {
 const router = useRouter();
 const [data,setData] = useState({items:[],total:0,page:1,limit:20});
 const [filters,setFilters] = useState({q:'',status:'',organisation:'',destination:'',claimStatus:''});
 const [orgs,setOrgs] = useState([]), [error,setError] = useState('');
 const api = `/admin/catalog/${kind}`;
 const load = async (page=1, query=filters) => { try { setData(await v2Api(`${api}?${new URLSearchParams({...query,page,limit:20})}`)); setError(''); } catch(e) {setError(e.message);} };
 useEffect(()=>{v2Api('/admin/organisations').then(setOrgs).catch(e=>setError(e.message));},[]);
 useEffect(()=>{if(router.isReady){const query={...filters,status:router.query.status||'',organisation:router.query.organisation||''};setFilters(query);load(1,query);}},[router.isReady,router.query.status,router.query.organisation]);
 const moderate = async(id,listingStatus)=>{try{await v2Api(`${api}/${id}/status`,{method:'PATCH',body:JSON.stringify({listingStatus})});await load(data.page);}catch(e){setError(e.message)}};
 return <AdminLayout title={title}>
 <form onSubmit={e=>{e.preventDefault();load();}} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
 <input aria-label="Search listings" className="border rounded-lg p-2 min-w-0" placeholder="Search listings" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
 <select aria-label="Status" className="border rounded-lg p-2 min-w-0" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">All statuses</option>{['draft','pending_review','published','restricted','archived'].map(s=><option key={s}>{s}</option>)}</select>
 <select aria-label="Operator" className="border rounded-lg p-2 min-w-0" value={filters.organisation} onChange={e=>setFilters({...filters,organisation:e.target.value})}><option value="">All operators</option>{orgs.map(o=><option key={o._id} value={o._id}>{o.name}</option>)}</select>
 <input aria-label="Destination" className="border rounded-lg p-2 min-w-0" placeholder="Destination" value={filters.destination} onChange={e=>setFilters({...filters,destination:e.target.value})}/>
 <select aria-label="Claim status" className="border rounded-lg p-2 min-w-0" value={filters.claimStatus} onChange={e=>setFilters({...filters,claimStatus:e.target.value})}><option value="">All claim states</option>{['unclaimed','invited','claimed','verified'].map(s=><option key={s}>{s}</option>)}</select>
 <button className="rounded-lg bg-gray-900 text-white px-4 py-2">Filter</button><Link href={`/admin/v2/${kind}/new`} className="border rounded-lg px-4 py-2 text-center">Add new</Link>
 </form>{error&&<p role="alert" className="mb-3 text-red-700">{error}</p>}
 <div className="space-y-3">{data.items.map(item=><article key={item._id} className="rounded-xl border bg-white p-4 min-w-0 break-words"><Link className="font-semibold text-lg" href={`/admin/v2/${kind}/${item._id}`}>{item.name}</Link><p className="text-gray-500 mb-2">{item.organisation?.name} / {item.organisation?.status} / {item.verificationStatus}</p><StatusBadge value={item.listingStatus}/><div className="flex flex-wrap gap-2 mt-3">{[[item.listingStatus==='published'?'draft':'published',item.listingStatus==='published'?'Unpublish':'Publish'],['pending_review','Request review'],['restricted','Restrict'],['archived','Archive']].map(([status,label])=><button key={status} onClick={()=>moderate(item._id,status)} className="border rounded-lg px-3 py-2">{label}</button>)}</div></article>)}</div>
 <div className="flex flex-wrap items-center gap-4 mt-4"><button disabled={data.page<=1} onClick={()=>load(data.page-1)} className="border rounded-lg p-2 disabled:opacity-40">Previous</button><span>{data.total} listings ? Page {data.page}</span><button disabled={data.page*data.limit>=data.total} onClick={()=>load(data.page+1)} className="border rounded-lg p-2 disabled:opacity-40">Next</button></div>
 </AdminLayout>;
}
