import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

/**
 * 🔞 Derive minor status from date of birth
 * A user is a minor until the exact moment they turn 18
 */
const isMinorFromDob = (dateOfBirth) => {
  if (!dateOfBirth) return true // fail-safe
  const now = new Date()
  const dob = new Date(dateOfBirth)

  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()

  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--
  }

  return age < 18
}


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

    /* ================================
       🔞 AGE DERIVATION (HARD TRUTH)
    ================================= */

    const isMinor = isMinorFromDob(user.dateOfBirth)

    // ✅ Attach safe, derived user object
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isMinor, // 🚨 derived, never stored
    }

    next()
  } catch (err) {
    console.error("AUTH ERROR:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
