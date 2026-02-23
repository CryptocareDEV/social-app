import express from "express"
import prisma from "../lib/prisma.js"

import {
  getUserProfile,
  getUserPosts,
  getMe,
  getMyInvitations,
  updateMe,
  getUserCommunities,
} from "../controllers/user.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

// ✅ AUTH-SCOPED ROUTES FIRST
router.get(
  "/me",
  requireAuth,
  (req, res, next) => {
    res.set("Cache-Control", "no-store")
    next()
  },
  getMe
)
router.patch("/me", requireAuth, updateMe)

router.get("/me/invitations", requireAuth, getMyInvitations)

// ✅ GENERIC USER ROUTES LAST
router.get(
  "/lookup/:email",
  requireAuth,
  async (req, res) => {
    try {
      const { email } = req.params

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: "User not found" })
      }

      return res.json(user)
    } catch (err) {
      console.error("LOOKUP ERROR:", err)
      return res.status(500).json({ error: "Lookup failed" })
    }
  }
)

router.get("/:id/posts", requireAuth, getUserPosts)
router.get("/:id", getUserProfile)
router.get("/:id/communities", requireAuth, getUserCommunities)


export default router
