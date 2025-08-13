import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import messagesRoutes from "./routes/messages.js";
import paymentsRoutes from "./routes/payments.js";
import { setupRealtime } from "./realtime/io.js";

const PORT = Number(process.env.PORT || 4000);

const app = express();
app.use(express.json());
app.use(cookieParser());

// DEV CORS — pusti sve (da isključimo CORS kao faktor)
app.use(cors({ origin: true, credentials: true, methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.options("*", cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend", ts: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use(messagesRoutes);
app.use(paymentsRoutes);

const httpServer = http.createServer(app);
setupRealtime(httpServer, ["http://localhost:8080","http://localhost:3000"]);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP+WS listening on ${PORT}`);
});
