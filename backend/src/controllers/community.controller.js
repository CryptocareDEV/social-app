import prisma from "../lib/prisma.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"
import { loadCommunityWithCategories } from "../services/community.loader.js"



export const materializeCommunityNow = async (req, res) => {
  try {
    const { id } = req.params
    const community = await prisma.community.findUnique({
  where: { id: communityId },
})

if (!community) {
  return res.status(404).json({ error: "Community not found" })
}

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
 * POST /api/v1/communities/:id/label-imports
 * Add or update a label import rule
 */
export const addCommunityLabelImport = async (req, res) => {
  try {
    const communityId = req.params.id
    const { categoryKey, importMode } = req.body
    const userId = req.user.userId

    if (!categoryKey || !importMode) {
      return res.status(400).json({
        error: "categoryKey and importMode are required",
      })
    }

    if (!["SAFE_ONLY", "NSFW_ONLY", "BOTH"].includes(importMode)) {
      return res.status(400).json({
        error: "Invalid importMode",
      })
    }

    // 🔎 Load community + membership
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    if (!community) {
      return res.status(404).json({
        error: "Community not found",
      })
    }

    const membership = community.members[0]

    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({
        error: "Only admins can manage label imports",
      })
    }

    // 🔎 Load category
    const category = await prisma.category.findUnique({
      where: { key: categoryKey },
    })

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      })
    }

    // 🚫 LOCAL labels are never allowed in communities
    if (category.scope === "LOCAL") {
      return res.status(403).json({
        error: "Local labels cannot be imported into communities",
      })
    }

    // 🚫 SAFE communities cannot import NSFW
    if (
      community.rating === "SAFE" &&
      importMode !== "SAFE_ONLY"
    ) {
      return res.status(403).json({
        error:
          "SAFE communities may only import SAFE content",
      })
    }

    // ✅ Upsert import rule
    const rule = await prisma.communityLabelImport.upsert({
      where: {
        communityId_categoryKey: {
          communityId,
          categoryKey,
        },
      },
      update: {
        importMode,
      },
      create: {
        communityId,
        categoryKey,
        importMode,
      },
    })
await materializeCommunityFeed(communityId, new Date())

    res.status(201).json(rule)
  } catch (err) {
    console.error("ADD LABEL IMPORT ERROR:", err)
    res.status(500).json({
      error: "Failed to add label import rule",
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
    select: { categoryKey: true },
  },
  labelImports: {
    select: {
      categoryKey: true,
      importMode: true,
    },
  },
},
    })

    if (!community) {
      return res.status(404).json({
        error: "Community not found",
      })
    }

    return res.json({
  ...community,
  myRole: membership.role,
})
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
    /* =========================
   🔞 COMMUNITY CREATION GUARDS
========================= */

const { rating = "SAFE" } = req.body

if (!["SAFE", "NSFW"].includes(rating)) {
  return res.status(400).json({
    error: "Invalid community rating",
  })
}

// 🚫 Minors cannot create NSFW communities
if (rating === "NSFW" && req.user.isMinor) {
  return res.status(403).json({
    error: "Minors cannot create NSFW communities",
  })
}

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
    data: {
      key,
      scope: scope,        // 👈 REQUIRED
      countryCode: scope === "COUNTRY" ? req.user.countryCode ?? null : null,
    },
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
        rating,
        createdBy: userId,
        categories: {
      create: categoryRecords,
    },
      },
    })
    if (categories?.length > 0) {
  await prisma.communityLabelImport.createMany({
    data: categories.map((key) => ({
      communityId: community.id,
      categoryKey: key,
      importMode: "BOTH", // default
    })),
    skipDuplicates: true,
  })
}


    // 👤 Ensure creator is a member
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: "ADMIN",
      },
    })

// 🔑 CREATE DEFAULT LABEL IMPORT RULES
await prisma.communityLabelImport.createMany({
  data: categoryRecords.map((c) => ({
    communityId: community.id,
    categoryKey: c.categoryKey,
    importMode:
      rating === "SAFE" ? "SAFE_ONLY" : "BOTH",
  })),
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



// 🔑 LOAD COMMUNITY WITH CATEGORIES (CRITICAL)
const community = await loadCommunityWithCategories(communityId)

if (!community) {
  return res.status(404).json({ error: "Community not found" })
}



  // Clear existing categories
    await prisma.communityCategory.deleteMany({
      where: { communityId },
    })

  
    

    
// 🔥 Reset label imports atomically
await prisma.$transaction([
  prisma.communityLabelImport.deleteMany({
    where: { communityId },
  }),
  prisma.communityLabelImport.createMany({
    data: categories.map((key) => ({
      communityId,
      categoryKey: key,
      importMode:
        community.rating === "SAFE" ? "SAFE_ONLY" : "BOTH",
    })),
  }),
])



    // Add new categories
    await prisma.communityCategory.createMany({
      data: categories.map((key) => ({
        communityId,
        categoryKey: key,
      })),
    })

    // Optional but recommended: re-materialize feed
    // 🔥 ALWAYS rebuild today's feed after label change
    await materializeCommunityFeed(communityId, new Date())

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

// 🔞 Minor safety: block NSFW communities entirely
if (req.user.isMinor && community.rating === "NSFW") {
  return res.status(403).json({
    error: "Minors cannot access NSFW communities",
  })
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
    post: {
    isRemoved: false,
  },
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

      categories: {
        include: {
          category: { select: { key: true } },
        },
      },

      likes: {
        where: { userId },
        select: { id: true },
      },

      _count: {
        select: { likes: true },
      },

      // 🔑 ABSOLUTELY REQUIRED
      originPost: {
        select: {
          id: true,
          type: true,
          mediaUrl: true,
          originPostId: true,
          originPost: {
            select: {
              id: true,
              mediaUrl: true,
            },
          },
        },
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

      categories: {
        include: {
          category: { select: { key: true } },
        },
      },

      likes: {
        where: { userId },
        select: { id: true },
      },

      _count: {
        select: { likes: true },
      },

      // 🔑 ABSOLUTELY REQUIRED
      originPost: {
        select: {
          id: true,
          type: true,
          mediaUrl: true,
          originPostId: true,
          originPost: {
            select: {
              id: true,
              mediaUrl: true,
            },
          },
        },
      },
    },
  },
},

  })
}

return res.json(
  feedItems.map(item => {
    const post = item.post

    return {
      id: post.id,
      type: post.type,
      caption: post.caption,
      mediaUrl: post.mediaUrl,          // 🔑 FORCE PASS
      scope: post.scope,
      rating: post.rating,
      createdAt: post.createdAt,
      isRemoved: post.isRemoved,

      user: post.user,
      categories: post.categories,
      _count: post._count,

      originPost: post.originPost ?? null, // 🔑 KEEP LINEAGE
      reason: item.reason,
      _feedRank: item.rank,
    }
  })
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
    const userId = req.user.userId

    // 1️⃣ Ensure requester is ADMIN
    const requester = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        role: "ADMIN",
      },
    })

    if (!requester) {
      return res.status(403).json({
        error: "Only ADMIN can delete community",
      })
    }

    // 2️⃣ Atomic cleanup + delete
    await prisma.$transaction([
      prisma.communityCategory.deleteMany({
        where: { communityId },
      }),

      prisma.communityMember.deleteMany({
        where: { communityId },
      }),

      prisma.communityInvitation.deleteMany({
        where: { communityId },
      }),

      prisma.communityFeedItem.deleteMany({
        where: { communityId },
      }),

      prisma.communityChat.deleteMany({
        where: { communityId },
      }),

      prisma.communityLabelImport.deleteMany({
        where: { communityId },
      }),

      prisma.community.delete({
        where: { id: communityId },
      }),
    ])

    return res.json({ success: true })
  } catch (err) {
    console.error("DELETE COMMUNITY ERROR:", err)
    return res.status(500).json({
      error: "Failed to delete community",
    })
  }
}



/**
 * POST /communities/:id/invitations
 * - Only ADMIN can invite
 * - Minors cannot be invited to NSFW communities
 */
export const createCommunityInvitation = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const { username } = req.body
    const invitedById = req.user.userId

    // ================================
// JOIN REQUEST (user → community)
// ================================
// If NO username is provided, this is a join request
if (!username) {
  // 1. Load community
  const community = await prisma.community.findUnique({
    where: { id: communityId },
  })

  if (!community) {
    return res.status(404).json({ error: "Community not found" })
  }

  // 2. Minor safety
  if (community.rating === "NSFW" && req.user.isMinor) {
    return res.status(403).json({
      error: "Minors cannot join NSFW communities",
    })
  }

  // 3. Already a member?
  const existingMember = await prisma.communityMember.findFirst({
    where: {
      communityId,
      userId: invitedById,
    },
  })

  if (existingMember) {
    return res.status(400).json({
      error: "You are already a member",
    })
  }

  // 4. Existing pending request?
  const existingRequest =
    await prisma.communityInvitation.findFirst({
      where: {
        communityId,
        invitedUserId: invitedById,
        status: "PENDING",
      },
    })

  if (existingRequest) {
    return res.status(400).json({
      error: "Join request already sent",
    })
  }

  // 5. Create join request
  const invitation =
    await prisma.communityInvitation.create({
      data: {
        communityId,
        invitedById,
        invitedUserId: invitedById,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    })

  return res.status(201).json(invitation)
}



    if (!username || typeof username !== "string") {
      return res.status(400).json({
        error: "username is required",
      })
    }

    // 1. Inviter must be ADMIN
    const inviterMembership =
      await prisma.communityMember.findFirst({
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

    // 2. Load community (needed for NSFW check)
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community) {
      return res.status(404).json({
        error: "Community not found",
      })
    }

    // 3. Find invited user by username
    const invitedUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!invitedUser) {
      return res.status(404).json({
        error: "User not found",
      })
    }


    // 4. 🔞 Minor safety: block NSFW invitations entirely
    if (community.rating === "NSFW") {
      const dob = invitedUser.dateOfBirth

      if (!dob) {
        // fail-safe: no DOB → treat as minor
        return res.status(403).json({
          error: "Minors cannot be invited to NSFW communities",
        })
      }

      const now = new Date()
      const birthDate = new Date(dob)

      let age = now.getFullYear() - birthDate.getFullYear()
      const m = now.getMonth() - birthDate.getMonth()
      if (
        m < 0 ||
        (m === 0 && now.getDate() < birthDate.getDate())
      ) {
        age--
      }

      if (age < 18) {
        return res.status(403).json({
          error: "Minors cannot be invited to NSFW communities",
        })
      }
    }

    // 5. Cannot invite yourself
    if (invitedUserId === invitedById) {
      return res.status(400).json({
        error: "You cannot invite yourself",
      })
    }

    // 6. Cannot invite existing members
    const existingMembership =
      await prisma.communityMember.findFirst({
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

    // 7. Prevent duplicate pending invitations
    const existingInvite =
      await prisma.communityInvitation.findFirst({
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

    // 8. Create invitation (expires in 7 days)
    const invitation =
      await prisma.communityInvitation.create({
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
    const actorId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation no longer valid" })
    }

    // 🔑 Detect join request vs admin invite
    const isJoinRequest =
      invitation.invitedById === invitation.invitedUserId

    let userToAddId = null

    if (isJoinRequest) {
      // ============================
      // ADMIN approves join request
      // ============================
      const admin = await prisma.communityMember.findFirst({
        where: {
          communityId: invitation.communityId,
          userId: actorId,
          role: "ADMIN",
        },
      })

      if (!admin) {
        return res.status(403).json({
          error: "Only ADMIN can approve join requests",
        })
      }

      userToAddId = invitation.invitedUserId
    } else {
      // ============================
      // User accepts admin invite
      // ============================
      if (invitation.invitedUserId !== actorId) {
        return res.status(403).json({ error: "Not your invitation" })
      }

      userToAddId = actorId
    }

    // 🛑 Safety: prevent double membership
    const existing = await prisma.communityMember.findFirst({
      where: {
        communityId: invitation.communityId,
        userId: userToAddId,
      },
    })

    if (existing) {
      return res.status(400).json({
        error: "User already a member",
      })
    }

    // ✅ Add correct user as member
    await prisma.communityMember.create({
      data: {
        communityId: invitation.communityId,
        userId: userToAddId,
        role: "MEMBER",
      },
    })

    // ✅ Mark invitation accepted
    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("ACCEPT INVITATION ERROR:", err)
    return res.status(500).json({
      error: "Failed to accept invitation",
    })
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
    // 🔑 EXCLUDE join requests
    NOT: {
      invitedById: userId,
    },
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


/**
 * PATCH /communities/:id/intention
 * Update community intention (ADMIN only)
 */
export const updateCommunityIntention = async (req, res) => {
  try {
    const { id: communityId } = req.params
    const { intention } = req.body
    const userId = req.user.userId

    if (typeof intention !== "string") {
      return res.status(400).json({ error: "Invalid intention" })
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
      return res
        .status(403)
        .json({ error: "Only ADMIN can edit community intention" })
    }

    const community = await prisma.community.update({
      where: { id: communityId },
      data: {
        intention: intention.trim(),
      },
      select: {
        id: true,
        intention: true,
      },
    })

    return res.json(community)
  } catch (err) {
    console.error("UPDATE COMMUNITY INTENTION ERROR:", err)
    return res.status(500).json({
      error: "Failed to update community intention",
    })
  }
}


// ============================================================
// PUBLIC COMMUNITY VIEW (NON-MEMBERS)
// GET /communities/:id/public
// ============================================================
export const getCommunityPublicView = async (req, res) => {
  try {
    const { id } = req.params

    // 1️⃣ Load basic community info (SAFE fields only)
    const community = await prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        intention: true,
        scope: true,
        rating: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    })

    if (!community) {
      return res.status(404).json({ error: "Community not found" })
    }

    // 2️⃣ Load PUBLIC posts only
    const posts = await prisma.communityFeedItem.findMany({
  where: {
    communityId: id,
    post: {
      isRemoved: false,
      rating: "SAFE",
    },
  },
  orderBy: { rank: "asc" },
  take: 20,
  include: {
    post: {
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: { select: { likes: true } },
      },
    },
  },
})


    // 3️⃣ Check if current user already has a pending join request
let myInvitationStatus = null

if (req.user?.userId) {
  const myInvitation = await prisma.communityInvitation.findFirst({
    where: {
      communityId: id,
      invitedUserId: req.user.userId,
      status: "PENDING",
    },
  })

  if (myInvitation) {
    myInvitationStatus = myInvitation.status
  }
}

return res.json({
  community,
  posts: posts.map(i => i.post),
  canRequestJoin: true,
  myInvitationStatus,
})

  } catch (err) {
    console.error("GET COMMUNITY PUBLIC VIEW ERROR:", err)
    return res.status(500).json({
      error: "Failed to load community",
    })
  }
}

/**
 * DELETE /communities/:id/label-imports/:categoryKey
 */
export const deleteCommunityLabelImport = async (req, res) => {
  try {
    const { id: communityId, categoryKey } = req.params
    const userId = req.user.userId

    // Ensure ADMIN
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        role: "ADMIN",
      },
    })

    if (!membership) {
      return res.status(403).json({
        error: "Only ADMIN can delete label imports",
      })
    }

    await prisma.communityLabelImport.delete({
      where: {
        communityId_categoryKey: {
          communityId,
          categoryKey,
        },
      },
    })

    // 🔥 Rebuild today's feed
    await materializeCommunityFeed(communityId, new Date())

    return res.json({ success: true })
  } catch (err) {
    console.error("DELETE LABEL IMPORT ERROR:", err)
    return res.status(500).json({
      error: "Failed to delete label import",
    })
  }
}
