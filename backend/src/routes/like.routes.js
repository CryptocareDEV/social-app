import express from "express"
import { toggleLike } from "../controllers/like.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"
import { enforceUserStatus } from "../middleware/enforcement.middleware.js"
const router = express.Router()

router.post(
  "/:postId",
  requireAuth,
  enforceUserStatus,
  rateLimit({ action: "LIKE_TOGGLE" }),
  toggleLike
)


export default router
