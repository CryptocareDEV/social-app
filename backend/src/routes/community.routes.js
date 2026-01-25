import express from "express"
import {
  createCommunity,
  getCommunityFeed,
  createCommunityInvitation,
  getCommunityMembers,
} from "../controllers/community.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"
import { removeCommunityMember } from "../controllers/community.controller.js"
import { changeCommunityMemberRole } from "../controllers/community.controller.js"
import { deleteCommunity } from "../controllers/community.controller.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"



const router = express.Router()

router.post("/", requireAuth, createCommunity)
router.get(
  "/:id/feed",
  requireAuth,
  rateLimit({ windowMs: 10_000, max: 20 }),
  getCommunityFeed
)
router.post(
  "/:id/invitations",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 10 }),
  createCommunityInvitation
)
router.get("/:id/members", requireAuth, getCommunityMembers)
router.post("/:id/members/:userId/remove", requireAuth, removeCommunityMember)
router.post("/:id/members/:userId/role", requireAuth, changeCommunityMemberRole)
router.delete("/:id", requireAuth, deleteCommunity)




export default router

