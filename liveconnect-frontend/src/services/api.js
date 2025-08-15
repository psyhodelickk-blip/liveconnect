// liveconnect-frontend/src/services/api.js

// PROXY varijanta: frontend gađa /api, NGINX prosleđuje backendu (backend:4000)
const API_BASE = "/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // važno zbog session cookie-a
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  // Ako nema JSON tela, vrati prazan objekat da UI ne puca
  return res.json().catch(() => ({}));
}

// ---- "Visoki nivo" API helperi koje možemo koristiti svuda ----
export const api = {
  register: (data) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiFetch("/auth/me"),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  health: () => apiFetch("/health"),
};

// ---- Adapter za stari kod: Re.get / Re.post / Re.put / Re.delete ----
export const Re = {
  get: (path) => apiFetch(path, { method: "GET" }),
  post: (path, data) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: (path) => apiFetch(path, { method: "DELETE" }),
};

// Zadovolji i "default import" iz starog koda:  import Re from ".../api"
export default Re;
export { API_BASE };
