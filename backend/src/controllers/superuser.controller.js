import prisma from "../lib/prisma.js"

/* ================================
   👑 List all superusers
================================ */
export const listSuperusers = async (req, res) => {
  try {
    const superusers = await prisma.superuser.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return res.json(superusers)
  } catch (err) {
    console.error("LIST SUPERUSERS ERROR:", err)
    return res.status(500).json({ error: "Failed to fetch superusers" })
  }
}

/* ================================
   ⬆ Promote user to superuser
================================ */
export const promoteToSuperuser = async (req, res) => {
  try {
    const { userId, role } = req.body
    const requester = req.user


    if (!userId || !role) {
      return res.status(400).json({ error: "userId and role required" })
    }


    // 🔎 Load target user
const targetUser = await prisma.user.findUnique({
  where: { id: userId },
})

if (!targetUser) {
  return res.status(404).json({
    error: "User not found",
  })
}

// 👑 ROOT must never be added to superuser table
if (
  targetUser.email === process.env.PLATFORM_OWNER_EMAIL
) {
  return res.status(400).json({
    error: "ROOT does not require superuser assignment",
  })
}

    if (role === "ROOT") {
      return res.status(403).json({ error: "Cannot assign ROOT role" })
    }

    // Only ROOT can create ADMIN
    if (role === "ADMIN" && !requester.isRoot) {
      return res.status(403).json({
        error: "Only ROOT can assign ADMIN role",
      })
    }

    const existing = await prisma.superuser.findUnique({
      where: { userId },
    })

    if (existing) {
      return res.status(400).json({
        error: "User is already a superuser",
      })
    }

    const created = await prisma.superuser.create({
      data: { userId, role },
    })

    // 📝 Log promotion
await prisma.moderationLog.create({
  data: {
    actorId: requester.userId,
    actorType: requester.isRoot ? "SUPERUSER" : "SUPERUSER",
    action: "PROMOTE_SUPERUSER",
    targetId: userId,
    reason: role,
  },
})


    return res.status(201).json(created)
  } catch (err) {
    console.error("PROMOTE ERROR:", err)
    return res.status(500).json({ error: "Promotion failed" })
  }
}

/* ================================
   🔄 Change superuser role
================================ */
export const changeSuperuserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body
    const requester = req.user

    if (!role) {
      return res.status(400).json({ error: "role required" })
    }

    if (role === "ROOT") {
      return res.status(403).json({ error: "Cannot assign ROOT role" })
    }

    const target = await prisma.superuser.findUnique({
      where: { userId },
      include: { user: true },
    })

    if (!target) {
      return res.status(404).json({ error: "Superuser not found" })
    }

    // Protect ROOT (env-based)
    if (
      target.user.email === process.env.PLATFORM_OWNER_EMAIL
    ) {
      return res.status(403).json({
        error: "Cannot modify ROOT",
      })
    }

    // ADMIN cannot change another ADMIN
    if (
      target.role === "ADMIN" &&
      !requester.isRoot
    ) {
      return res.status(403).json({
        error: "Only ROOT can modify ADMIN",
      })
    }

    // Only ROOT can assign ADMIN
    if (role === "ADMIN" && !requester.isRoot) {
      return res.status(403).json({
        error: "Only ROOT can assign ADMIN",
      })
    }

    const updated = await prisma.superuser.update({
      where: { userId },
      data: { role },
    })

    // 📝 Log role change
await prisma.moderationLog.create({
  data: {
    actorId: requester.userId,
    actorType: requester.isRoot ? "SUPERUSER" : "SUPERUSER",
    action: "CHANGE_SUPERUSER_ROLE",
    targetId: userId,
    reason: role,
  },
})


    return res.json(updated)
  } catch (err) {
    console.error("CHANGE ROLE ERROR:", err)
    return res.status(500).json({ error: "Role update failed" })
  }
}

/* ================================
   ⬇ Demote superuser
================================ */
export const demoteSuperuser = async (req, res) => {
  try {
    const { userId } = req.params
    const requester = req.user

    const target = await prisma.superuser.findUnique({
      where: { userId },
      include: { user: true },
    })

    if (!target) {
      return res.status(404).json({ error: "Superuser not found" })
    }

    // Prevent ROOT removal
    if (
      target.user.email === process.env.PLATFORM_OWNER_EMAIL
    ) {
      return res.status(403).json({
        error: "Cannot demote ROOT",
      })
    }

    // Prevent self-demotion unless ROOT
    if (
      userId === requester.userId &&
      !requester.isRoot
    ) {
      return res.status(403).json({
        error: "Cannot demote yourself",
      })
    }

    // ADMIN cannot demote ADMIN
    if (
      target.role === "ADMIN" &&
      !requester.isRoot
    ) {
      return res.status(403).json({
        error: "Only ROOT can demote ADMIN",
      })
    }

    await prisma.superuser.delete({
      where: { userId },
    })

    // 📝 Log demotion
await prisma.moderationLog.create({
  data: {
    actorId: requester.userId,
    actorType: requester.isRoot ? "SUPERUSER" : "SUPERUSER",
    action: "DEMOTE_SUPERUSER",
    targetId: userId,
    reason: null,
  },
})


    return res.json({ success: true })
  } catch (err) {
    console.error("DEMOTE ERROR:", err)
    return res.status(500).json({ error: "Demotion failed" })
  }
}

/* ================================
   🛠 Reset user enforcement state
================================ */
export const resetUserEnforcement = async (req, res) => {
  try {
    const { userId } = req.params
    const requester = req.user

    const target = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!target) {
      return res.status(404).json({
        error: "User not found",
      })
    }

    // 👑 Cannot override ROOT
    if (
      target.email === process.env.PLATFORM_OWNER_EMAIL
    ) {
      return res.status(403).json({
        error: "Cannot modify ROOT",
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        cooldownUntil: null,
        reportCooldownUntil: null,
        nsfwStrikes: 0,
        reportAccuracy: 1,
        lastRejectedAt: null,
        lastRejectedSeverity: null,
        isBanned: false,
      },
    })

    // 📝 Log override
    await prisma.moderationLog.create({
      data: {
        actorId: requester.userId,
        actorType: "SUPERUSER",
        action: "RESET_USER_ENFORCEMENT",
        targetId: userId,
        reason: null,
      },
    })

    return res.json({
      success: true,
    })
  } catch (err) {
    console.error("RESET USER ERROR:", err)
    return res.status(500).json({
      error: "Failed to reset user enforcement",
    })
  }
}


/* ================================
   📊 Platform System Health
================================ */
export const getSystemHealth = async (req, res) => {
  try {
    const now = new Date()

    const [
      activePostCooldown,
      activeReportCooldown,
      usersWithStrikes,
      bannedUsers,
      avgAccuracy,
      bannedList,
      postCooldownList,
      reportCooldownList,
      strikeList,
    ] = await Promise.all([

      prisma.user.count({
        where: {
          cooldownUntil: { gt: now },
        },
      }),

      prisma.user.count({
        where: {
          reportCooldownUntil: { gt: now },
        },
      }),

      prisma.user.count({
        where: {
          nsfwStrikes: { gt: 0 },
        },
      }),

      prisma.user.count({
        where: {
          isBanned: true,
        },
      }),

      prisma.user.aggregate({
        _avg: { reportAccuracy: true },
      }),

      prisma.user.findMany({
        where: { isBanned: true },
        select: { id: true, username: true, email: true },
      }),

      prisma.user.findMany({
        where: { cooldownUntil: { gt: now } },
        select: { id: true, username: true, cooldownUntil: true },
      }),

      prisma.user.findMany({
        where: { reportCooldownUntil: { gt: now } },
        select: { id: true, username: true, reportCooldownUntil: true },
      }),

      prisma.user.findMany({
        where: { nsfwStrikes: { gt: 0 } },
        select: { id: true, username: true, nsfwStrikes: true },
      }),
    ])

    return res.json({
      activePostCooldown,
      activeReportCooldown,
      usersWithStrikes,
      bannedUsers,
      avgReportAccuracy: avgAccuracy._avg.reportAccuracy || 1,

      bannedList,
      postCooldownList,
      reportCooldownList,
      strikeList,
    })
  } catch (err) {
    console.error("SYSTEM HEALTH ERROR:", err)
    return res.status(500).json({
      error: "Failed to load system health",
    })
  }
}


/* ================================
   🔍 Enforcement Users (Paginated)
================================ */
export const getEnforcementUsers = async (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query

    if (!type) {
      return res.status(400).json({
        error: "type query parameter required",
      })
    }

    const currentPage = Math.max(1, parseInt(page))
    const size = Math.min(100, Math.max(1, parseInt(pageSize)))
    const skip = (currentPage - 1) * size
    const now = new Date()

    let where = {}

    switch (type) {
      case "BANNED":
        where = { isBanned: true }
        break

      case "STRIKES":
        where = { nsfwStrikes: { gt: 0 } }
        break

      case "POST_COOLDOWN":
        where = { cooldownUntil: { gt: now } }
        break

      case "REPORT_COOLDOWN":
        where = { reportCooldownUntil: { gt: now } }
        break

      default:
        return res.status(400).json({
          error: "Invalid type",
        })
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          isBanned: true,
          nsfwStrikes: true,
          cooldownUntil: true,
          reportCooldownUntil: true,
          reportAccuracy: true,
        },
      }),
    ])

    return res.json({
      total,
      page: currentPage,
      pageSize: size,
      users,
    })
  } catch (err) {
    console.error("ENFORCEMENT USERS ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch enforcement users",
    })
  }
}
