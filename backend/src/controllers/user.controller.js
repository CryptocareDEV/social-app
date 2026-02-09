import prisma from "../lib/prisma.js"

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params

    // 1️⃣ First try: treat param as UUID (existing behavior)
    let user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { posts: true } },
        profile: {
          select: { bio: true },
        },
      },
    })

    // 2️⃣ Fallback: treat param as username (NEW, safe)
    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: id },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          createdAt: true,
          _count: { select: { posts: true } },
          profile: {
            select: { bio: true },
          },
        },
      })
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // 3️⃣ Preserve exact response shape
    return res.json({
      ...user,
      bio: user.profile?.bio ?? "",
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch profile" })
  }
}



export const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params

    const posts = await prisma.post.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        caption: true,
        mediaUrl: true,
        communityId: true, // 🔑 THIS IS THE KEY LINE
        createdAt: true,
        _count: {
          select: { likes: true },
        },
      },
    })

    return res.json(posts)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch user posts" })
  }
}


/**
 * GET /api/v1/users/me
 * 🔑 Auth bootstrap endpoint
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId

    // 1️⃣ Load base user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        cooldownUntil: true,
        reportCooldownUntil: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // 2️⃣ Check superuser status
    const superuser = await prisma.superuser.findUnique({
      where: { userId },
      select: { role: true },
    })

    // 3️⃣ Return enriched auth state
    return res.json({
      ...user,
      isSuperuser: !!superuser,
      superuserRole: superuser?.role || null,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch me" })
  }
}

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
            intention: true,
            scope: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
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
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch invitations" })
  }
}

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.userId
    const { bio } = req.body

    if (typeof bio !== "string") {
      return res.status(400).json({ error: "Invalid bio" })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: {
              bio: bio.trim(),
            },
            update: {
              bio: bio.trim(),
            },
          },
        },
      },
      select: {
        id: true,
        profile: {
          select: {
            bio: true,
          },
        },
      },
    })

    return res.json({
      id: user.id,
      bio: user.profile?.bio ?? "",
    })
  } catch (err) {
    console.error("UPDATE ME ERROR:", err)
    return res.status(500).json({
      error: "Failed to update profile",
    })
  }
}


export const getUserCommunities = async (req, res) => {
  try {
    const { id } = req.params

    const memberships = await prisma.communityMember.findMany({
      where: { userId: id },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            intention: true,
            scope: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    return res.json(
      memberships.map((m) => ({
        id: m.community.id,
        name: m.community.name,
        intention: m.community.intention,
        scope: m.community.scope,
      }))
    )
  } catch (err) {
    console.error("GET USER COMMUNITIES ERROR", err)
    return res
      .status(500)
      .json({ error: "Failed to fetch user communities" })
  }
}
