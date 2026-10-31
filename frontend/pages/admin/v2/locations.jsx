import ReferenceEditor from '@/src/components/admin/ReferenceEditor';
const defaults = { name:'',type:'destination',countryCode:'',parent:'',aliases:'',active:true };
const fields = [{key:'name',label:'Name',required:true},{key:'type',label:'Type',options:['country','region','destination','port','city']},{key:'countryCode',label:'Country code'},{key:'parent',label:'Parent',type:'parent'},{key:'aliases',label:'Aliases (comma separated)',type:'list'},{key:'active',label:'Active',type:'boolean'}];
export default function Locations(){return <ReferenceEditor title="Destinations & Ports" endpoint="/admin/locations" defaults={defaults} fields={fields}/>;}
