import { useState } from 'react';
import { v2Api } from '@/src/lib/v2Api';
import { Button, Card, Input, Select, Message } from './Ui';
const read = (item, key) => key.split('.').reduce((value, part) => value?.[part], item);
const write = (item, key, value) => { const parts = key.split('.'); const last = parts.pop(); let target = item; for (const part of parts) target = target[part] ||= {}; target[last] = value; };

export default function InventoryEditor({ organisationId, title, endpoint, records = [], fields, cabins, onChange }) {
  const [id, setId] = useState('');
  const [form, setForm] = useState({});
  const [prices, setPrices] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const select = value => {
    const record = records.find(item => item._id === value);
    setId(value); setMessage('');
    setForm(Object.fromEntries(fields.map(([key]) => [key, read(record, key) ?? ''])));
    setPrices((record?.basePrices || []).map(price => ({ ...price })));
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const payload = {};
      for (const [key,,type] of fields) {
        if (form[key] === '' && type === 'number') continue;
        write(payload, key, type === 'number' ? Number(form[key]) : type === 'date' ? String(form[key]).slice(0,10) : form[key]);
      }
      if (cabins) payload.basePrices = prices;
      await v2Api(`/operator/organisations/${organisationId}/${endpoint}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setMessage('Saved.'); onChange?.();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <Card><h2 className="text-lg font-semibold">{title}</h2>
    <Select aria-label={title} className="mt-3" value={id} onChange={event => select(event.target.value)}><option value="">Choose an item to edit…</option>{records.map(item => <option key={item._id} value={item._id}>{item.name || String(item.startDate || '').slice(0,10)}</option>)}</Select>
    {id ? <form onSubmit={save} className="mt-3 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">{fields.map(([key,label,type = 'text']) => <label key={key} className="text-sm">{label}{type === 'checkbox' ? <input className="ml-2" type="checkbox" checked={Boolean(form[key])} onChange={event => setForm({ ...form, [key]: event.target.checked })}/> : <Input type={type} value={type === 'date' ? String(form[key]).slice(0,10) : form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })}/>}</label>)}</div>
      {cabins ? <fieldset className="space-y-2"><legend className="font-medium">Cabin base prices</legend>{prices.map((price, index) => <div key={index} className="grid sm:grid-cols-4 gap-2">
        <Select aria-label="Price cabin" value={price.cabinType} onChange={event => setPrices(prices.map((p,i) => i === index ? { ...p, cabinType: event.target.value } : p))}>{cabins.map(cabin => <option key={cabin._id} value={cabin._id}>{cabin.name}</option>)}</Select>
        <Input aria-label="Base price" type="number" min="0" required value={price.amount} onChange={event => setPrices(prices.map((p,i) => i === index ? { ...p, amount: Number(event.target.value), amountUsd: undefined } : p))}/>
        <Input aria-label="Price currency" required value={price.currency} onChange={event => setPrices(prices.map((p,i) => i === index ? { ...p, currency: event.target.value.toUpperCase(), amountUsd: undefined } : p))}/>
        <Button type="button" kind="secondary" onClick={() => setPrices(prices.filter((_,i) => i !== index))}>Remove price</Button>
      </div>)}<Button type="button" kind="secondary" disabled={!cabins.length} onClick={() => setPrices([...prices, { cabinType: cabins[0]?._id, amount: 0, currency: 'USD', pricingBasis: 'per_person' }])}>Add cabin price</Button></fieldset> : null}
      <Button disabled={busy}>Save changes</Button>
    </form> : null}<Message>{message}</Message>
  </Card>;
}
