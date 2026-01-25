import express from "express"
import {
  createCommunity,
  getCommunityFeed,
  createCommunityInvitation,
} from "../controllers/community.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"


const router = express.Router()

router.post("/", requireAuth, createCommunity)
router.get("/:id/feed", requireAuth, getCommunityFeed)
router.post("/:id/invitations", requireAuth, createCommunityInvitation)



export default router

