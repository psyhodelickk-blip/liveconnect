// liveconnect-frontend/src/services/api.js
const API_BASE = "/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    body: options.body,
  });

  let text = "";
  try { text = await res.text(); } catch (_) {}

  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { /* nije JSON */ }
  }

  if (!res.ok) {
    const code = data?.error || data?.code;
    const msg =
      data?.message || data?.msg || (typeof data === "string" ? data : text) || res.statusText;

    const err = new Error(msg);
    err.status = res.status;
    err.code = code;
    err.body = data ?? text;
    throw err;
  }

  return data;
}

export const api = {
  register: (payload) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login:    (payload) => apiFetch("/auth/login",    { method: "POST", body: JSON.stringify(payload) }),
  me:       ()        => apiFetch("/auth/me"),
  logout:   ()        => apiFetch("/auth/logout",   { method: "POST" }),
  health:   ()        => apiFetch("/health"),
};

// kompat sloj (ako negde koristiš Re.post/Re.get)
export const Re = {
  get:    (path)        => apiFetch(path, { method: "GET" }),
  post:   (path, data ) => apiFetch(path, { method: "POST", body: JSON.stringify(data) }),
  put:    (path, data ) => apiFetch(path, { method: "PUT",  body: JSON.stringify(data) }),
  delete: (path)        => apiFetch(path, { method: "DELETE" }),
};

export default Re;
export { API_BASE };
