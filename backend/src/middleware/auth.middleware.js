import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"
import { applyStrikeDecayIfEligible } from "../lib/strikeDecay.js"
import { applyReportAccuracyDecayIfEligible } from "../lib/reportAccuracyDecay.js"

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" })
    }

    const token = header.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    /* ================================
       🔎 Load user
    ================================= */
    let user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    // 2️⃣ Heal report accuracy (trust decay)
const accuracyDecayedUser =
  await applyReportAccuracyDecayIfEligible(user)

// 3️⃣ Heal strikes
const fullyDecayedUser =
  await applyStrikeDecayIfEligible(accuracyDecayedUser)

    /* ================================
       🔐 Permanent ban (hard stop)
    ================================= */
    if (user.isBanned) {
      return res.status(403).json({
        error: "Your account is permanently banned",
      })
    }

    /* ================================
       🧠 Superuser detection
    ================================= */
    const superuser = await prisma.superuser.findUnique({
      where: { userId: user.id },
    })

    const isSuperuser = !!superuser

    /* ================================
       🧮 Derive minor status
    ================================= */
    const now = new Date()
    let isMinor = true

    if (user.dateOfBirth) {
      const dob = new Date(user.dateOfBirth)
      let age = now.getFullYear() - dob.getFullYear()
      const m = now.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        age--
      }
      isMinor = age < 18
    }

    /* ================================
       ⏳ Lazy strike decay
    ================================= */
    user = await applyStrikeDecayIfEligible(user)

    /* ================================
       📊 Lazy report accuracy decay
    ================================= */
    user = await applyReportAccuracyDecayIfEligible(user)

    /* ================================
       ✅ Attach safe user object
       (NO enforcement here)
    ================================= */
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,

      // safety flags
      isMinor,
      isSuperuser,

      // enforcement state (read-only)
      cooldownUntil: user.cooldownUntil,
      nsfwStrikes: user.nsfwStrikes,
      reportAccuracy: user.reportAccuracy,
      reportCooldownUntil: user.reportCooldownUntil,
    }

    next()
  } catch (err) {
    console.error("AUTH ERROR:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
