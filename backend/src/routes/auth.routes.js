import express from "express"
import { signup, login, me } from "../controllers/auth.controller.js"
import { requestPasswordReset } from "../controllers/auth.controller.js"
import { resetPassword } from "../controllers/auth.controller.js"
import { requireAuth } from "../middleware/auth.middleware.js"


const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/forgot-password", requestPasswordReset)
router.post("/reset-password", resetPassword)
router.get("/me", requireAuth, me)

export default router

