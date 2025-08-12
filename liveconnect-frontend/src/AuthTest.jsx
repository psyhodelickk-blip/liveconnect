// src/AuthTest.jsx
import React, { useState } from "react";
import { api } from "./services/api";

export default function AuthTest() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [out, setOut]           = useState(null);
  const [loading, setLoading]   = useState(false);

  const pretty = (v) => JSON.stringify(v, null, 2);

  async function doRegister() {
    setLoading(true);
    setOut(null);
    try {
      // Backend kod je podešen da je username OBAVEZAN, email OPCIONO.
      const body = { username, password };
      if (email.trim()) body.email = email.trim();
      const { data } = await api.post("/auth/register", body);
      setOut(data);
    } catch (err) {
      setOut(err?.response?.data || { ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function doLogin() {
    setLoading(true);
    setOut(null);
    try {
      // Ako uneseš email – login preko email-a; inače preko username-a.
      const body = { password };
      if (email.trim()) body.email = email.trim();
      else body.username = username.trim().toLowerCase();

      const { data } = await api.post("/auth/login", body);
      setOut(data);
    } catch (err) {
      setOut(err?.response?.data || { ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function doMe() {
    setLoading(true);
    setOut(null);
    try {
      const { data } = await api.get("/auth/me");
      setOut(data);
    } catch (err) {
      setOut(err?.response?.data || { ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function doLogout() {
    setLoading(true);
    setOut(null);
    try {
      const { data } = await api.post("/auth/logout");
      setOut(data);
    } catch (err) {
      setOut(err?.response?.data || { ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>LiveConnect – Auth Test</h2>

      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        <label>
          <div>Username (obavezno)</div>
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
          <button onClick={doRegister} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading ? "..." : "Register"}
          </button>
          <button onClick={doLogin} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading ? "..." : "Login"}
          </button>
          <button onClick={doMe} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading ? "..." : "Me"}
          </button>
          <button onClick={doLogout} disabled={loading} style={{ padding: "8px 14px" }}>
            {loading ? "..." : "Logout"}
          </button>
        </div>

        <small>
          Napomena: backend šalje JWT u <code>lc_token</code> cookie-ju (CORS credentials moraju biti omogućeni).
        </small>

        <pre
          style={{
            background: "#111",
            color: "#0f0",
            padding: 12,
            borderRadius: 8,
            minHeight: 120,
            overflowX: "auto",
          }}
        >
{pretty(out)}
        </pre>
      </div>
    </div>
  );
}
