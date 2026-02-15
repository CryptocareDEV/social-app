import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import { createReport } from "../controllers/report.controller.js"
import { enforceReportCooldown } from "../middleware/enforceReportCooldown.middleware.js"



const router = express.Router()

router.post(
  "/",
  requireAuth,
  enforceReportCooldown,
  createReport
)

export default router

