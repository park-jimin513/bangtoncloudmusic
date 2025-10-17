// Resolve backend URL safely for CRA (REACT_APP_), Vite (VITE_), runtime window.__env, or fallback.
// Default to deployed backend in production to avoid ERR_CONNECTION_REFUSED when frontend runs on Vercel.
const getEnvBackendUrl = () => {
  // Vite
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // CRA / Webpack
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Runtime injection (optional)
  if (typeof window !== "undefined" && window.__env && window.__env.BACKEND_URL) {
    return window.__env.BACKEND_URL;
  }

  // If running in production (deployed), use the deployed backend
  if (typeof window !== "undefined" && window.location && !/localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    return "https://vercel-backend-v4zo.vercel.app";
  }

  // Dev fallback
  return "http://localhost:5000";
};

export const API_BASE = getEnvBackendUrl();

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: options.credentials ?? "same-origin",
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status !== 204 ? res.json() : null;
}