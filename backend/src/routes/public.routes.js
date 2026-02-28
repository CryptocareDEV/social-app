import express from "express"
import { getPublicGlobalFeed } from "../controllers/public.controller.js"

const router = express.Router()

router.get("/global", getPublicGlobalFeed)

export default router
