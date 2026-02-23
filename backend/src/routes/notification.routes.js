import express from "express"
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js"

import { requireAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/", requireAuth, getNotifications)
router.patch("/read-all", requireAuth, markAllNotificationsRead)
router.patch("/:id/read", requireAuth, markNotificationRead)

export default router
