import { useState } from 'react';
import { v2Api } from '@/src/lib/v2Api';
import { Button, Card, Input, Message } from './Ui';

export default function MediaManager({ organisationId, entityType, entityId, items = [], onChange }) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint = `/operator/organisations/${organisationId}/media`;
  const mutate = async (suffix, method, body) => {
    setBusy(true); setMessage('');
    try {
      await v2Api(endpoint + suffix, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setUrl(''); onChange?.();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <Card>
    <h2 className="font-semibold text-lg">Images</h2>
    <form className="grid sm:grid-cols-[1fr_auto] gap-2 mt-3" onSubmit={event => { event.preventDefault(); mutate('', 'POST', { entityType, entityId, url, featured: items.length === 0 }); }}>
      <Input aria-label="Image URL" type="url" required value={url} onChange={event => setUrl(event.target.value)} placeholder="https://… image URL" />
      <Button disabled={busy || !url.trim()}>Add image</Button>
    </form>
    <Message>{message}</Message>
    <div className="grid sm:grid-cols-2 gap-3 mt-3">{items.map((item, index) => <div key={item._id} className="border rounded-lg p-3 min-w-0">
      <img src={item.url} alt={item.altText || item.title || ''} className="h-28 w-full object-cover rounded" />
      <p className="text-sm mt-2 break-all">{item.title || 'Image'}{item.featured ? ' · Featured' : ''}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        <Button kind="secondary" disabled={busy || item.featured} onClick={() => mutate('/' + item._id, 'PATCH', { featured: true })}>Make featured</Button>
        <Button kind="secondary" disabled={busy || index === 0} onClick={async () => {
          const previous = items[index - 1];
          await mutate('/' + item._id, 'PATCH', { sortOrder: Number(previous.sortOrder || 0) - 1 });
        }}>Move earlier</Button>
        <Button kind="secondary" disabled={busy} onClick={() => mutate('/' + item._id, 'DELETE')}>Remove</Button>
      </div>
    </div>)}</div>
  </Card>;
}
