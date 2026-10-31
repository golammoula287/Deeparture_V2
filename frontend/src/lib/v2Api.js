import { v2BaseUrl } from "@/src/config/serverConfig";

export const authHeaders = (extra = {}) => ({
  ...extra,
  Authorization: typeof window !== "undefined" ? (localStorage.getItem("access-token") || "") : "",
});

export async function v2Api(path, options = {}) {
  const headers = options.body instanceof FormData ? authHeaders(options.headers || {}) : authHeaders({ "Content-Type": "application/json", ...(options.headers || {}) });
  const response = await fetch(`${v2BaseUrl}${path}`, { ...options, headers });
  let json = null;
  try { json = await response.json(); } catch (_) { /* noop */ }
  if (!response.ok || !json?.success) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access-token');
      localStorage.removeItem('deeparture-user');
      window.dispatchEvent(new StorageEvent('storage', { key: 'access-token' }));
    }
    const error = new Error(json?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = json;
    throw error;
  }
  return json.data;
}
