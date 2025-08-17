import React, { useEffect, useState } from "react";
import { api } from "./services/api";
import Chat from "./components/Chat";

export default function AuthTest() {
  const [username, setUsername] = useState("nikola");
  const [password, setPassword] = useState("sifra123");
  const [user, setUser]       = useState(null);
  const [error, setError]     = useState("");
  const [debug, setDebug]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => { try { const me = await api.me(); if (me?.user) setUser(me.user); } catch {} })(); }, []);

  async function doLogin() {
    setError(""); setDebug(null); setLoading(true);
    try { const res = await api.login({ username, password }); setDebug({ step: "login", res }); if (res?.user) setUser(res.user); }
    catch (e) { setError(`${e.code || e.status || ""} ${e.message || "Server error"}`.trim()); setDebug({ step: "login:error", status: e.status, code: e.code, body: e.body }); }
    finally { setLoading(false); }
  }
  async function doRegister() {
    setError(""); setDebug(null); setLoading(true);
    try { const res = await api.register({ username, password }); setDebug({ step: "register", res }); }
    catch (e) { setError(`${e.code || e.status || ""} ${e.message || "Server error"}`.trim()); setDebug({ step: "register:error", status: e.status, code: e.code, body: e.body }); }
    finally { setLoading(false); }
  }
  async function doLogout() { setLoading(true); try { await api.logout(); setUser(null); } catch {} setLoading(false); }
  function handleSubmit(e) { e.preventDefault(); doLogin(); }

  if (user) {
    return (
      <div style={{ maxWidth: 960, margin: "24px auto", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Dobrodošao, {user.name || user.username || "user"}</h2>
        <button onClick={doLogout} disabled={loading} style={{ marginBottom: 16 }}>
          {loading ? "..." : "Odjavi se"}
        </button>

        <pre style={{ background: "#0b0b0b", color: "#0f0", padding: 10, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify({ user }, null, 2)}
        </pre>

        {/* >>> OVO je chat blok  <<< */}
        <div style={{ marginTop: 16 }}>
          <Chat user={user} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 620, margin: "24px auto", padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>LiveConnect</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <button type="button" onClick={doLogin} disabled={loading}>{loading ? "..." : "Login"}</button>
          <button type="button" onClick={doRegister} disabled={loading} style={{ marginLeft: 8 }}>{loading ? "..." : "Register"}</button>
        </div>

        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: "block", width: 320, marginBottom: 10 }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", width: 320, marginBottom: 10 }} />

        <button type="submit" disabled={loading}>{loading ? "..." : "Uđi"}</button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {debug && (
        <pre style={{ background: "#0b0b0b", color: "#0f0", padding: 10, borderRadius: 8, marginTop: 12, overflowX: "auto" }}>
          {JSON.stringify(debug, null, 2)}
        </pre>
      )}
    </div>
  );
}
