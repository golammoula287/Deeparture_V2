import { useEffect,useMemo,useState } from "react";
import { v2Api } from "@/src/lib/v2Api";
import { Button,Card,Input,Select,Message } from "./Ui";

export default function AttributeEditor({ organisationId, productType, productId, existing = [] }) {
  const [defs,setDefs]=useState([]); const [values,setValues]=useState({}); const [msg,setMsg]=useState('');
  useEffect(()=>{ if(!organisationId)return; v2Api(`/operator/organisations/${organisationId}/attributes/definitions?productType=${productType}`).then(setDefs).catch(()=>{}); },[organisationId,productType]);
  useEffect(()=>{ const next={}; for(const row of existing||[]) if(row.definition?._id) next[row.definition._id]=row.value; setValues(next); },[existing]);
  const grouped=useMemo(()=>defs.reduce((a,d)=>{(a[d.group||'Other'] ||= []).push(d);return a},{}),[defs]);
  const render=(d)=>{const v=values[d._id];if(d.dataType==='boolean')return <input type="checkbox" checked={Boolean(v)} onChange={e=>setValues({...values,[d._id]:e.target.checked})}/>;if(d.dataType==='select')return <Select value={v||''} onChange={e=>setValues({...values,[d._id]:e.target.value})}><option value="">—</option>{(d.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</Select>;if(d.dataType==='multi_select')return <Input value={Array.isArray(v)?v.join(', '):(v||'')} onChange={e=>setValues({...values,[d._id]:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} placeholder="Comma-separated"/>;return <Input type={d.dataType==='number'?'number':'text'} value={v??''} onChange={e=>setValues({...values,[d._id]:d.dataType==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value})}/>};
  const save=async()=>{try{const attrs=defs.filter(d=>values[d._id]!==undefined&&values[d._id]!=='').map(d=>({key:d.key,value:values[d._id]}));await v2Api(`/operator/organisations/${organisationId}/product-attributes`,{method:'PUT',body:JSON.stringify({productType,productId,attributes:attrs})});setMsg('Attributes saved.')}catch(e){setMsg(e.message)}};
  return <Card><h2 className="font-semibold text-lg">Structured attributes</h2><div className="mt-3 space-y-5">{Object.entries(grouped).map(([g,items])=><div key={g}><h3 className="font-medium">{g}</h3><div className="grid md:grid-cols-2 gap-3 mt-2">{items.map(d=><label key={d._id} className="text-sm"><span className="block mb-1">{d.label}</span>{render(d)}</label>)}</div></div>)}</div><Button className="mt-4" onClick={save}>Save attributes</Button><Message>{msg}</Message></Card>;
}
