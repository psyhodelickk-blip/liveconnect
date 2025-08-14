// liveconnect-frontend/src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { api } from "./services/api";
import Login from "./pages/Login";

// Minimalna landing stranica
function Home() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2>LiveConnect</h2>
      <p>Dobrodošao! Idi na <Link to="/login">/login</Link> da se prijaviš ili na <Link to="/app">/app</Link> ako si već ulogovan.</p>
    </div>
  );
}

// Jednostavan dashboard posle logina (placeholder za chat/poruke)
function Dashboard() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2>Dashboard</h2>
      <p>Ulogovan si. Ovde ide tvoja glavna aplikacija (poruke, stream, itd.).</p>
      <p><Link to="/">Nazad na početnu</Link></p>
    </div>
  );
}

// Loading ekran dok proveravamo /auth/me
function LoadingScreen() {
  const loc = useLocation();
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <p>Učitavam ({loc.pathname})…</p>
    </div>
  );
}

// Zaštita ruta: ako nema sesije -> /login
function Protected({ authed, checked, children }) {
  if (!checked) return <LoadingScreen />;
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Ako backend ima /auth/me i vraća { ok: true, user: {...} }
        const { data } = await api.get("/auth/me");
        if (!cancelled) setAuthed(Boolean(data?.ok));
      } catch {
        // Ako endpoint ne postoji ili vrati grešku – tretiramo kao neulogovan
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />

        {/* Ako si već ulogovan, /login te vraća na /app */}
        <Route
          path="/login"
          element={authed && checked ? <Navigate to="/app" replace /> : <Login />}
        />

        {/* Zaštićena ruta za aplikaciju posle logina */}
        <Route
          path="/app"
          element={
            <Protected authed={authed} checked={checked}>
              <Dashboard />
            </Protected>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
