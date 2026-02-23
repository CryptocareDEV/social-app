import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import { createReport } from "../controllers/report.controller.js"
import { enforceReportCooldown } from "../middleware/enforceReportCooldown.middleware.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"


const router = express.Router()

router.post(
  "/",
  requireAuth,
  enforceReportCooldown,
  rateLimit({ action: "REPORT_CREATE" }),
  createReport
)

export default router

