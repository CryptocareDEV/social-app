import prisma from "../lib/prisma.js"

const DECAY_DAYS = 30
const BASE_DECAY_STEP = 0.05

const SEVERITY_MULTIPLIER = {
  LOW: 1,
  MEDIUM: 0.6,
  HIGH: 0.3,
  CRITICAL: 0.1,
}

export const applyReportAccuracyDecayIfEligible = async (user) => {
  if (!user) return user

  // 🚫 Never heal banned users
  if (user.isBanned) return user

  // 🚫 Do not heal during reporter cooldown
  if (
    user.reportCooldownUntil &&
    new Date(user.reportCooldownUntil) > new Date()
  ) {
    return user
  }

  // ✅ Nothing to heal
  if (user.reportAccuracy >= 1) return user

  // ❗ Anchor strictly to last rejected report
  if (!user.lastRejectedAt) return user

  const now = new Date()
  const last = new Date(user.lastRejectedAt)

  const daysSince =
    (now.getTime() - last.getTime()) /
    (1000 * 60 * 60 * 24)

  const decaySteps = Math.floor(daysSince / DECAY_DAYS)
  if (decaySteps <= 0) return user

  const severity = user.lastRejectedSeverity || "LOW"
  const multiplier = SEVERITY_MULTIPLIER[severity] ?? 1

  const healedAccuracy = Math.min(
    1,
    user.reportAccuracy + decaySteps * BASE_DECAY_STEP * multiplier
  )

  if (healedAccuracy === user.reportAccuracy) return user

  return await prisma.user.update({
    where: { id: user.id },
    data: {
      reportAccuracy: healedAccuracy,
      lastRejectedAt: now, // reset decay anchor
    },
  })
}
