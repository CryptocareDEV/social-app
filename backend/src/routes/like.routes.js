import express from "express"
import { toggleLike } from "../controllers/like.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"

const router = express.Router()

router.post(
  "/:postId",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 30 }),
  toggleLike
)


export default router
