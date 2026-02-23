import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  getModerationReports,
} from "../controllers/moderation.controller.js"
import { applyModerationAction } from "../controllers/moderation.controller.js"
import { requireSuperuserRole } from "../middleware/requireSuperuserRole.middleware.js"



const router = express.Router()

router.get(
  "/reports",
  requireAuth,
  requireSuperuserRole(["MODERATOR", "ADMIN", "LEGAL"]),
  getModerationReports
)

router.post(
  "/actions",
  requireAuth,
  requireSuperuserRole(["MODERATOR", "ADMIN"]),
  applyModerationAction
)


export default router

