import express from "express"
import prisma from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

/**
 * GET /api/v1/root/analytics/overview
 * Root-only global platform metrics
 */
router.get("/analytics/overview", requireAuth, async (req, res) => {
  try {
    if (!req.user.isRoot) {
      return res.status(403).json({ error: "Root access only" })
    }

    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    /* ================================
       📊 Action Volume
    ================================= */
    const [lastHour, lastDay, totalActions] = await Promise.all([
      prisma.userActionLog.count({
        where: { createdAt: { gte: hourAgo } },
      }),
      prisma.userActionLog.count({
        where: { createdAt: { gte: dayAgo } },
      }),
      prisma.userActionLog.count(),
    ])

    /* ================================
       👥 User Stats
    ================================= */
    const totalUsers = await prisma.user.count()

    const activeLast24h = await prisma.userActionLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: dayAgo } },
    })

    /* ================================
       🔥 Top Actions (24h)
    ================================= */
    const topActions = await prisma.userActionLog.groupBy({
      by: ["action"],
      where: { createdAt: { gte: dayAgo } },
      _count: true,
      orderBy: {
        _count: {
          action: "desc",
        },
      },
    })
    const safeTopActions = topActions.map((a) => ({
  ...a,
  _count: {
    action: Number(a._count.action),
  },
}))

    /* ================================
       🚨 Cooldowns Triggered (24h)
    ================================= */
    const cooldownsLast24h = await prisma.user.count({
      where: {
        cooldownUntil: {
          gte: dayAgo,
        },
      },
    })

    // 🌐 Top IPs (24h)
const topIPs = await prisma.userActionLog.groupBy({
  by: ["ipAddress"],
  where: {
    createdAt: { gte: dayAgo },
    NOT: {
      ipAddress: null,
    },
  },
  _count: {
    ipAddress: true,
  },
  orderBy: {
    _count: {
      ipAddress: "desc",
    },
  },
  take: 5,
})
const safeTopIPs = topIPs.map((ip) => ({
  ...ip,
  _count: {
    ipAddress: Number(ip._count.ipAddress),
  },
}))

    /* ================================
       🔥 Top 5 Most Active Users (24h)
    ================================= */
    const topUsersLast24h = await prisma.userActionLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: dayAgo } },
      _count: {
  userId: true,
},
orderBy: {
  _count: {
    userId: "desc",
  },
},
      take: 5,
    })

    const safeTopUsers = topUsersLast24h.map((u) => ({
  ...u,
  _count: {
    userId: Number(u._count.userId),
  },
}))


    /* ================================
   🚨 Spike Detection
================================ */

// 1️⃣ Hour vs Day ratio spike
const baselinePerHour = lastDay / 24
const spikeRatio =
  baselinePerHour > 0 ? lastHour / baselinePerHour : 0

const velocitySpike =
  spikeRatio >= 3 && lastHour >= 10 // 3x normal + meaningful volume

// 2️⃣ Most aggressive user threshold
let aggressiveUser = null

if (topUsersLast24h.length > 0) {
  const topUser = topUsersLast24h[0]
  const userShare = topUser._count / (lastDay || 1)

  if (userShare > 0.4 && topUser._count >= 10) {
    aggressiveUser = {
      userId: topUser.userId,
      actions: topUser._count,
      share: userShare,
    }
  }
}

// 3️⃣ Dominant action threshold
let dominantAction = null

if (topActions.length > 0) {
  const topAction = topActions[0]
  const actionShare = topAction._count / (lastDay || 1)

  if (actionShare > 0.6 && topAction._count >= 10) {
    dominantAction = {
      action: topAction.action,
      count: topAction._count,
      share: actionShare,
    }
  }
}

// 📊 Hourly buckets (last 24h)
const hourlyBuckets = await prisma.$queryRaw`
  SELECT 
    date_trunc('hour', "createdAt") AS hour,
    COUNT(*) AS count
  FROM "UserActionLog"
  WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
  GROUP BY hour
  ORDER BY hour ASC
`
const safeHourlyBuckets = hourlyBuckets.map((b) => ({
  hour: b.hour,
  count: Number(b.count),
}))
    /* ================================
       ✅ Response
    ================================= */
    return res.json({
      users: {
        total: totalUsers,
        activeLast24h: activeLast24h.length,
        cooldownsLast24h,
      },

      actions: {
        total: totalActions,
        lastHour,
        lastDay,
      },

      topActionsLast24h: safeTopActions,
      topUsersLast24h: safeTopUsers,

      spikeSignals: {
    velocitySpike,
    spikeRatio,
    aggressiveUser,
    dominantAction,
  },

  hourlyBuckets: safeHourlyBuckets,
  topIPs: safeTopIPs,
    })
  } catch (err) {
    console.error("ROOT ANALYTICS ERROR:", err)
    return res.status(500).json({
      error: "Failed to load analytics",
    })
  }
})

/**
 * GET /api/v1/root/analytics/user/:userId
 * Root-only user drilldown (last 24h)
 */
router.get("/analytics/user/:userId", requireAuth, async (req, res) => {
  try {
    if (!req.user.isRoot) {
      return res.status(403).json({ error: "Root access only" })
    }

    const { userId } = req.params

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const totalActions = await prisma.userActionLog.count({
      where: {
        userId,
        createdAt: { gte: dayAgo },
      },
    })

    const actionBreakdown = await prisma.userActionLog.groupBy({
      by: ["action"],
      where: {
        userId,
        createdAt: { gte: dayAgo },
      },
      _count: {
  action: true,
},
orderBy: {
  _count: {
    action: "desc",
  },
},
    })

    const recentActivity = await prisma.userActionLog.findMany({
      where: {
        userId,
        createdAt: { gte: dayAgo },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        action: true,
        createdAt: true,
        ipAddress: true,
      },
    })

    return res.json({
      userId,
      totalActions,
      actionBreakdown,
      recentActivity,
    })
  } catch (err) {
    console.error("USER DRILLDOWN ERROR:", err)
    return res.status(500).json({
      error: "Failed to load user analytics",
    })
  }
})

/**
 * GET /api/v1/root/analytics/user/:userId/export
 * Root-only CSV export (last 24h)
 */
router.get(
  "/analytics/user/:userId/export",
  requireAuth,
  async (req, res) => {
    try {
      if (!req.user.isRoot) {
        return res.status(403).json({ error: "Root access only" })
      }

      const { userId } = req.params

      const now = new Date()
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const logs = await prisma.userActionLog.findMany({
        where: {
          userId,
          createdAt: { gte: dayAgo },
        },
        orderBy: { createdAt: "desc" },
        select: {
          action: true,
          createdAt: true,
          ipAddress: true,
          userAgent: true,
        },
      })

      // 🧾 Build CSV manually (no dependency)
      const header = "Action,CreatedAt,IP,UserAgent\n"

      const rows = logs
        .map((log) => {
          return [
            log.action,
            log.createdAt.toISOString(),
            log.ipAddress || "",
            (log.userAgent || "").replace(/,/g, " "),
          ].join(",")
        })
        .join("\n")

      const csv = header + rows

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=user-${userId}-activity.csv`
      )
      res.setHeader("Content-Type", "text/csv")

      return res.send(csv)
    } catch (err) {
      console.error("CSV EXPORT ERROR:", err)
      return res.status(500).json({
        error: "Failed to export CSV",
      })
    }
  }
)

export default router