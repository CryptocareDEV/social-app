import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  getCommunityChat,
  postCommunityMessage,
} from "../controllers/communityChat.controller.js"


const router = express.Router()

router.get("/:id/chat", requireAuth, getCommunityChat)
router.post("/:id/chat", requireAuth, postCommunityMessage)


export default router

