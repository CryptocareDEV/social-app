// backend/src/lib/strikeDecay.js
import prisma from "../lib/prisma.js"

const STRIKE_DECAY_DAYS = 60

export const applyStrikeDecayIfEligible = async (user) => {
  if (!user) return user
  if (user.isBanned) return user
  if (!user.strikeUpdatedAt) return user
  if (user.nsfwStrikes <= 0) return user
  // ❗ Do NOT decay while user is on cooldown
  if (
  user.cooldownUntil &&
  new Date(user.cooldownUntil) > new Date()
) {
  return user
}


  const now = new Date()
  const last = new Date(user.strikeUpdatedAt)

  const daysSince =
    (now.getTime() - last.getTime()) /
    (1000 * 60 * 60 * 24)

  // Not enough time passed → no decay
  if (daysSince < STRIKE_DECAY_DAYS) {
    return user
  }

  // Decay exactly ONE strike per interaction
  const newStrikes = Math.max(0, user.nsfwStrikes - 1)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      nsfwStrikes: newStrikes,
      strikeUpdatedAt: now, // reset decay clock
    },
  })

  return updated
}
