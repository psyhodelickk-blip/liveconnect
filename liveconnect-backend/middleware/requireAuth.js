import { verifyJwt } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.lc_token;
  if (!token) return res.status(401).json({ ok: false, error: "No token" });

  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ ok: false, error: "Invalid token" });

  req.userId = payload.userId;
  next();
}
