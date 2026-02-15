import express from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import { requireSuperuserRole } from "../middleware/requireSuperuserRole.middleware.js"
import {
  listSuperusers,
  promoteToSuperuser,
  changeSuperuserRole,
  demoteSuperuser,
  resetUserEnforcement,
  getSystemHealth,
  getEnforcementUsers,
} from "../controllers/superuser.controller.js"

const router = express.Router()

/* ================================
   👑 List all superusers
================================ */
router.get(
  "/",
  requireAuth,
  requireSuperuserRole(["ADMIN"]), // ROOT overrides
  listSuperusers
)

/* ================================
   ⬆ Promote user to superuser
================================ */
router.post(
  "/promote",
  requireAuth,
  requireSuperuserRole(["ADMIN"]),
  promoteToSuperuser
)

/* ================================
   🔄 Change superuser role
================================ */
router.patch(
  "/:userId/role",
  requireAuth,
  requireSuperuserRole(["ADMIN"]),
  changeSuperuserRole
)

/* ================================
   ⬇ Demote superuser
================================ */
router.delete(
  "/:userId",
  requireAuth,
  requireSuperuserRole(["ADMIN"]),
  demoteSuperuser
)

/* ================================
   🛠 Override user enforcement
================================ */
router.post(
  "/user/:userId/reset",
  requireAuth,
  requireSuperuserRole(["ADMIN", "LEGAL"]),
  resetUserEnforcement
)


router.get(
  "/system-health",
  requireAuth,
  requireSuperuserRole(["ADMIN"]),
  getSystemHealth
)

router.get(
  "/enforcement-users",
  requireAuth,
  requireSuperuserRole(["MODERATOR", "ADMIN", "LEGAL"]),
  getEnforcementUsers
)


export default router

