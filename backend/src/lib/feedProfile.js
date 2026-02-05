import prisma from "./prisma.js"

export const getActiveFeedProfile = async (userId) => {
  const profile = await prisma.feedProfile.findFirst({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      preferences: true,
    },
  })

  if (!profile) return null

  console.log("🧠 RAW FEED PROFILE FROM DB:", profile)

  return profile
}


