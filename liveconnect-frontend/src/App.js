import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import ChatPage from "./pages/Chat";
import { api } from "./services/api";

function RequireAuth({ children }) {
  const [state, setState] = useState({ ready: false, ok: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (alive) setState({ ready: true, ok: !!data?.ok });
      } catch {
        if (alive) setState({ ready: true, ok: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!state.ready) return null;
  if (!state.ok) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
