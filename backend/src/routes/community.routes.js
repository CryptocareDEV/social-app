import express from "express"
import {
  createCommunity,
  getCommunityFeed,
  createCommunityInvitation,
  getCommunityMembers,
  getMyCommunities,
  getCommunityById,
} from "../controllers/community.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"
import { removeCommunityMember } from "../controllers/community.controller.js"
import { changeCommunityMemberRole } from "../controllers/community.controller.js"
import { deleteCommunity } from "../controllers/community.controller.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"
import { materializeCommunityNow } from "../controllers/community.controller.js"
import { updateCommunityCategories } from "../controllers/community.controller.js"
import {
  acceptCommunityInvitation,
  declineCommunityInvitation,
  getMyInvitations,
} from "../controllers/community.controller.js"
import {
  revokeCommunityInvitation,
} from "../controllers/community.controller.js"
import {
  getCommunityInvitations,
} from "../controllers/community.controller.js"





const router = express.Router()

router.post("/", requireAuth, createCommunity)
router.post(
  "/:id/materialize",
  requireAuth,
  materializeCommunityNow
)
router.get(
  "/:id/invitations",
  requireAuth,
  getCommunityInvitations
)
router.get("/my", requireAuth, getMyCommunities)
router.get(
  "/:id/feed",
  requireAuth,
  rateLimit({ windowMs: 10_000, max: 20 }),
  getCommunityFeed
)
router.get("/:id", requireAuth, getCommunityById)
router.post(
  "/invitations/:id/revoke",
  requireAuth,
  revokeCommunityInvitation
)
router.get(
  "/invitations/my",
  requireAuth,
  getMyInvitations
)

router.post(
  "/invitations/:id/accept",
  requireAuth,
  acceptCommunityInvitation
)

router.post(
  "/invitations/:id/decline",
  requireAuth,
  declineCommunityInvitation
)

router.post(
  "/:id/invitations",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 10 }),
  createCommunityInvitation
)
router.patch(
  "/:id/categories",
  requireAuth,
  updateCommunityCategories
)
router.get("/:id/members", requireAuth, getCommunityMembers)
router.post("/:id/members/:userId/remove", requireAuth, removeCommunityMember)
router.post("/:id/members/:userId/role", requireAuth, changeCommunityMemberRole)
router.delete("/:id", requireAuth, deleteCommunity)




export default router

