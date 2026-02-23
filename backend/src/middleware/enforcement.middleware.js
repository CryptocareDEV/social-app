export const enforceUserStatus = (req, res, next) => {
  const user = req.user

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  // 🛡 Superusers bypass all restrictions
  if (user.isSuperuser || user.isRoot) {
    return next()
  }

  if (user.isBanned) {
    return res.status(403).json({
      error: "Account permanently banned",
    })
  }

  if (user.cooldownUntil) {
    const now = new Date()
    if (now < new Date(user.cooldownUntil)) {
      return res.status(403).json({
        error: "You are temporarily restricted from posting",
        cooldownUntil: user.cooldownUntil,
      })
    }
  }

  next()
}