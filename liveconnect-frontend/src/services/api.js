// liveconnect-frontend/src/services/api.js
// Varijanta B: koristimo relativnu bazu, NGINX proxy-ira na backend
const API_BASE = "/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  // Ako telo nije JSON, vrati prazan objekat da ne puca UI
  return res.json().catch(() => ({}));
}

export const api = {
  register: (data) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiFetch("/auth/me"),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  health: () => apiFetch("/health"),
};

export { API_BASE };
