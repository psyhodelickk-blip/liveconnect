import { useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);
  const navigate = useNavigate();

  async function onLogin(e) {
    e.preventDefault();
    setError("");
    setDebug(null);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      setDebug({ endpoint: "/auth/login", data });
      if (data?.ok) return navigate("/chat");
      setError(data?.error || "Login nije uspeo");
    } catch (err) {
      setError(err?.response?.data?.error || "Server error");
      setDebug({ endpoint: "/auth/login", error: err?.toString() });
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    setError("");
    setDebug(null);
    try {
      const { data } = await api.post("/auth/register", { username, password });
      setDebug({ endpoint: "/auth/register", data });
      if (data?.ok) return navigate("/chat");
      setError(data?.error || "Registracija nije uspela");
    } catch (err) {
      setError(err?.response?.data?.error || "Server error");
      setDebug({ endpoint: "/auth/register", error: err?.toString() });
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>LiveConnect</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("login")}
          style={{ fontWeight: tab === "login" ? 700 : 400 }}
        >
          Login
        </button>
        <button
          onClick={() => setTab("register")}
          style={{ fontWeight: tab === "register" ? 700 : 400 }}
        >
          Register
        </button>
      </div>

      <form onSubmit={tab === "login" ? onLogin : onRegister}>
        <div style={{ marginBottom: 8 }}>
          <div>Username</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            autoComplete="username"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" style={{ width: "100%", padding: 10 }}>
          {tab === "login" ? "Uđi" : "Napravi nalog"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          {error}
        </div>
      )}

      {debug && (
        <pre style={{ marginTop: 12, background: "#111", color: "#0f0", padding: 8 }}>
{JSON.stringify(debug, null, 2)}
        </pre>
      )}
    </div>
  );
}
