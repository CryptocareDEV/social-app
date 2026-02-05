import prisma from "../lib/prisma.js"
import { applyStrikes } from "../lib/strikeEngine.js"
import { applyReporterCooldownIfNeeded } from "../lib/reporterCooldown.js"

/**
 * GET /api/v1/moderation/reports
 */
export const getModerationReports = async (req, res) => {
  try {
    const userId = req.user.userId

    const isSuperuser =
  (await prisma.superuser.findUnique({ where: { userId },
   }))

if (!isSuperuser) {
  return res.status(403).json({
    error: "Superuser only",
  })
}

    const reports = await prisma.report.findMany({
  orderBy: { createdAt: "desc" },
  include: {
    post: {
      select: {
        id: true,
        caption: true,
        rating: true,
        moderationActions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            outcome: true,
          },
        },
      },
    },
    reporter: {
      select: {
        id: true,
        username: true,
        reportAccuracy: true,
        reportsSubmitted: true,
        reportsConfirmed: true,
        reportsRejected: true,
        reportCooldownUntil: true,
      },
    },
  },
})


    return res.json(reports)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to load reports" })
  }
}

/**
 * POST /api/v1/moderation/actions
 */
export const applyModerationAction = async (req, res) => {
  try {
    const actorId = req.user.userId
    const { postId, outcome, note } = req.body

    /* ================================
       0️⃣ Validation
    ================================= */
    if (!postId || !outcome) {
      return res.status(400).json({
        error: "postId and outcome required",
      })
    }

    const allowedOutcomes = [
      "NO_ACTION",
      "LIMITED",
      "REMOVED",
      "ESCALATED",
    ]

    if (!allowedOutcomes.includes(outcome)) {
      return res.status(400).json({
        error: "Invalid outcome",
      })
    }

/* ================================
   🧭 Derive severity (single source)
================================ */
let severity = "LOW"

if (["MINOR_SAFETY", "NSFW_EXPOSURE"].includes(note)) {
  severity = "CRITICAL"
} else if (["REMOVED", "ESCALATED"].includes(outcome)) {
  severity = "HIGH"
} else if (outcome === "LIMITED") {
  severity = "MEDIUM"
}


    /* ================================
       1️⃣ Permission check
    ================================= */

    const isSuperuser =
  (await prisma.superuser.findUnique({
    where: { userId },
  })) !== null

if (!isSuperuser) {
  return res.status(403).json({ error: "Superuser only" })
}


    /* ================================
       2️⃣ Load post
    ================================= */
    const post = await prisma.post.findUnique({
  where: { id: postId },
  select: {
    id: true,
    userId: true,
    isRemoved: true,
  },
})

if (post?.isRemoved && outcome !== "ESCALATED") {
  return res.status(400).json({
    error: "Post already removed. Action is locked.",
  })
}


    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      })
    }

    /* ================================
       3️⃣ Record moderation action
    ================================= */
    await prisma.moderationAction.create({
      data: {
        postId,
        outcome,
        note: note?.trim() || null,
      },
    })

    /* ================================
       4️⃣ Apply strikes to post author
    ================================= */
    await applyStrikes({
      userId: post.userId,
      outcome,
    })

    /* ================================
   4.5️⃣ Enforce post visibility
================================ */
if (outcome === "REMOVED") {
  await prisma.post.update({
    where: { id: postId },
    data: {
      isRemoved: true,
    },
  })
}

if (outcome === "LIMITED") {
  await prisma.post.update({
    where: { id: postId },
    data: {
      rating: "NSFW",
    },
  })
}


    /* ================================
       5️⃣ Resolve related reports
    ================================= */
    const relatedReports = await prisma.report.findMany({
      where: { postId },
      select: { reporterId: true },
    })

    const isConfirmed = ["LIMITED", "REMOVED", "ESCALATED"].includes(outcome)

    for (const r of relatedReports) {
      /* ---------- load reporter ---------- */
      const reporter = await prisma.user.findUnique({
        where: { id: r.reporterId },
        select: {
          id: true,
          reportsSubmitted: true,
          reportsConfirmed: true,
          reportsRejected: true,
          reportAccuracy: true,
          dateOfBirth: true,
          reportCooldownUntil: true,
        },
      })

      if (!reporter) continue

      /* ---------- minor check ---------- */
      let isMinor = false
      if (reporter.dateOfBirth) {
        const dob = new Date(reporter.dateOfBirth)
        const now = new Date()
        let age = now.getFullYear() - dob.getFullYear()
        const m = now.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age--
        }
        isMinor = age < 18
      }

      // 🛡 Minors are never penalized for reporting
      if (isMinor) continue

      /* ---------- apply report result ---------- */
      await prisma.user.update({
        where: { id: reporter.id },
        data: {
          reportsConfirmed: isConfirmed
            ? { increment: 1 }
            : undefined,
          reportsRejected: !isConfirmed
            ? { increment: 1 }
            : undefined,
            lastRejectedAt: new Date(),
            lastRejectedSeverity: severity,
        },
      })




      /* ---------- RELOAD reporter (critical fix) ---------- */
      const updatedReporter = await prisma.user.findUnique({
        where: { id: reporter.id },
        select: {
          reportsSubmitted: true,
          reportsConfirmed: true,
          reportsRejected: true,
          reportAccuracy: true,
          reportCooldownUntil: true,
        },
      })

      if (!updatedReporter) continue

      /* ---------- recompute accuracy ---------- */
      // 🔁 Recompute reporter accuracy from canonical counters
const refreshedReporter = await prisma.user.findUnique({
  where: { id: reporter.id },
  select: {
    reportsSubmitted: true,
    reportsConfirmed: true,
  },
})

const accuracy =
  refreshedReporter.reportsConfirmed /
  Math.max(1, refreshedReporter.reportsSubmitted)

await prisma.user.update({
  where: { id: reporter.id },
  data: {
    reportAccuracy: Math.min(1, Math.max(0, accuracy)),
  },
})


      /* ---------- reporter abuse cooldown ---------- */
      const now = new Date()

      if (
  outcome === "NO_ACTION" &&
  updatedReporter.reportsSubmitted >= 5 &&
  accuracy < 0.3 &&
  (!updatedReporter.reportCooldownUntil ||
    updatedReporter.reportCooldownUntil < now)
) {
  let cooldownMs = 24 * 60 * 60 * 1000 // default 24h

  if (severity === "HIGH") {
    cooldownMs = 3 * 24 * 60 * 60 * 1000
  }

  if (severity === "CRITICAL") {
    cooldownMs = 7 * 24 * 60 * 60 * 1000
  }

  await prisma.user.update({
    where: { id: reporter.id },
    data: {
      reportCooldownUntil: new Date(now.getTime() + cooldownMs),
    },
  })
}

    }

    /* ================================
       6️⃣ Audit log
    ================================= */
    await prisma.moderationLog.create({
      data: {
        actorId,
        actorType: isSuperuser ? "SUPERUSER" : "MODERATOR",
        action: `APPLY_${outcome}`,
        targetId: postId,
        reason: note || null,
      },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("APPLY MODERATION ACTION ERROR:", err)
    return res.status(500).json({
      error: "Failed to apply moderation action",
    })
  }
}
