import prisma from "../lib/prisma.js"

export const applyReporterCooldownIfNeeded = async (user) => {
  if (!user) return
  if (user.isBanned) return
  if (user.reportAccuracy >= 0.7) return

  const now = new Date()

  // 🛡 Minors are never rate-limited
  if (user.dateOfBirth) {
    const age =
      now.getFullYear() -
      new Date(user.dateOfBirth).getFullYear()

    if (age < 18) return
  }

  let cooldownDays = 0

  if (user.reportAccuracy < 0.2 && user.reportsSubmitted >= 12) {
    cooldownDays = 30
  } else if (
    user.reportAccuracy < 0.3 &&
    user.reportsSubmitted >= 8
  ) {
    cooldownDays = 7
  } else if (
    user.reportAccuracy < 0.5 &&
    user.reportsSubmitted >= 5
  ) {
    cooldownDays = 1
  }

  if (cooldownDays === 0) return

  const cooldownUntil = new Date(
    now.getTime() + cooldownDays * 24 * 60 * 60 * 1000
  )

  // ⛔ Do not shorten an existing longer cooldown
  if (user.cooldownUntil && user.cooldownUntil > cooldownUntil) {
    return
  }

  await prisma.user.update({
  where: { id: user.id },
  data: { reportCooldownUntil: cooldownUntil },
})

}

