import express from "express"
import {
  createPost,
  getFeed,
  getScopedFeed,
  getPostsByLabel,
} from "../controllers/post.controller.js"
import { enforceUserStatus } from "../middleware/enforcement.middleware.js"

import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/label/:key", requireAuth, getPostsByLabel)
router.post("/", requireAuth, enforceUserStatus, createPost)
router.get("/feed", getFeed)
router.get("/feed/:scope", getScopedFeed)



export default router

