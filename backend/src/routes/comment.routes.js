import express from "express"
import { getCommentsForPost } from "../services/comment.service.js"
import { requireAuth } from "../middleware/auth.middleware.js"
import { createComment } from "../services/comment.service.js"


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

router.post("/", requireAuth, async (req, res) => {
  try {
    const { postId, body, mediaUrl, mediaType } = req.body

    if (!postId) {
      return res.status(400).json({ error: "postId is required" })
    }

    if (!body && !mediaUrl) {
      return res.status(400).json({
        error: "Comment must contain text or media",
      })
    }

    const comment = await createComment({
      postId,
      userId: req.user.userId,
      body,
      mediaUrl,
      mediaType,
    })

    res.json(comment)
  } catch (err) {
    console.error("Create comment failed:", err)
    res.status(500).json({ error: "Failed to create comment" })
  }
})


export default router

