import prisma from "../lib/prisma.js"

import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  getMyProfile,
  getFeedProfiles,
  getFeedProfileById,
  createFeedProfile,
  updateFeedProfile,
  activateFeedProfile,
  deleteFeedProfile,
} from "../controllers/profile.controller.js"

const router = express.Router()

router.get("/me", requireAuth, getMyProfile)

// GET /api/v1/feed-profiles
router.get(
  "/feed-profiles",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.userId
      
      const profiles = await prisma.feedProfile.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "asc" },
      })

      return res.json(profiles)
    } catch (err) {
      console.error("FEED PROFILES ERROR:", err)
      return res.status(500).json({ error: "Failed to load feed profiles" })
    }
  }
)
router.get("/me/feed-profiles/:id", requireAuth, getFeedProfileById)
router.post("/me/feed-profiles", requireAuth, createFeedProfile)
router.patch("/me/feed-profiles/:id", requireAuth, updateFeedProfile)
router.post("/me/feed-profiles/:id/activate", requireAuth, activateFeedProfile)
router.delete("/me/feed-profiles/:id", requireAuth, deleteFeedProfile)

export default router

