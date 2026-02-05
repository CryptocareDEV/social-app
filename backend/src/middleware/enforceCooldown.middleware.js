// backend/src/middleware/enforceCooldown.middleware.js

export const enforceCooldown = (req, res, next) => {
  const { cooldownUntil, isSuperuser } = req.user

  // 🛡 Superusers bypass cooldowns
  if (isSuperuser) {
    return next()
  }

  // ⏱ Active cooldown blocks actions
  if (
    cooldownUntil &&
    new Date(cooldownUntil) > new Date()
  ) {
    return res.status(403).json({
      error: "You are on cooldown",
      cooldownUntil,
    })
  }

  next()
}

