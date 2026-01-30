import prisma from "./prisma.js"

export const getActiveFeedProfile = async (userId) => {
  return prisma.feedProfile.findFirst({
    where: {
      userId,
      isActive: true,
    },
  })
}

