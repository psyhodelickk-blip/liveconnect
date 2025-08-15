// src/pages/Chat.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { ChatAPI } from "../services/chat";
import { io } from "socket.io-client";

const apiBase =
  (import.meta?.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:4000";

export default function Chat() {
  const [me, setMe] = useState(null);
  const [peers, setPeers] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  // ko sam ja
  useEffect(() => {
    (async () => {
      const { data } = await api.get("/auth/me");
      if (data?.ok) setMe(data.user);
    })();
  }, []);

  // peers
  useEffect(() => {
    (async () => {
      const list = await ChatAPI.peers();
      setPeers(list);
    })();
  }, []);

  // socket
  useEffect(() => {
    if (!me) return;
    const s = io(apiBase, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("hello", me.id); // pridruži me u sobu user:<id>
    });

    s.on("message:new", (msg) => {
      // Primi poruku u real-time-u
      if (
        active &&
        (msg.fromUserId === active.id || msg.toUserId === active.id)
      ) {
        setMessages((m) => [...m, msg]);
        queueMicrotask(() =>
          scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" })
        );
      }
    });

    return () => s.close();
  }, [me, active?.id]);

  // učitaj thread kada promenim sagovornika
  useEffect(() => {
    if (!active) return;
    (async () => {
      const msgs = await ChatAPI.loadThread(active.id);
      setMessages(msgs);
      queueMicrotask(() =>
        scrollRef.current?.scrollTo({ top: 999999, behavior: "auto" })
      );
    })();
  }, [active?.id]);

  const canSend = useMemo(
    () => !!active && text.trim().length > 0,
    [active, text]
  );

  async function send() {
    if (!canSend) return;
    const body = text.trim();
    setText("");
    const m = await ChatAPI.send(active.id, body);
    setMessages((old) => [...old, m]);
    queueMicrotask(() =>
      scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" })
    );
  }

  if (!me) return <div className="p-6">Učitavanje…</div>;

  return (
    <div className="p-6 grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="border rounded-lg p-3 h-[70vh] overflow-auto">
        <div className="font-semibold mb-2">Ulogovan: {me.username}</div>
        <div className="text-sm text-gray-500 mb-3">Sagovornici</div>
        <ul className="space-y-1">
          {peers.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setActive(p)}
                className={
                  "w-full text-left px-3 py-2 rounded-md border " +
                  (active?.id === p.id
                    ? "bg-black text-white"
                    : "hover:bg-gray-100")
                }
              >
                {p.username}
              </button>
            </li>
          ))}
          {peers.length === 0 && (
            <li className="text-sm text-gray-500">Nema drugih korisnika.</li>
          )}
        </ul>
      </aside>

      <section className="border rounded-lg flex flex-col h-[70vh]">
        <div className="p-3 border-b">
          {active ? (
            <div className="font-semibold">Razgovor sa: {active.username}</div>
          ) : (
            <div className="text-gray-500">Izaberi sagovornika sa leve strane.</div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-auto p-3 space-y-2 bg-white"
        >
          {active &&
            messages.map((m) => {
              const mine = m.fromUserId === me.id;
              return (
                <div
                  key={m.id}
                  className={
                    "max-w-[75%] px-3 py-2 rounded-lg " +
                    (mine
                      ? "ml-auto bg-black text-white"
                      : "bg-gray-100 text-black")
                  }
                >
                  <div className="text-sm">{m.body}</div>
                  <div className="text-[11px] opacity-60 mt-1">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          {!active && (
            <div className="text-sm text-gray-500">
              Poruke će se pojaviti ovde.
            </div>
          )}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-2"
            placeholder={active ? "Upiši poruku…" : "Izaberi sagovornika…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={!active}
          />
          <button
            className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-40"
            onClick={send}
            disabled={!canSend}
          >
            Pošalji
          </button>
        </div>
      </section>
    </div>
  );
}
