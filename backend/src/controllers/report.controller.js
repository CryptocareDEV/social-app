import prisma from "../lib/prisma.js"
import sanitizeHtml from "sanitize-html"


/**
 * POST /api/v1/reports
 * Create a report for a post
 */
export const createReport = async (req, res) => {
  try {
    const userId = req.user.userId

    /* ================================
       🔎 Load reporter (age + trust)
    ================================= */
    const reporter = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dateOfBirth: true,
        reportsSubmitted: true,
        reportAccuracy: true,
        lastReportAt: true,
        reportCooldownUntil: true,
      },
    })

    if (!reporter) {
      return res.status(401).json({ error: "User not found" })
    }

    /* ================================
       ⛔ Reporter cooldown enforcement
    ================================= */
    if (
      reporter.reportCooldownUntil &&
      new Date(reporter.reportCooldownUntil) > new Date()
    ) {
      return res.status(403).json({
  error: "You are temporarily restricted from reporting",
  reportCooldownUntil: reporter.reportCooldownUntil,
})
    }

    /* ================================
       🧮 Derive minor status
    ================================= */
    const now = new Date()
    let isMinor = true

    if (reporter.dateOfBirth) {
      const dob = new Date(reporter.dateOfBirth)
      let age = now.getFullYear() - dob.getFullYear()
      const m = now.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        age--
      }
      isMinor = age < 18
    }

    /* ================================
       📥 Input validation
    ================================= */
    const { postId, reason, context } = req.body
    /* ================================
   🧱 Report context length limit
================================ */
const MAX_CONTEXT_LENGTH = 500

if (context && context.length > MAX_CONTEXT_LENGTH) {
  return res.status(400).json({
    error: "Report explanation too long",
  })
}


    if (!postId || !reason) {
      return res.status(400).json({
        error: "postId and reason are required",
      })
    }

    const allowedReasons = [
      "NSFW_EXPOSURE",
      "MINOR_SAFETY",
      "HARASSMENT",
      "HATE",
      "VIOLENCE",
      "SPAM",
      "MISINFORMATION",
      "OTHER",
    ]

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        error: "Invalid report reason",
      })
    }

    /* ================================
       🚨 Determine criticality EARLY
       (used to bypass throttles)
    ================================= */
    const isCritical =
      reason === "MINOR_SAFETY" ||
      (reason === "NSFW_EXPOSURE" && isMinor)

    /* ================================
       🚫 Throttle unreliable reporters
       (never block critical)
    ================================= */
    if (
      !isCritical &&
      reporter.reportAccuracy !== null &&
      reporter.reportAccuracy < 0.3 &&
      reporter.lastReportAt &&
      new Date() - new Date(reporter.lastReportAt) <
        10 * 60 * 1000 // 10 minutes
    ) {
      return res.status(429).json({
        error: "You are temporarily rate-limited from reporting",
      })
    }

    /* ================================
       🔍 Ensure post exists
    ================================= */
    const post = await prisma.post.findUnique({
  where: { id: postId },
  select: { id: true, userId: true },
})

if (!post) {
  return res.status(404).json({
    error: "Post not found",
  })
}

// 🚫 Prevent self-reporting
if (post.userId === userId) {
  return res.status(400).json({
    error: "You cannot report your own post",
  })
}

    /* ================================
       🚫 Prevent duplicate reports
    ================================= */
    const existing = await prisma.report.findFirst({
      where: {
        reporterId: userId,
        postId,
      },
    })

    if (existing) {
      return res.status(400).json({
        error: "You have already reported this post",
      })
    }

    /* ================================
       📝 Create report (immutable)
    ================================= */
    await prisma.report.create({
      data: {
        reporterId: userId,
        postId,
        reason,
        context: context
  ? sanitizeHtml(context.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    })
  : null,
      },
    })

    /* ================================
       📊 Update reporter counters
    ================================= */
    await prisma.user.update({
      where: { id: userId },
      data: {
        reportsSubmitted: { increment: 1 },
        lastReportAt: new Date(),
      },
    })

    /* ================================
       🚨 CRITICAL AUTO-GUARDS
       (minor safety overrides trust)
    ================================= */
    if (isCritical) {
      await prisma.moderationAction.create({
        data: {
          postId,
          outcome: "LIMITED",
          note: "Auto-limited due to critical report",
        },
      })

      await prisma.moderationLog.create({
        data: {
          actorId: userId,
          actorType: "USER",
          action: "AUTO_LIMIT_POST",
          targetId: postId,
          reason,
        },
      })
    }

    return res.status(201).json({ success: true })
  } catch (err) {
    console.error("CREATE REPORT ERROR:", err)
    return res.status(500).json({
      error: "Failed to create report",
    })
  }
}
