// liveconnect-frontend/src/App.js
import { useState } from "react";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <div>
      <Auth onAuth={(u) => setUser(u)} onLogout={() => setUser(null)} />
      {user && <Chat user={user} />} {/* Chat samo kad si ulogovan */}
    </div>
  );
}
