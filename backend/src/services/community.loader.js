import prisma from "../lib/prisma.js"

/**
 * Always load a community with everything needed
 * for feed materialization & label logic.
 */
export const loadCommunityWithCategories = async (communityId) => {
  return prisma.community.findUnique({
    where: { id: communityId },
    include: {
      categories: true,
    },
  })
}

