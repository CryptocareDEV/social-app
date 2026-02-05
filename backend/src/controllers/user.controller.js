import prisma from "../lib/prisma.js"

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.json(user)
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
      include: {
        _count: { select: { likes: true } },
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
