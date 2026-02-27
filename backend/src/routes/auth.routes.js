import express from "express"
import { signup, login, me, googleLogin } from "../controllers/auth.controller.js"
import { requestPasswordReset } from "../controllers/auth.controller.js"
import { resetPassword } from "../controllers/auth.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"
import { completeProfile } from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/google", googleLogin)
router.post("/forgot-password", requestPasswordReset)
router.post("/reset-password", resetPassword)
router.get("/me", requireAuth, me)
router.patch("/complete-profile", requireAuth, completeProfile)

export default router

