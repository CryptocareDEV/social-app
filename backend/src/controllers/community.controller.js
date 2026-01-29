import prisma from "../lib/prisma.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"



export const materializeCommunityNow = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Community ID required" })
    }

    await materializeCommunityFeed(id)

    return res.json({ success: true })
  } catch (err) {
    console.error("MATERIALIZE COMMUNITY ERROR:", err)
    return res.status(500).json({
      error: "Failed to materialize community feed",
    })
  }
}

/**
 * GET /communities/:id
 * Get community details + labels (members only)
 */
export const getCommunityById = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const userId = req.user.userId

    // Ensure requester is a member
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "You are not a member of this community",
      })
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        categories: {
          select: {
            categoryKey: true,
          },
        },
      },
    })

    if (!community) {
      return res.status(404).json({
        error: "Community not found",
      })
    }

    return res.json(community)
  } catch (err) {
    console.error("GET COMMUNITY BY ID ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch community",
    })
  }
}


/**
 * GET /communities/:id/invitations
 * List pending invitations for a community (ADMIN / MODERATOR)
 */
export const getCommunityInvitations = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const userId = req.user.userId

    // Ensure requester is ADMIN or MODERATOR
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        role: { in: ["ADMIN", "MODERATOR"] },
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "Insufficient permissions",
      })
    }

    const invitations = await prisma.communityInvitation.findMany({
      where: {
        communityId,
        status: "PENDING",
      },
      include: {
        invitedUser: {
          select: {
            id: true,
            username: true,
          },
        },
        invitedBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return res.json(invitations)
  } catch (err) {
    console.error("GET COMMUNITY INVITATIONS ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch community invitations",
    })
  }
}


/**
 * POST /communities
 * Create a new community
 */
export const createCommunity = async (req, res) => {
  try {
    const { name, intention, scope, categories = [] } = req.body
    const userId = req.user.userId

    // 🔒 Structural validation (schema-level)
    if (!name || !scope || typeof intention !== "string") {
      return res.status(400).json({
        error: "Name, intention, and scope are required",
      })
    }

    // 🧠 Intent validation (community-level)
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        error: "Community must have at least one label",
      })
    }

// Normalize + ensure categories exist
const categoryRecords = []

for (const raw of categories) {
  const key = raw.toLowerCase().trim()

  const category =
    (await prisma.category.findUnique({
      where: { key },
    })) ??
    (await prisma.category.create({
      data: { key },
    }))

  categoryRecords.push({
    categoryKey: category.key,
  })
}


    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        intention: intention.trim(),
        scope,
        createdBy: userId,
        categories: {
      create: categoryRecords,
    },
      },
    })

    // 👤 Ensure creator is a member
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: "ADMIN",
      },
    })

    return res.status(201).json(community)
  } catch (err) {
    console.error("CREATE COMMUNITY ERROR:", err)
    return res.status(500).json({
      error: "Failed to create community",
    })
  }
}

/**
 * PATCH /communities/:id/categories
 * Update community labels (ADMIN only)
 */
export const updateCommunityCategories = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const { categories } = req.body
    const userId = req.user.userId

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        error: "Community must have at least one label",
      })
    }

    // Ensure requester is ADMIN
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        role: "ADMIN",
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "Only ADMIN can edit community labels",
      })
    }

    // Clear existing categories
    await prisma.communityCategory.deleteMany({
      where: { communityId },
    })

    // Add new categories
    await prisma.communityCategory.createMany({
      data: categories.map((key) => ({
        communityId,
        categoryKey: key,
      })),
    })

    // Optional but recommended: re-materialize feed
    await materializeCommunityFeed(communityId)

    return res.json({ success: true })
  } catch (err) {
    console.error("UPDATE COMMUNITY CATEGORIES ERROR:", err)
    return res.status(500).json({
      error: "Failed to update community labels",
    })
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
let feedItems = await prisma.communityFeedItem.findMany({
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

  feedItems = await prisma.communityFeedItem.findMany({
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
    reason: item.reason,
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
    const { username } = req.body
    const invitedById = req.user.userId

    if (!username || typeof username !== "string") {
      return res.status(400).json({
        error: "username is required",
      })
    }

    // 1. Inviter must be admin
    const inviterMembership = await prisma.communityMember.findFirst({
  where: {
    communityId,
    userId: invitedById,
    role: "ADMIN",
  },
})

if (!inviterMembership) {
  return res.status(403).json({
    error: "Only ADMIN can invite members",
  })
}


    // 2. Find invited user by username
    const invitedUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!invitedUser) {
      return res.status(404).json({ error: "User not found" })
    }

    const invitedUserId = invitedUser.id

    // 3. Cannot invite yourself
    if (invitedUserId === invitedById) {
      return res.status(400).json({
        error: "You cannot invite yourself",
      })
    }

    // 4. Cannot invite existing members
    const existingMembership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: invitedUserId,
      },
    })

    if (existingMembership) {
      return res.status(400).json({
        error: "User already a member",
      })
    }

    // 5. Prevent duplicate pending invitations
    const existingInvite = await prisma.communityInvitation.findFirst({
      where: {
        communityId,
        invitedUserId,
        status: "PENDING",
      },
    })

    if (existingInvite) {
      return res.status(400).json({
        error: "Invitation already sent",
      })
    }

    // 6. Create invitation with expiry (7 days)
    const invitation = await prisma.communityInvitation.create({
      data: {
        communityId,
        invitedById,
        invitedUserId,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    })

    return res.status(201).json(invitation)
  } catch (err) {
    console.error("CREATE INVITATION ERROR:", err)
    return res.status(500).json({
      error: "Failed to create invitation",
    })
  }
}


/**
 * POST /communities/invitations/:id/accept
 */
export const acceptCommunityInvitation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    if (invitation.invitedUserId !== userId) {
      return res.status(403).json({ error: "Not your invitation" })
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation no longer valid" })
    }

    if (invitation.expiresAt < new Date()) {
  await prisma.communityInvitation.update({
    where: { id },
    data: { status: "EXPIRED" },
  })
  return res.status(400).json({ error: "Invitation expired" })
}


    // Add user as member
    await prisma.communityMember.create({
      data: {
        communityId: invitation.communityId,
        userId,
        role: "MEMBER",
      },
    })

    // Mark invitation accepted
    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("ACCEPT INVITE ERROR:", err)
    return res.status(500).json({ error: "Failed to accept invitation" })
  }
}

/**
 * POST /communities/invitations/:id/decline
 */
export const declineCommunityInvitation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    if (invitation.invitedUserId !== userId) {
      return res.status(403).json({ error: "Not your invitation" })
    }

    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "DECLINED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("DECLINE INVITE ERROR:", err)
    return res.status(500).json({ error: "Failed to decline invitation" })
  }
}

/**
 * POST /communities/invitations/:id/revoke
 */
export const revokeCommunityInvitation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    // Inviter or ADMIN can revoke
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId: invitation.communityId,
        userId,
      },
    })

    if (
      invitation.invitedById !== userId &&
      membership?.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Not allowed to revoke" })
    }

    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "REVOKED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("REVOKE INVITE ERROR:", err)
    return res.status(500).json({ error: "Failed to revoke invitation" })
  }
}



/**
 * GET /communities/invitations/my
 */
export const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.userId

    const invitations = await prisma.communityInvitation.findMany({
      where: {
        invitedUserId: userId,
        status: "PENDING",
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            scope: true,
          },
        },
        invitedBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return res.json(invitations)
  } catch (err) {
    console.error("GET INVITES ERROR:", err)
    return res.status(500).json({ error: "Failed to fetch invitations" })
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
export const getMyCommunities = async (req, res) => {
  try {
    const userId = req.user.userId

    const communities = await prisma.community.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
  id: true,
  name: true,
  intention: true,
  scope: true,
  createdAt: true,
  members: {
    where: { userId },
    select: { role: true },
  },
},
      orderBy: {
        createdAt: "desc",
      },
    })

    return res.json(
  communities.map((c) => ({
    ...c,
    role: c.members[0]?.role,
    members: undefined,
  }))
)

  } catch (err) {
    console.error("GET MY COMMUNITIES ERROR:", err)
    return res
      .status(500)
      .json({ error: "Failed to fetch user communities" })
  }
}

export const leaveCommunity = async (req, res) => {
  const { id: communityId } = req.params
  const userId = req.user.userId

  const membership = await prisma.communityMember.findFirst({
    where: { communityId, userId },
  })

  if (!membership) {
    return res.status(400).json({ error: "Not a member" })
  }

  if (membership.role === "ADMIN") {
    const adminCount = await prisma.communityMember.count({
      where: {
        communityId,
        role: "ADMIN",
      },
    })

    if (adminCount === 1) {
      const memberCount = await prisma.communityMember.count({
        where: { communityId },
      })

      if (memberCount > 1) {
        return res.status(400).json({
          error: "Assign another admin before leaving",
        })
      }

      // Last member → delete community
      await prisma.community.delete({ where: { id: communityId } })
      return res.json({ deleted: true })
    }
  }

  await prisma.communityMember.delete({
    where: { id: membership.id },
  })

  return res.json({ left: true })
}
