import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
} from "../controllers/invitation.controller.js"

const router = express.Router()

// 👤 Invited user: list my invitations
router.get("/my", requireAuth, getMyInvitations)

// ✅ Invited user: accept
router.post("/:id/accept", requireAuth, acceptInvitation)

// ❌ Invited user: decline
router.post("/:id/decline", requireAuth, declineInvitation)

// 🛑 Admin / inviter: revoke
router.post("/:id/revoke", requireAuth, revokeInvitation)

export default router
