import express from "express"
import {
  createPost,
  getFeed,
  getScopedFeed,
} from "../controllers/post.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/", requireAuth, createPost)
router.get("/feed", getFeed)
router.get("/feed/:scope", getScopedFeed)


export default router

