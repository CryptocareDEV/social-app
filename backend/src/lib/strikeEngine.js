// backend/src/lib/strikeEngine.js

import prisma from "../lib/prisma.js"

export const applyStrikes = async ({ userId, outcome, reason = null }) => {
  let strikeDelta = 0

  if (outcome === "LIMITED") strikeDelta = 1
  if (outcome === "REMOVED") strikeDelta = 2
  if (outcome === "ESCALATED") strikeDelta = 3

  // NO_ACTION or unknown → no-op
  if (strikeDelta === 0) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.isBanned) return

  const newStrikes = user.nsfwStrikes + strikeDelta
  const now = new Date()

  const update = {
    nsfwStrikes: newStrikes,
    strikeUpdatedAt: now, // 🔴 REQUIRED for decay
  }

  // ⚠️ Escalation ladder (agreed policy)
  if (newStrikes === 3) {
    update.cooldownUntil = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 // 24h
    )
  } else if (newStrikes === 4) {
    update.cooldownUntil = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000 // 7 days
    )
  } else if (newStrikes === 5) {
    update.cooldownUntil = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000 // 30 days
    )
  } else if (newStrikes >= 6) {
    update.isBanned = true
    update.cooldownUntil = null
  }

  await prisma.user.update({
    where: { id: userId },
    data: update,
  })
}
