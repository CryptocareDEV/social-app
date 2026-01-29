// backend/src/middleware/auth.middleware.js

import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" })
    }

    const token = header.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 🔎 Load user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    /* ================================
       🔒 ENFORCEMENT RULES
    ================================= */

    // ⛔ Permanent ban
    if (user.isBanned) {
      return res.status(403).json({
        error: "Your account is permanently banned",
      })
    }

    // ⏱ Cooldown / temporary ban
    if (
      user.cooldownUntil &&
      new Date(user.cooldownUntil) > new Date()
    ) {
      return res.status(403).json({
        error: "You are on cooldown",
        cooldownUntil: user.cooldownUntil,
      })
    }

    /* ================================ */

    // ✅ Attach safe user object
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
    }

    next()
  } catch (err) {
    console.error("AUTH ERROR:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
