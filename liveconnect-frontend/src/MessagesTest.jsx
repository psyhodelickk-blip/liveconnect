// src/MessagesTest.jsx — presence + typing + realtime + polling
import React, { useEffect, useRef, useState } from "react";
import { api } from "./services/api";
import { connectSocket, getSocket } from "./socket";

export default function MessagesTest({ currentUser }) {
  const [toUser, setToUser] = useState("");
  const [content, setContent] = useState("");

  const [threadUser, setThreadUser] = useState("");
  const [thread, setThread] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [online, setOnline] = useState([]);        // [{userId, username}]
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimer = useRef(null);

  const [log, setLog] = useState("Spreman za poruke ✅");
  const [loading, setLoading] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollRef = useRef(null);
  const debounceRef = useRef(null);

  const pretty = (v) => { try { return JSON.stringify(v, null, 2); } catch { return String(v); } };
  const norm = (v) => String(v || "").trim().toLowerCase();

  const isThreadUserOnline = online.some((o) => o.username?.toLowerCase() === norm(threadUser));

  async function run(name, fn) {
    setLoading(true);
    setLog(`→ ${name} ...`);
    try {
      const data = await fn();
      setLog(pretty(data));
      return data;
    } catch (err) {
      const e = err?.response?.data || { ok: false, error: err?.message || "Network error" };
      setLog(pretty(e));
      return e;
    } finally {
      setLoading(false);
    }
  }

  const loadThread = (cursor) =>
    run("Thread", async () => {
      const u = norm(threadUser);
      if (!u) return { ok: false, error: "Nema usernamea" };

      const { data } = await api.get(
        `/messages/thread/${encodeURIComponent(u)}${cursor ? `?cursor=${cursor}` : ""}`
      );

      if (!cursor) setThread([...data.items].reverse());
      else setThread([...data.items.reverse(), ...thread]);
      setNextCursor(data.nextCursor || null);
      return data;
    });

  const refreshLatest = () => loadThread(null);

  const send = () =>
    run("Send", async () => {
      const to = norm(toUser);
      const body = { toUsername: to, content };
      const { data } = await api.post("/messages/send", body);
      setContent("");
      if (!norm(threadUser)) setThreadUser(to);
      // prestani sa "typing" nakon slanja
      emitTyping(false, to);
      setTimeout(refreshLatest, 120);
      return data;
    });

  const loadMore = () => { if (nextCursor) loadThread(nextCursor); };
  const recent = () => run("Recent", async () => (await api.get("/messages/recent?limit=20")).data );
  const markRead = () =>
    run("Mark read", async () => {
      const { data } = await api.post("/messages/read", { fromUsername: norm(threadUser) });
      setTimeout(refreshLatest, 120);
      return data;
    });

  // POLLING
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (autoRefresh && norm(threadUser)) pollRef.current = setInterval(refreshLatest, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, threadUser]);

  // SOCKET listeners: presence + new messages + typing
  useEffect(() => {
    const s = connectSocket() || getSocket();
    if (!s) return;

    function onPresenceList(list)   { setOnline(list || []); }
    function onPresenceOnline(u)    { setOnline((prev) => {
      const exists = prev.some((x) => x.userId === u.userId);
      return exists ? prev : [...prev, u];
    });}
    function onPresenceOffline(u)   { setOnline((prev) => prev.filter((x) => x.userId !== u.userId)); }

    function onNew(msg) {
      const u = norm(threadUser);
      const involved =
        msg.senderId === currentUser?.id || msg.recipientId === currentUser?.id;
      const isThisThread =
        u &&
        (msg.sender?.username?.toLowerCase() === u ||
         msg.recipient?.username?.toLowerCase() === u);
      if (involved && isThisThread) {
        setThread((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        setLog(pretty({ ok: true, realtime: "message:new", id: msg.id }));
      }
    }

    function onTyping({ fromUsername, isTyping }) {
      const u = norm(threadUser);
      if (fromUsername?.toLowerCase() === u) {
        setIsOtherTyping(isTyping);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        if (isTyping) {
          typingTimer.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      }
    }

    s.on("presence:list", onPresenceList);
    s.on("presence:online", onPresenceOnline);
    s.on("presence:offline", onPresenceOffline);
    s.on("message:new", onNew);
    s.on("typing", onTyping);

    return () => {
      s.off("presence:list", onPresenceList);
      s.off("presence:online", onPresenceOnline);
      s.off("presence:offline", onPresenceOffline);
      s.off("message:new", onNew);
      s.off("typing", onTyping);
    };
  }, [currentUser, threadUser]);

  // Emit typing sa debounce-om
  function emitTyping(isTyping, toName) {
    const s = getSocket();
    const toUsername = norm(toName || threadUser || toUser);
    if (!s || !toUsername) return;
    s.emit("typing", { toUsername, isTyping });
  }

  function onContentChange(e) {
    const val = e.target.value;
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    emitTyping(true);
    debounceRef.current = setTimeout(() => emitTyping(false), 900);
  }

  return (
    <div style={{ maxWidth: 720, margin: "20px auto", fontFamily: "sans-serif" }}>
      <h2>Messages Test</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh (2.5s)
        </label>
        <span style={{ fontSize: 13, color: isThreadUserOnline ? "green" : "#999" }}>
          {norm(threadUser) ? (isThreadUserOnline ? "• online" : "• offline") : ""}
        </span>
        <button onClick={() => refreshLatest()} disabled={loading || !norm(threadUser)}>Ručno osveži nit</button>
        <button onClick={recent} disabled={loading}>Recent</button>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="primaoc (username)" value={toUser} onChange={(e) => setToUser(e.target.value)} style={{ flex: 1, padding: 8 }} />
          <input placeholder="poruka..." value={content} onChange={onContentChange} style={{ flex: 2, padding: 8 }} />
          <button onClick={send} disabled={loading || !toUser || !content}>Pošalji</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="thread sa (username)" value={threadUser} onChange={(e) => setThreadUser(e.target.value)} style={{ flex: 1, padding: 8 }} />
          <button onClick={() => refreshLatest()} disabled={loading || !norm(threadUser)}>Učitaj nit</button>
          <button onClick={() => loadMore()} disabled={loading || !nextCursor}>Učitaj starije</button>
          <button onClick={() => markRead()} disabled={loading || !norm(threadUser)}>Označi pročitano</button>
          {isOtherTyping && <span style={{ fontSize: 12, color: "#666" }}>… {norm(threadUser)} kuca</span>}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6, margin: "12px 0" }}>
        {thread.map((m) => (
          <div key={m.id} style={{ padding: 8, borderRadius: 8, background: "#f2f2f2" }}>
            <div style={{ fontSize: 12, color: "#555" }}>
              {m.sender?.username} → {m.recipient?.username} • #{m.id} • {new Date(m.createdAt).toLocaleString()}
              {m.readAt ? " • ✓" : ""}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>

      <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, minHeight: 150, overflowX: "auto", whiteSpace: "pre-wrap" }}>
{pretty(log)}
      </pre>
    </div>
  );
}
