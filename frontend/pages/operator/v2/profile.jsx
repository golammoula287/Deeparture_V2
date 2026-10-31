import { useEffect,useState } from "react";
import OperatorLayout from "@/src/components/operator/OperatorLayout";
import { Card,Input,Button,Message } from "@/src/components/operator/Ui";
import { v2Api } from "@/src/lib/v2Api";
const fields=['name','primaryEmail','phone','whatsapp','website','address','country'];
function View({organisationId}){const [form,setForm]=useState({});const [msg,setMsg]=useState('');useEffect(()=>{if(organisationId)v2Api(`/operator/organisations/${organisationId}/profile`).then(setForm).catch(e=>setMsg(e.message))},[organisationId]);const save=async()=>{try{const data=await v2Api(`/operator/organisations/${organisationId}/profile`,{method:'PATCH',body:JSON.stringify({...form,expectedUpdatedAt:form.updatedAt})});setForm(data);setMsg('Profile saved.')}catch(e){setMsg(e.message)}};return <Card><div className="grid md:grid-cols-2 gap-4">{fields.map(k=><label key={k} className={k==='address'?'md:col-span-2':''}><span className="text-sm font-medium capitalize">{k.replace(/([A-Z])/g,' $1')}</span><Input value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><Button className="mt-4" onClick={save}>Save profile</Button><Message>{msg}</Message></Card>}
export default function Page(){return <OperatorLayout title="Organisation Profile">{ctx=><View organisationId={ctx.organisationId}/>}</OperatorLayout>}
