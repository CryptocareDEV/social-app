import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  getModerationReports,
} from "../controllers/moderation.controller.js"
import { applyModerationAction } from "../controllers/moderation.controller.js"
import { enforceCooldown } from "../middleware/enforceCooldown.middleware.js"



const router = express.Router()

router.get("/reports", requireAuth, getModerationReports)
router.post("/actions", requireAuth, enforceCooldown, applyModerationAction)

export default router

