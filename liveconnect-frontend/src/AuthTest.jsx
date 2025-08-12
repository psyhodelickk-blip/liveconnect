// src/AuthTest.jsx
import React, { useState } from "react";
import { api } from "./services/api";

export default function AuthTest({ onAuth = () => {}, onLogout = () => {} }) {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [out, setOut]           = useState("Spreman ✅");
  const [loading, setLoading]   = useState(false);
  const [last, setLast]         = useState(null);

  const pretty = (v) => {
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  };

  async function run(name, fn) {
    setLoading(true);
    setOut(`→ ${name} ...`);
    setLast(name);
    try {
      const data = await fn();
      setOut(data);
      return data;
    } catch (err) {
      const payload = err?.response?.data || { ok: false, error: err?.message || "Network error" };
      setOut(payload);
      return payload;
    } finally {
      setLoading(false);
    }
  }

  const doRegister = async () => {
    const data = await run("Register", async () => {
      const body = { username: username.trim(), password };
      if (email.trim()) body.email = email.trim();
      const { data } = await api.post("/auth/register", body);
      return data;
    });
    if (data?.ok && data?.user) onAuth(data.user);
  };

  const doLogin = async () => {
    const data = await run("Login", async () => {
      const body = { password };
      if (email.trim()) body.email = email.trim();
      else body.username = username.trim().toLowerCase();
      const { data } = await api.post("/auth/login", body);
      return data;
    });
    if (data?.ok && data?.user) onAuth(data.user);
  };

  const doMe = async () => {
    const data = await run("Me", async () => {
      const { data } = await api.get("/auth/me");
      return data;
    });
    if (data?.ok && data?.user) onAuth(data.user);
  };

  const doLogout = async () => {
    const data = await run("Logout", async () => {
      const { data } = await api.post("/auth/logout");
      return data;
    });
    if (data?.ok) onLogout();
  };

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>LiveConnect – Auth Test</h2>
      <div style={{ color: "#666" }}>
        Backend: <code>{api.defaults.baseURL}</code>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        <label>
          <div>Username (za register / ili login bez email-a)</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="npr. testuser"
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
            placeholder="npr. test12345"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button type="button" onClick={doRegister} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading && last === "Register" ? "..." : "Register"}
          </button>
          <button type="button" onClick={doLogin} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading && last === "Login" ? "..." : "Login"}
          </button>
          <button type="button" onClick={doMe} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading && last === "Me" ? "..." : "Me"}
          </button>
          <button type="button" onClick={doLogout} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading && last === "Logout" ? "..." : "Logout"}
          </button>
        </div>

        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: 12,
            borderRadius: 8,
            minHeight: 150,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
{pretty(out)}
        </pre>
      </div>
    </div>
  );
}
