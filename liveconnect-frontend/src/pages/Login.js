// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Login({ onAuth = () => {} }) {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]           = useState("Unesi podatke i uloguj se ili registruj.");
  const [busy, setBusy]         = useState(false);
  const navigate = useNavigate();

  const pretty = (v) => {
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  };

  async function run(fn) {
    setBusy(true);
    try {
      const data = await fn();
      setMsg(pretty(data));
      if (data?.ok && data?.user) {
        onAuth(data.user);
        navigate("/chat", { replace: true });
      }
    } catch (err) {
      setMsg(pretty(err?.response?.data || { ok: false, error: err?.message || "Network error" }));
    } finally {
      setBusy(false);
    }
  }

  const doRegister = () =>
    run(async () => {
      const body = { username: username.trim(), password };
      if (email.trim()) body.email = email.trim();
      const { data } = await api.post("/auth/register", body);
      return data;
    });

  const doLogin = () =>
    run(async () => {
      const body = { password };
      if (email.trim()) body.email = email.trim();
      else body.username = username.trim().toLowerCase();
      const { data } = await api.post("/auth/login", body);
      return data;
    });

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 6 }}>LiveConnect</h1>
      <div style={{ color: "#666", marginBottom: 18 }}>Login / Register</div>

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          <div>Username</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="npr. lesto"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Email (opciono)</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="npr. test@example.com"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={doRegister} disabled={busy} style={{ padding: "8px 14px" }}>
            {busy ? "..." : "Register"}
          </button>
          <button onClick={doLogin} disabled={busy} style={{ padding: "8px 14px" }}>
            {busy ? "..." : "Login"}
          </button>
        </div>

        <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, minHeight: 120 }}>
{msg}
        </pre>
      </div>
    </div>
  );
}
