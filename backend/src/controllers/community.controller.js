import prisma from "../lib/prisma.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"




/**
 * POST /communities
 * Create a new community
 */
export const createCommunity = async (req, res) => {
  try {
    const { name, intention, scope, categories } = req.body
    const createdBy = req.user.userId

    if (!name || !intention || !scope || !categories?.length) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const community = await prisma.community.create({
      data: {
        name,
        intention,
        scope,
        createdBy,
        categories: {
          create: categories.map((categoryKey) => ({
            categoryKey,
          })),
        },
      },
      include: {
        categories: true,
      },
    })

    // Creator becomes ADMIN member
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: createdBy,
        role: "ADMIN",
      },
    })

    return res.status(201).json(community)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to create community" })
  }
}


/**
 * GET /communities/:id/feed
 * - Requires membership
 * - Reads from materialized CommunityFeedItem (Step 6.3)
 */
export const getCommunityFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
const cursor = req.query.cursor
    const { id } = req.params
    const userId = req.user.userId

    // 1. Fetch community
    const community = await prisma.community.findUnique({
      where: { id },
      include: { categories: true },
    })

    if (!community) {
      return res.status(404).json({ error: "Community not found" })
    }

    // 2. Verify membership
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

// 3. Read today's materialized feed
const { date } = req.query

let feedDate = new Date()
if (date) {
  feedDate = new Date(date)
}

feedDate.setHours(0, 0, 0, 0)


// 1. Try reading today's feed
const feedItems = await prisma.communityFeedItem.findMany({
  where: {
    communityId: id,
    feedDate: feedDate,
    ...(cursor && {
      rank: {
        gt: (
          await prisma.communityFeedItem.findUnique({
            where: {
              communityId_postId_feedDate: {
                communityId: id,
                postId: cursor,
                feedDate: feedDate,
              },
            },
            select: { rank: true },
          })
        )?.rank,
      },
    }),
  },
  orderBy: {
    rank: "asc",
  },
  take: limit,
  include: {
    post: {
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    },
  },
})


// 2. Auto-build if missing
if (feedItems.length === 0) {
  await materializeCommunityFeed(id, feedDate)

  let feedItems = await prisma.communityFeedItem.findMany({
    where: {
      communityId: id,
      feedDate: feedDate,
    },
    orderBy: { rank: "asc" },
    include: {
      post: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: {
            select: { likes: true },
          },
        },
      },
    },
  })
}

return res.json(
  feedItems.map(item => ({
    ...item.post,
    _feedReason: item.reason,
    _feedRank: item.rank,
  }))
)

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch community feed" })
  }
}

/**
 * POST /communities/:id/members/:userId/remove
 * Remove a member (ADMIN / MODERATOR only)
 */
export const removeCommunityMember = async (req, res) => {
  try {
    const { id: communityId, userId: targetUserId } = req.params
    const requesterId = req.user.userId

    if (requesterId === targetUserId) {
      return res.status(400).json({ error: "You cannot remove yourself" })
    }

    const requester = await prisma.communityMember.findFirst({
      where: { communityId, userId: requesterId },
    })

    if (!requester || !["ADMIN", "MODERATOR"].includes(requester.role)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }

    const target = await prisma.communityMember.findFirst({
      where: { communityId, userId: targetUserId },
    })

    if (!target) {
      return res.status(404).json({ error: "User is not a member" })
    }

    if (target.role === "ADMIN" && requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Only ADMIN can remove another ADMIN" })
    }

    await prisma.communityMember.delete({
      where: { id: target.id },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to remove member" })
  }
}

/**
 * POST /communities/:id/members/:userId/role
 * Change member role (ADMIN only)
 */
export const changeCommunityMemberRole = async (req, res) => {
  try {
    const { id: communityId, userId: targetUserId } = req.params
    const { role } = req.body
    const requesterId = req.user.userId

    if (!["MEMBER", "MODERATOR"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    // Fetch requester
    const requester = await prisma.communityMember.findFirst({
      where: { communityId, userId: requesterId },
    })

    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Only ADMIN can change roles" })
    }

    if (requesterId === targetUserId) {
      return res.status(400).json({ error: "ADMIN cannot change own role" })
    }

    // Fetch target
    const target = await prisma.communityMember.findFirst({
      where: { communityId, userId: targetUserId },
    })

    if (!target) {
      return res.status(404).json({ error: "User is not a member" })
    }

    if (target.role === "ADMIN") {
      return res.status(403).json({ error: "Cannot change ADMIN role" })
    }

    await prisma.communityMember.update({
      where: { id: target.id },
      data: { role },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to change role" })
  }
}

/**
 * DELETE /communities/:id
 * Delete a community (ADMIN only)
 */
export const deleteCommunity = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const requesterId = req.user.userId

    // Ensure requester is ADMIN
    const requester = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: requesterId,
        role: "ADMIN",
      },
    })

    if (!requester) {
      return res.status(403).json({ error: "Only ADMIN can delete community" })
    }

    await prisma.community.delete({
      where: { id: communityId },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to delete community" })
  }
}


/**
 * POST /communities/:id/invitations
 * - Any member can invite
 */
export const createCommunityInvitation = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const invitedUserId = req.body.userId
    const invitedById = req.user.userId

    if (!invitedUserId) {
      return res.status(400).json({ error: "invited userId required" })
    }

    // 1. Inviter must be a member
    const inviterMembership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: invitedById,
      },
    })

    if (!inviterMembership) {
      return res.status(403).json({ error: "Not a community member" })
    }

    // 2. Invited user must exist
    const invitedUser = await prisma.user.findUnique({
      where: { id: invitedUserId },
    })

    if (!invitedUser) {
      return res.status(404).json({ error: "Invited user not found" })
    }

    // 3. Cannot invite existing members
    const existingMembership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: invitedUserId,
      },
    })

    if (existingMembership) {
      return res.status(400).json({ error: "User already a member" })
    }

    // 4. Create invitation
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
/**
 * GET /communities/:id/members
 * List members of a community (members only)
 */
export const getCommunityMembers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
const cursor = req.query.cursor
    const { id } = req.params
    const userId = req.user.userId

    // Ensure requester is a member
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId: id,
        userId,
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "You are not a member of this community",
      })
    }

    const members = await prisma.communityMember.findMany({
      where: {
        communityId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    })

    return res.json(
      members.map(m => ({
        id: m.user.id,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      }))
    )
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch community members" })
  }
}
