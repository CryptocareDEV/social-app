import express from "express"
import {
  createCommunity,
  getCommunityFeed,
  createCommunityInvitation,
  getCommunityMembers,
  getMyCommunities,
  getCommunityById,
  addCommunityLabelImport,
  leaveCommunity,
} from "../controllers/community.controller.js"
import {
  applyCommunityModerationAction,
} from "../controllers/communityModeration.controller.js"

import { requireAuth } from "../middleware/auth.middleware.js"
import { removeCommunityMember } from "../controllers/community.controller.js"
import { changeCommunityMemberRole } from "../controllers/community.controller.js"
import { deleteCommunity } from "../controllers/community.controller.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"
import { materializeCommunityNow } from "../controllers/community.controller.js"
import { updateCommunityCategories } from "../controllers/community.controller.js"
import {
  getCommunityChat,
  postCommunityMessage,
} from "../controllers/communityChat.controller.js"
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
import { enforceUserStatus } from "../middleware/enforcement.middleware.js"
import {
  getCommunityModerationReports,
} from "../controllers/communityModeration.controller.js"
import { updateCommunityIntention } from "../controllers/community.controller.js"





const router = express.Router()

router.post("/", requireAuth, enforceUserStatus, createCommunity)
router.post(
  "/:id/materialize",
  requireAuth,
  enforceUserStatus,
  materializeCommunityNow
)
router.get(
  "/:id/invitations",
  requireAuth,
  getCommunityInvitations
)
router.post(
  "/:id/moderation/actions",
  requireAuth,
  applyCommunityModerationAction
)
router.get(
  "/:id/moderation/reports",
  requireAuth,
  getCommunityModerationReports
)

router.patch(
  "/:id/intention",
  requireAuth,
  updateCommunityIntention
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
  "/:id/label-imports",
  requireAuth,
  addCommunityLabelImport
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
  enforceUserStatus,
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
router.post("/:id/leave", requireAuth, leaveCommunity)
router.get("/:id/chat", requireAuth, getCommunityChat)
router.post("/:id/chat", requireAuth, postCommunityMessage)






export default router

