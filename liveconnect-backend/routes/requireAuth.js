// routes/requireAuth.js
export default function requireAuth(req, res, next) {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
  }
  req.userId = userId;
  next();
}
