import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import {
  getAllCategories,
  createCategory,
} from "../controllers/category.controller.js"

const router = express.Router()

router.get("/", requireAuth, getAllCategories)
router.post("/", requireAuth, createCategory)

export default router
