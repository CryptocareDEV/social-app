import express from "express"
import { toggleLike } from "../controllers/like.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/:postId", requireAuth, toggleLike)

export default router
