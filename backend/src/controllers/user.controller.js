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
  nsfwEnabled: true,
  themeMode: true,
  accentTheme: true,
  dateOfBirth: true,
},
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
// Derive minor status
const now = new Date()
const dob = new Date(user.dateOfBirth)

let age = now.getFullYear() - dob.getFullYear()
const m = now.getMonth() - dob.getMonth()
if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
  age--
}

const isMinor = age < 18

    // 2️⃣ Check superuser status
    const superuser = await prisma.superuser.findUnique({
      where: { userId },
      select: { role: true },
    })

    // 3️⃣ Return enriched auth state
    const isRoot =
  user.email === process.env.PLATFORM_OWNER_EMAIL

return res.json({
  ...user,
  isMinor,
  isRoot,
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
    const { bio, nsfwEnabled, themeMode, accentTheme } = req.body

    const updateData = {}
    let profileUpdate = null

    /* ================================
       📝 BIO UPDATE
    ================================= */
    if (typeof bio === "string") {
      profileUpdate = {
        upsert: {
          create: { bio: bio.trim() },
          update: { bio: bio.trim() },
        },
      }
    }

    /* ================================
   🔞 NSFW TOGGLE (hard ceiling, DB enforced)
================================ */
if (typeof nsfwEnabled === "boolean") {
  // 🔎 Fetch authoritative DOB from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { dateOfBirth: true },
  })

  if (!dbUser) {
    return res.status(404).json({ error: "User not found" })
  }

  // 🧮 Compute age from DB value
  const now = new Date()
  const dob = new Date(dbUser.dateOfBirth)

  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--
  }

  const isMinor = age < 18

  if (isMinor && nsfwEnabled === true) {
    return res.status(403).json({
      error: "NSFW cannot be enabled for minors",
    })
  }

  updateData.nsfwEnabled = isMinor ? false : nsfwEnabled
}


    /* ================================
       🎨 THEME MODE
    ================================= */
    if (themeMode) {
      const allowedModes = ["LIGHT", "DARK"]
      if (!allowedModes.includes(themeMode)) {
        return res.status(400).json({
          error: "Invalid themeMode",
        })
      }
      updateData.themeMode = themeMode
    }

    /* ================================
       🌈 ACCENT THEME
    ================================= */
    if (accentTheme) {
      const allowedAccents = [
  "REDDIT",
  "SUN_ORANGE",
  "SKY_BLUE",
  "TURQUOISE",
  "SOFT_GREEN",
]


      if (!allowedAccents.includes(accentTheme)) {
        return res.status(400).json({
          error: "Invalid accentTheme",
        })
      }

      updateData.accentTheme = accentTheme
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...(profileUpdate && { profile: profileUpdate }),
      },
      select: {
        id: true,
        nsfwEnabled: true,
        themeMode: true,
        accentTheme: true,
        profile: {
          select: { bio: true },
        },
      },
    })

    return res.json({
      id: updatedUser.id,
      bio: updatedUser.profile?.bio ?? "",
      nsfwEnabled: updatedUser.nsfwEnabled,
      themeMode: updatedUser.themeMode,
      accentTheme: updatedUser.accentTheme,
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
