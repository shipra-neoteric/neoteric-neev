// Thin fetch wrapper for the backend API (see backend/SPEC.md §3).
// In dev, Vite proxies /api to the backend (vite.config.js); in production
// this is same-origin unless VITE_API_BASE is set.

const BASE = import.meta.env.VITE_API_BASE || '';

let currentRole = null;
export function setCurrentRole(roleKey) {
  currentRole = roleKey;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(currentRole ? { 'X-Role': currentRole } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${options.method || 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request('/health'),
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
};
