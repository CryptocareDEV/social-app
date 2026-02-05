import prisma from "../lib/prisma.js"

/**
 * POST /api/v1/communities/:id/moderation/actions
 * Community-scoped moderation
 */
export const applyCommunityModerationAction = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const { postId, outcome, note } = req.body
    const userId = req.user.userId

    /* =========================
       1️⃣ Basic validation
    ========================= */
    if (!postId || !outcome) {
      return res.status(400).json({
        error: "postId and outcome are required",
      })
    }

    const allowedOutcomes = ["LIMITED", "REMOVED", "ESCALATED"]
    if (!allowedOutcomes.includes(outcome)) {
      return res.status(400).json({
        error: "Invalid moderation outcome",
      })
    }

    /* =========================
       2️⃣ Verify role in community
    ========================= */
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        role: { in: ["ADMIN", "MODERATOR"] },
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "Not authorized to moderate this community",
      })
    }

    /* =========================
       3️⃣ Load post & scope check
    ========================= */
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        communityId: true,
        rating: true,
      },
    })

    if (!post || post.communityId !== communityId) {
      return res.status(404).json({
        error: "Post not found in this community",
      })
    }

    /* =========================
       4️⃣ NSFW safety override
    ========================= */
    let finalOutcome = outcome

    if (post.rating === "NSFW") {
      // Community mods cannot decide NSFW
      finalOutcome = "ESCALATED"
    }

    /* =========================
       5️⃣ Record moderation action
    ========================= */
    await prisma.moderationAction.create({
      data: {
        postId,
        outcome: finalOutcome,
        note: note?.trim() || null,
      },
    })

    /* =========================
       6️⃣ Audit log (critical)
    ========================= */
    await prisma.moderationLog.create({
      data: {
        actorId: userId,
        actorType: "MODERATOR",
        action: `COMMUNITY_${finalOutcome}`,
        targetId: postId,
        reason: note || null,
      },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("COMMUNITY MODERATION ERROR:", err)
    return res.status(500).json({
      error: "Failed to apply community moderation",
    })
  }
}

/**
 * GET /api/v1/communities/:id/moderation/reports
 * Community-scoped reports (MODERATOR / ADMIN only)
 */
export const getCommunityModerationReports = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const userId = req.user.userId

    /* =========================
       1️⃣ Verify community role
    ========================= */
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        role: { in: ["ADMIN", "MODERATOR"] },
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "Not authorized to view moderation reports",
      })
    }

    /* =========================
       2️⃣ Fetch reports (community only)
    ========================= */
    const reports = await prisma.report.findMany({
      where: {
        post: {
          communityId,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            isRemoved: true,
            rating: true,
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
    console.error("GET COMMUNITY MOD REPORTS ERROR:", err)
    return res.status(500).json({
      error: "Failed to load community moderation reports",
    })
  }
}
