import ReferenceEditor from '@/src/components/admin/ReferenceEditor';
const defaults = { label:'', key:'', group:'facility', dataType:'boolean', applicableTo:'both', options:'', filterable:true, visibleOnPage:true, active:true, sortOrder:0 };
const fields = [
 {key:'label',label:'Label',required:true},{key:'key',label:'Key (optional when creating)'},
 {key:'group',label:'Group',options:['facility','dietary','accessibility','diving','accommodation','sustainability','other']},
 {key:'dataType',label:'Data type',options:['boolean','number','text','select','multi_select']},
 {key:'applicableTo',label:'Applies to',options:['both','vessel','resort']},
 {key:'options',label:'Options (comma separated)',type:'list'},
 {key:'filterable',label:'Filterable',type:'boolean'},{key:'visibleOnPage',label:'Public display',type:'boolean'},{key:'active',label:'Active',type:'boolean'},{key:'sortOrder',label:'Sort order',type:'number'}
];
export default function Attributes(){ return <ReferenceEditor title="Facilities & Attributes" endpoint="/admin/attributes" defaults={defaults} fields={fields}/>; }
