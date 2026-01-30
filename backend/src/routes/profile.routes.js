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

router.get("/me/feed-profiles", requireAuth, getFeedProfiles)
router.get("/me/feed-profiles/:id", requireAuth, getFeedProfileById)
router.post("/me/feed-profiles", requireAuth, createFeedProfile)
router.patch("/me/feed-profiles/:id", requireAuth, updateFeedProfile)
router.post("/me/feed-profiles/:id/activate", requireAuth, activateFeedProfile)
router.delete("/me/feed-profiles/:id", requireAuth, deleteFeedProfile)

export default router

