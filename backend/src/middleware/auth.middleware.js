import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"
import { applyStrikeDecayIfEligible } from "../lib/strikeDecay.js"
import { applyReportAccuracyDecayIfEligible } from "../lib/reportAccuracyDecay.js"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined")
}

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
const superuserRole = superuser?.role || null

/* ================================
   👑 Root authority detection
================================ */
const isRoot =
  user.email === process.env.PLATFORM_OWNER_EMAIL



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
   🧠 Apply decay once (ordered)
================================ */
user = await applyStrikeDecayIfEligible(user)
user = await applyReportAccuracyDecayIfEligible(user)


    /* ================================
       ✅ Attach safe user object
       (NO enforcement here)
    ================================= */
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      countryCode: user.countryCode,
      regionCode: user.regionCode,

      // safety flags
      isRoot,
      isSuperuser,
      superuserRole,
      isMinor,


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
