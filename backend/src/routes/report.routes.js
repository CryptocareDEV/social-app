import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import { createReport } from "../controllers/report.controller.js"
import { enforceCooldown } from "../middleware/enforceCooldown.middleware.js"


const router = express.Router()

router.post(
  "/",
  requireAuth,
  enforceCooldown,
  createReport
)

export default router

