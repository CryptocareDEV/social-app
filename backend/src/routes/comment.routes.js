import express from "express"
import prisma from "../lib/prisma.js"
import { getCommentsForPost, createComment, getRepliesForComment } from "../services/comment.service.js"
import { requireAuth } from "../middleware/auth.middleware.js"


const router = express.Router()

router.get("/", async (req, res) => {
  const { postId, cursor } = req.query

  if (!postId) {
    return res.status(400).json({ error: "postId is required" })
  }

  try {
    const data = await getCommentsForPost({
      postId,
      cursor,
    })

    res.json(data)
  } catch (err) {
    console.error("Failed to load comments", err)
    res.status(500).json({ error: "Failed to load comments" })
  }
})

router.get("/replies", async (req, res) => {
  const { parentCommentId, cursor } = req.query

  if (!parentCommentId) {
    return res.status(400).json({ error: "parentCommentId is required" })
  }

  try {
    const data = await getRepliesForComment({
      parentCommentId,
      cursor,
    })

    res.json(data)
  } catch (err) {
    console.error("Failed to load replies", err)
    res.status(500).json({ error: "Failed to load replies" })
  }
})



router.post("/", requireAuth, async (req, res) => {
  try {
    const { postId, body, mediaUrl, mediaType, parentCommentId } = req.body

    if (!postId) {
      return res.status(400).json({ error: "postId is required" })
    }

    if (!body && !mediaUrl) {
      return res.status(400).json({
        error: "Comment must contain text or media",
      })
    }

    // 🔐 If replying, validate parent comment
    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { postId: true },
      })

      if (!parent) {
        return res.status(400).json({ error: "Parent comment not found" })
      }

      if (parent.postId !== postId) {
        return res.status(400).json({ error: "Invalid parent comment" })
      }
    }

    const comment = await createComment({
      postId,
      userId: req.user.userId,
      body,
      mediaUrl,
      mediaType,
      parentCommentId: parentCommentId || null,
    })

    res.json(comment)
  } catch (err) {
    console.error("Create comment failed:", err)
    res.status(500).json({ error: "Failed to create comment" })
  }
})



export default router

