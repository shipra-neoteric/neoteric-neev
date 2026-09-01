// Thin fetch wrapper for the backend API (see backend/SPEC.md §3).
// In dev, Vite proxies /api to the backend (vite.config.js), so BASE defaults
// to the relative "/api". In production, VITE_API_URL must point at the
// deployed backend's own /api prefix (e.g. https://host.onrender.com/api) —
// set on Vercel under Project Settings → Environment Variables.

const BASE = import.meta.env.VITE_API_URL || '/api';

let token = null;
export function setToken(t) {
  token = t;
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) onUnauthorized?.();
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${options.method || 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// For binary responses (the PDF report) — a plain <a href> can't carry the
// Authorization header, so download it as a blob and hand back an object URL.
export async function downloadFile(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) onUnauthorized?.();
  if (!res.ok) throw new Error(`Download ${path} failed: ${res.status}`);
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return { blob: await res.blob(), filename: match?.[1] || 'download' };
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  health: () => request('/health'),
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
};
