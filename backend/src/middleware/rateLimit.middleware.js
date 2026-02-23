import prisma from "../lib/prisma.js"

const LIMITS = {
  POST_CREATE: { hour: 10, day: 20 },
  COMMENT_CREATE: { hour: 20, day: 50 },
  LIKE_TOGGLE: { hour: 100, day: 300 },
  REPORT_CREATE: { hour: 5, day: 15 },
  MEDIA_UPLOAD: { hour: 20, day: 50 },
  PROFILE_UPDATE: { hour: 10, day: 30 },
  COMMUNITY_CREATE: { hour: 2, day: 5 },
  COMMUNITY_JOIN: { hour: 10, day: 30 },
  COMMUNITY_INVITE: { hour: 10, day: 30 },
  MODERATION_ACTION: { hour: 30, day: 200 },
  LOGIN_ATTEMPT: { hour: 20, day: 100 },
  PASSWORD_RESET_ATTEMPT: { hour: 5, day: 20 },
}

export const rateLimit = ({
  action,
  cooldownMs = 60 * 60 * 1000,
}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId
      const config = LIMITS[action]

if (!config) {
  return next() // no limits defined for this action
}

const hourLimit = config.hour
const dayLimit = config.day

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" })
      }

      const now = new Date()

      // 🔒 Check existing cooldown
      if (
        req.user.cooldownUntil &&
        new Date(req.user.cooldownUntil) > now
      ) {
        return res.status(403).json({
          error: "You are temporarily restricted",
          cooldownUntil: req.user.cooldownUntil,
        })
      }

      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // 🔎 Count last hour
      const hourCount = await prisma.userActionLog.count({
        where: {
          userId,
          action,
          createdAt: { gte: hourAgo },
        },
      })

      if (hourCount >= hourLimit) {
        const cooldownUntil = new Date(now.getTime() + cooldownMs)

        await prisma.user.update({
          where: { id: userId },
          data: { cooldownUntil },
        })

        return res.status(429).json({
          error: "Hourly action limit reached",
          cooldownUntil,
        })
      }

      // 🔎 Count last day
      const dayCount = await prisma.userActionLog.count({
        where: {
          userId,
          action,
          createdAt: { gte: dayAgo },
        },
      })

      if (dayCount >= dayLimit) {
        const cooldownUntil = new Date(now.getTime() + cooldownMs)

        await prisma.user.update({
          where: { id: userId },
          data: { cooldownUntil },
        })

        return res.status(429).json({
          error: "Daily action limit reached",
          cooldownUntil,
        })
      }

      // 📝 Log action
      await prisma.userActionLog.create({
        data: {
          userId,
          action,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
        },
      })

      next()
    } catch (err) {
      console.error("RATE LIMIT ERROR:", err)
      return res.status(500).json({
        error: "Rate limit check failed",
      })
    }
  }
}