// liveconnect-frontend/src/services/api.js
import axios from "axios";

// U produkcijskom buildu CRA, REACT_APP_* vrednosti se “upeku” u bundle.
// Ako nije definisano, padamo na localhost:4000.
const baseURL =
  (typeof window !== "undefined" && window.__API_URL__) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Globalni loger – da vidimo zašto “ništa ne dešava”
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Ovo pomaže da vidiš poruku u DevTools konzoli
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Network/unknown error";
    console.error("[API ERROR]", { url: err?.config?.url, msg, status: err?.response?.status });
    return Promise.reject(err);
  }
);
