// LiveConnect backend server (ESM)
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// rute
import healthRouter from "./routes/health.js";
import dbRouter from "./routes/db.js";

dotenv.config();

const app = express();

// Config
const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// Routes
app.use(healthRouter);
app.use(dbRouter);

// Root ping
app.get("/", (_req, res) => res.send("LiveConnect backend up"));

// Start
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
