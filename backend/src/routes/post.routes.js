import express from "express"
import {
  createPost,
  getFeed,
  getScopedFeed,
  getPostsByLabel,
  getPostOrigin,
} from "../controllers/post.controller.js"
import { enforceUserStatus } from "../middleware/enforcement.middleware.js"
import { enforceCooldown } from "../middleware/enforceCooldown.middleware.js"



import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/label/:key", requireAuth, getPostsByLabel)
router.post("/", requireAuth, enforceUserStatus, enforceCooldown, createPost)
router.get("/feed", requireAuth, getFeed)
router.get("/feed/:scope", requireAuth, getScopedFeed)
router.get("/:id/origin", requireAuth, getPostOrigin)





export default router

