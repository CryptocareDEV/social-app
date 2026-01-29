import prisma from "../lib/prisma.js"

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY

export const applyNsfwStrike = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return

  const strikes = user.nsfwStrikes + 1

  let cooldownUntil = null
  let isBanned = false

  if (strikes === 1) {
    // ⚠️ Warning cooldown
    cooldownUntil = new Date(Date.now() + 15 * MINUTE)
  } else if (strikes === 2) {
    // ⏱ 24h cooldown
    cooldownUntil = new Date(Date.now() + DAY)
  } else if (strikes === 3) {
    // 🚫 1 week ban
    cooldownUntil = new Date(Date.now() + WEEK)
  } else if (strikes === 4) {
    // 🚫 1 month ban
    cooldownUntil = new Date(Date.now() + MONTH)
  } else if (strikes >= 5) {
    // ⛔ Permanent ban
    isBanned = true
    cooldownUntil = null
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      nsfwStrikes: strikes,
      cooldownUntil,
      isBanned,
    },
  })
}
