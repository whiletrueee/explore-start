// Tiny data layer. Prefers the headstart-admin API when NEXT_PUBLIC_API_BASE
// is set, falls back to bundled /public/data/*.json so local dev still works
// without the admin running.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${url} → ${r.status}`)
  return (await r.json()) as T
}

export async function fetchDiscovery<T>(): Promise<T> {
  if (API_BASE) {
    try {
      return await fetchJson<T>(`${API_BASE}/global/discovery`)
    } catch (e) {
      console.warn('[api] /global/discovery failed, falling back to /data/discovery.json', e)
    }
  }
  return fetchJson<T>('/data/discovery.json')
}

export async function fetchPack<T>(handle: string): Promise<T> {
  if (API_BASE) {
    try {
      return await fetchJson<T>(`${API_BASE}/global/packs/${encodeURIComponent(handle)}`)
    } catch (e) {
      console.warn(`[api] /global/packs/${handle} failed, falling back to /data/pack-*.json`, e)
    }
  }
  const stripped = handle.replace(/[^a-z0-9]/gi, '')
  return fetchJson<T>(`/data/pack-${stripped}.json`)
}
