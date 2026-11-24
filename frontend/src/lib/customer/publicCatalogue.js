// Server-only public catalogue reads; pricing/filter rules remain in the shared V2 API.
import { internalBaseUrl } from '@/src/config/serverConfig';

export async function catalogueRead(path, query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
  try {
    const response = await fetch(`${internalBaseUrl.replace(/\/$/, '')}/v2/${path}${params.size ? `?${params}` : ''}`, { signal: AbortSignal.timeout(7000), cache: 'no-store' });
    if (!response.ok) return { data: null, error: 'We couldn’t load the catalogue. Please try again.', status: response.status };
    const json = await response.json();
    const data = json.data;
    const validData = path === 'attributes' || path === 'embarkation-ports'
      ? Array.isArray(data)
      : path === 'liveaboards' || path === 'resorts'
        ? Array.isArray(data?.items) && Number.isFinite(data.total)
        : data && typeof data === 'object' && !Array.isArray(data);
    if (!json.success || !validData) throw new Error('Invalid catalogue response');
    return { data: json.data, error: null, status: 200 };
  } catch {
    return { data: null, error: 'We couldn’t reach the catalogue. Please try again.', status: 503 };
  }
}

export function noStore(res) { res.setHeader('Cache-Control', 'private, no-store'); }
