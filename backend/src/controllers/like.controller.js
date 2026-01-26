import prisma from "../lib/prisma.js"
import { reRankCommunitiesForPost } from "../services/communityFeedTrigger.service.js"

export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId
    
    if (!postId) {
      return res.status(400).json({ error: "Post ID required" })
    }


    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    // UNLIKE
    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      })

      // 🔥 trigger same-day re-ranking
      await reRankCommunitiesForPost(postId)

      return res.json({ liked: false })
    }

    // LIKE
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    })

    // 🔥 trigger same-day re-ranking
    await reRankCommunitiesForPost(postId)

    return res.json({ liked: true })
  } catch (err) {
    console.error("LIKE ERROR:", err)
    return res.status(500).json({ error: err.message })
  }
}
