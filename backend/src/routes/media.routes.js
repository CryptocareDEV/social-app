import express from "express"
import { proxyImage } from "../controllers/media.controller.js"
//import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

// 🔑 Same-origin image proxy for canvas-safe rendering
router.get("/proxy", proxyImage)

export default router

