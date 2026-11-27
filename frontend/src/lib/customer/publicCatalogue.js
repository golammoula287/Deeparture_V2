// Server-only public catalogue reads; pricing/filter rules remain in the shared V2 API.
import { baseUrl, internalBaseUrl } from '@/src/config/serverConfig';

const transientStatuses = new Set([408, 429, 502, 503, 504]);
const startupBudget = 65_000;
const unavailable = { data: null, error: 'We couldn’t reach the catalogue. Please try again.', status: 503 };

async function readCatalogue(url, path, timeout) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout), cache: 'no-store' });
    if (!response.ok) {
      await response.body?.cancel();
      return { data: null, error: 'We couldn’t load the catalogue. Please try again.', status: response.status };
    }
    const html = response.headers.get('content-type')?.includes('text/html');
    if (html) {
      await response.body?.cancel();
      return unavailable;
    }
    const { success, data } = await response.json();
    const validData = path === 'attributes' || path === 'embarkation-ports'
      ? Array.isArray(data)
      : path === 'liveaboards' || path === 'resorts'
        ? Array.isArray(data?.items) && Number.isFinite(data.total)
        : data && typeof data === 'object' && !Array.isArray(data);
    if (!success || !validData) return { ...unavailable, status: 500 };
    return { data, error: null, status: 200 };
  } catch {
    return unavailable;
  }
}

export async function catalogueRead(path, query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
  const endpoint = `/v2/${path}${params.size ? `?${params}` : ''}`;
  const internalUrl = internalBaseUrl.replace(/\/$/, '') + endpoint;
  const publicUrl = baseUrl.replace(/\/$/, '') + endpoint;
  const deadline = performance.now() + startupBudget;
  let delay = 1_000;
  let result = await readCatalogue(internalUrl, path, internalUrl === publicUrl ? 25_000 : 7_000);
  if (internalUrl !== publicUrl && (transientStatuses.has(result.status) || [403, 404, 500].includes(result.status))) {
    result = await readCatalogue(publicUrl, path, 25_000);
  }

  // Render can return a gateway error while an idle API service starts.
  while (transientStatuses.has(result.status) && deadline - performance.now() > delay) {
    await new Promise(resolve => setTimeout(resolve, delay));
    const remaining = Math.floor(deadline - performance.now());
    if (remaining <= 0) break;
    result = await readCatalogue(publicUrl, path, Math.min(25_000, remaining));
    delay = Math.min(delay * 2, 8_000);
  }
  return result;
}

export function noStore(res) { res.setHeader('Cache-Control', 'private, no-store'); }
