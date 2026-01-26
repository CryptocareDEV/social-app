import express from "express"
import {
  getUserProfile,
  getUserPosts,
  getMe,
  getMyInvitations,
} from "../controllers/user.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"


const router = express.Router()

router.get("/me", requireAuth, (req, res, next) => {
  res.set("Cache-Control", "no-store")
  next()
}, getMe)
router.get("/:id", getUserProfile)
router.get("/:id/posts", getUserPosts)
router.get("/me/invitations", requireAuth, getMyInvitations)


export default router

