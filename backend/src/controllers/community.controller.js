import prisma from "../lib/prisma.js"

export const createCommunity = async (req, res) => {
  try {
    const { name, intention, scope, categories = [] } = req.body
    const userId = req.user.userId

    if (!name || !intention || !scope) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const community = await prisma.$transaction(async (tx) => {
      const community = await tx.community.create({
        data: {
          name,
          intention,
          scope,
          createdBy: userId,
          categories: {
            create: categories.map((key) => ({
              categoryKey: key,
            })),
          },
        },
      })

      await tx.communityMember.create({
        data: {
          communityId: community.id,
          userId,
          role: "ADMIN",
        },
      })

      return community
    })

    return res.status(201).json(community)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to create community" })
  }
}

export const getCommunityFeed = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const community = await prisma.community.findUnique({
      where: { id },
      include: { categories: true },
    })

    if (!community) {
      return res.status(404).json({ error: "Community not found" })
    }


    const membership = await prisma.communityMember.findFirst({
  where: {
    communityId: id,
    userId: userId,
  },
})



if (!membership) {
  return res.status(403).json({
    error: "You are not a member of this community",
  })
}
    const categoryKeys = community.categories.map((c) => c.categoryKey)
    const posts = await prisma.post.findMany({
      where: {
        scope: community.scope,
        categories: {
          some: {
            categoryKey: { in: categoryKeys },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    res.json(posts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch community feed" })
  }
}
export const createCommunityInvitation = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const invitedUserId = req.body.userId
    const invitedById = req.user.userId

    if (!invitedUserId) {
      return res.status(400).json({ error: "invited userId required" })
    }

    const inviterMembership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: invitedById,
      },
    })

    if (!inviterMembership) {
      return res.status(403).json({ error: "Not a community member" })
    }

    const invitedUser = await prisma.user.findUnique({
      where: { id: invitedUserId },
    })

    if (!invitedUser) {
      return res.status(404).json({ error: "Invited user not found" })
    }

    const existingMembership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: invitedUserId,
      },
    })

    if (existingMembership) {
      return res.status(400).json({ error: "User already a member" })
    }

    const invitation = await prisma.communityInvitation.create({
      data: {
        communityId,
        invitedById,
        invitedUserId,
      },
    })

    return res.status(201).json(invitation)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to create invitation" })
  }
}
