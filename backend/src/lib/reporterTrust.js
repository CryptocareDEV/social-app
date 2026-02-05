import prisma from "../lib/prisma.js"

export const recomputeReportAccuracy = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      reportsSubmitted: true,
      reportsConfirmed: true,
    },
  })

  if (!user) return

  const accuracy =
    user.reportsConfirmed / Math.max(1, user.reportsSubmitted)

  await prisma.user.update({
    where: { id: userId },
    data: {
      reportAccuracy: Math.min(1, Math.max(0, accuracy)),
    },
  })
}

