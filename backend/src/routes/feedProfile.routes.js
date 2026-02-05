import express from "express"
import {
  getMyFeedProfiles,
  createFeedProfile,
  activateFeedProfile,
  updateFeedProfile,
  deleteFeedProfile,
} from "../controllers/feedProfile.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

// 🔑 All feed profile actions are auth-only
router.get("/me/feed-profiles", requireAuth, getMyFeedProfiles)
router.post("/me/feed-profiles", requireAuth, createFeedProfile)
router.post(
  "/me/feed-profiles/:id/activate",
  requireAuth,
  activateFeedProfile
)
router.patch(
  "/me/feed-profiles/:id",
  requireAuth,
  updateFeedProfile
)
router.delete(
  "/me/feed-profiles/:id",
  requireAuth,
  deleteFeedProfile
)


export default router
