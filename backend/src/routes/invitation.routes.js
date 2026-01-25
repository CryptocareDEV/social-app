import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  acceptInvitation,
  revokeInvitation,
} from "../controllers/invitation.controller.js"

const router = express.Router()

router.post("/:id/accept", requireAuth, acceptInvitation)
router.post("/:id/revoke", requireAuth, revokeInvitation)

export default router
