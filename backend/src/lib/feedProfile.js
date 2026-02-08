import prisma from "./prisma.js"

const DEFAULT_PROFILE_NAME = "Default"

export const getActiveFeedProfile = async (userId) => {
  // 1️⃣ Try to find active profile
  let profile = await prisma.feedProfile.findFirst({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      preferences: true,
      name: true,
    },
  })

  if (profile) {
    return profile
  }

  // 2️⃣ Try to find default profile
  const defaultProfile = await prisma.feedProfile.findFirst({
    where: {
      userId,
      name: DEFAULT_PROFILE_NAME,
    },
  })

  if (defaultProfile) {
    // activate it
    await prisma.feedProfile.update({
      where: { id: defaultProfile.id },
      data: { isActive: true },
    })

    return {
      id: defaultProfile.id,
      preferences: defaultProfile.preferences,
      name: defaultProfile.name,
    }
  }

  // 3️⃣ Create default profile (last resort)
  const created = await prisma.feedProfile.create({
    data: {
      userId,
      name: DEFAULT_PROFILE_NAME,
      isActive: true,
      preferences: {
        nsfw: {
          posts: "HIDE",
          communities: {
            inFeeds: false,
            onProfile: false,
          },
        },
        labels: {
          GLOBAL: [],
          COUNTRY: [],
          LOCAL: [],
        },
        ordering: "RECENT",
      },
    },
  })

  return {
    id: created.id,
    preferences: created.preferences,
    name: created.name,
  }
}
