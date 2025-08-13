const express = require("express");
const cors = require("cors");
require("dotenv").config();

const healthRouter = require("./health");

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

app.use(healthRouter);

app.get("/", (_req, res) => res.send("LiveConnect backend up"));

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
