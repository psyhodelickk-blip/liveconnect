const { Router } = require("express");
const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

module.exports = router;
