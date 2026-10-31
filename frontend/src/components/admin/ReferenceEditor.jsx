import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { v2Api } from '@/src/lib/v2Api';

export default function ReferenceEditor({ title, endpoint, defaults, fields, renderActions, statusOptions, paged = false }) {
  const [items, setItems] = useState([]);
  const [pageData,setPageData] = useState({page:1,limit:25,total:0,hasNext:false});
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [search,setSearch]=useState(''),[status,setStatus]=useState('');
  const load = async (page=1) => {
    const url = paged ? `${endpoint}?${new URLSearchParams({paged:'true',page,limit:25,q:search,status})}` : endpoint;
    const data = await v2Api(url);
    if (paged) { setItems(data.items || []); setPageData(data); }
    else setItems(data);
  };
  useEffect(() => { load(1).catch(e => setMessage(e.message)); }, [endpoint]);
  useEffect(() => {
    if (!paged) return undefined;
    const timer = setTimeout(() => load(1).catch(e => setMessage(e.message)), 250);
    return () => clearTimeout(timer);
  }, [search,status,paged]);
  const edit = item => {
    const value = { ...defaults, ...item };
    for (const field of fields) {
      if (field.type === 'list') value[field.key] = (item[field.key] || []).join(', ');
      if (field.type === 'parent') value[field.key] = item[field.key]?._id || item[field.key] || '';
      if (field.key === 'applicableTo') value[field.key] = item.applicableTo?.includes('both') || item.applicableTo?.length > 1 ? 'both' : item.applicableTo?.[0] || 'both';
    }
    setEditing(item._id); setForm(value); setMessage(''); window.scrollTo({ top: 0 });
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const body = {};
      for (const field of fields) {
        let value = form[field.key];
        if (field.type === 'list') value = String(value || '').split(',').map(x => x.trim()).filter(Boolean);
        if (field.type === 'parent') value = value || null;
        if (field.key === 'applicableTo') value = [value];
        body[field.key] = value;
      }
      if (editing && form.updatedAt) body.expectedUpdatedAt = form.updatedAt;
      await v2Api(editing ? `${endpoint}/${editing}` : endpoint, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setEditing(null); setForm(defaults); await load(paged ? pageData.page : 1); setMessage('Saved');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const toggle = async item => {
    try { await v2Api(`${endpoint}/${item._id}`, { method: 'PATCH', body: JSON.stringify({ active: !item.active, expectedUpdatedAt: item.updatedAt }) }); await load(paged ? pageData.page : 1); }
    catch (error) { setMessage(error.message); }
  };
  const visibleItems = paged ? items : items.filter(item => (item.label || item.name || '').toLowerCase().includes(search.toLowerCase()) && (!status || item.status===status || item.accountStatus===status));
  return <AdminLayout title={title}>
    <form onSubmit={save} className="rounded-xl border bg-white p-4 grid sm:grid-cols-2 gap-4">
      {fields.map(field => <label key={field.key} className="block min-w-0">{field.label}
        {field.type === 'boolean' ? <input className="ml-3" type="checkbox" checked={!!form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.checked })} /> : field.options || field.type === 'parent' ?
          <select className="block border rounded-lg p-2 w-full" value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>
            {field.type === 'parent' ? <><option value="">No parent</option>{items.filter(x => x._id !== editing).map(x => <option key={x._id} value={x._id}>{x.name}</option>)}</> : field.options.map(x => <option key={x} value={x}>{x}</option>)}
          </select> : <input type={field.type === 'number' ? 'number' : 'text'} required={field.required} className="block border rounded-lg p-2 w-full" value={form[field.key] ?? ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />}
      </label>)}
      <div className="flex gap-3"><button disabled={busy} className="bg-gray-900 text-white rounded-lg px-4 py-2">{editing ? 'Save changes' : 'Create'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(defaults); }}>Cancel</button>}</div>
    </form>
    {message && <p role="status" className="my-3">{message}</p>}
    <div className="flex flex-wrap gap-3 mt-5"><input aria-label="Search records" placeholder="Search records" className="border rounded-lg p-2" value={search} onChange={e=>setSearch(e.target.value)}/>{statusOptions&&<select aria-label="Filter state" className="border rounded-lg p-2" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All states</option>{statusOptions.map(s=><option key={s}>{s}</option>)}</select>}</div>
    <div className="mt-5 grid md:grid-cols-2 gap-3">{visibleItems.map(item => <article key={item._id} className="border rounded-xl bg-white p-4 min-w-0 break-words"><strong>{item.label || item.name}</strong><p>{item.group || item.type} / {renderActions ? `${item.status} / ${item.accountStatus}` : item.active ? 'active' : 'inactive'}</p><div className="flex flex-wrap gap-3 mt-3"><button className="border rounded-lg px-3 py-2" onClick={() => edit(item)}>Edit</button>{renderActions ? renderActions(item, () => load(paged ? pageData.page : 1), setMessage) : <button className="border rounded-lg px-3 py-2" onClick={() => toggle(item)}>{item.active ? 'Deactivate' : 'Activate'}</button>}</div></article>)}</div>
    {paged&&<div className="flex flex-wrap gap-3 items-center mt-4"><button className="border rounded p-2 disabled:opacity-40" disabled={pageData.page<=1} onClick={()=>load(pageData.page-1)}>Previous</button><span>{pageData.total} records · Page {pageData.page}</span><button className="border rounded p-2 disabled:opacity-40" disabled={!pageData.hasNext} onClick={()=>load(pageData.page+1)}>Next</button></div>}
  </AdminLayout>;
}
