// liveconnect-frontend/src/pages/Login.js
import React, { useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();              // spreči reload
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      // očekujemo { ok: true, user: {...} } ili slično
      if (data?.ok) {
        // idi na home/poruke – prilagodi po želji
        navigate("/");
      } else {
        setError(data?.error || "Login nije uspeo");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Greška pri logovanju";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 16 }}>Login</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Username ili email</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="npr. lesto"
            autoFocus
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Lozinka</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        {error ? (
          <div style={{ color: "#b00020", background: "#fee", padding: 10, borderRadius: 8 }}>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !identifier || !password}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: loading ? "#888" : "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Prijavljivanje..." : "Uđi"}
        </button>
      </form>

      <div style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
        Tip: testiraj u DevTools → Network/Console ako nešto ne radi.
      </div>
    </div>
  );
}
