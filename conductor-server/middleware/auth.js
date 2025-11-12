export function requireUser(req, res, next) {
  const id = req.header("X-User-Id");
  if (!id) return res.status(401).json({ error: "Missing X-User-Id header" });
  req.user = { user_id: Number(id) };
  next();
}

export function requireInstructor(req, res, next) {
  const role = req.header("X-Role");
  if (!role || !["instructor", "ta"].includes(role.toLowerCase()))
    return res.status(403).json({ error: "Instructor/TA role required" });
  next();
}
