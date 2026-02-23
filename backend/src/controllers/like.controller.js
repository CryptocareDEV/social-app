import prisma from "../lib/prisma.js"
import { reRankCommunitiesForPost } from "../services/communityFeedTrigger.service.js"

export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId

    if (!postId) {
      return res.status(400).json({ error: "Post ID required" })
    }

    // 🚫 Prevent liking your own post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    })

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    if (post.userId === userId) {
      return res.status(400).json({
        error: "You cannot like your own post",
      })
    }

    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    let liked

    if (existing) {
      // UNLIKE
      await prisma.like.delete({
        where: { id: existing.id },
      })
      liked = false
        } else {
      // LIKE
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      })

      // 🔔 Create notification for post owner
      await prisma.notification.create({
        data: {
          recipientId: post.userId,
          actorId: userId,
          postId: postId,
          type: "LIKE_POST",
        },
      })

      liked = true
    }

    // 🔥 re-rank communities (same-day signal)
    await reRankCommunitiesForPost(postId)

    // 🔢 canonical count
    const likeCount = await prisma.like.count({
      where: { postId },
    })

    return res.json({
      liked,
      likeCount,
    })
  } catch (err) {
  if (err?.cooldownUntil) {
    await refreshUserState?.()
  }

  alert(err?.error || "Action failed")
}
}
