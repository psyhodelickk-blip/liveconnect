// liveconnect-frontend/src/api.js
const isDev = window.location.port === "3000";
const BASE = isDev ? "http://localhost:4000" : "";
const PREFIX = isDev ? "" : "/api";

export async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${PREFIX}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res;
}
