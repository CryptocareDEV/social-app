import prisma from "../lib/prisma.js"

// GET /users/me
export const getMyProfile = async (req, res) => {

  const userId = req.user.userId

  // 🛟 Ensure UserProfile exists (backfill for legacy users)
  let profile = await prisma.userProfile.findUnique({
    where: { userId },
  })

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { userId },
    })
  }

  // 🛟 Ensure at least one FeedProfile exists
  let feedProfiles = await prisma.feedProfile.findMany({
    where: { userId },
    select: { id: true, name: true, isActive: true },
  })

  if (feedProfiles.length === 0) {
    const created = await prisma.feedProfile.create({
      data: {
        userId,
        name: "Default",
        isActive: true,
        preferences: {
          labels: {
            GLOBAL: [],
            COUNTRY: [],
            LOCAL: [],
          },
          nsfw: {
            posts: "HIDE",
            communities: {
              inFeeds: false,
              onProfile: false,
            },
          },
          ordering: "RECENT",
        },
      },
    })

    feedProfiles = [
      {
        id: created.id,
        name: created.name,
        isActive: true,
      },
    ]
  }

  const activeFeedProfile =
    feedProfiles.find((p) => p.isActive) ?? feedProfiles[0]

  res.json({
    username: req.user.username,
    bio: profile.bio ?? "",
    joinedAt: req.user.createdAt,
    activeFeedProfile,
    feedProfiles,
    cooldownUntil: req.user.cooldownUntil ?? null,
  })
}

// GET /users/me/feed-profiles
export const getFeedProfiles = async (req, res) => {
  const userId = req.user.userId

  const profiles = await prisma.feedProfile.findMany({
    where: { userId },
    select: { id: true, name: true, isActive: true },
  })

  res.json(profiles)
}

// GET /users/me/feed-profiles/:id
export const getFeedProfileById = async (req, res) => {
  const userId = req.user.userId

  const profile = await prisma.feedProfile.findFirst({
    where: {
      id: req.params.id,
      userId,
    },
  })

  if (!profile) {
    return res.status(404).json({ error: "Not found" })
  }

  res.json(profile)
}

// POST /users/me/feed-profiles
export const createFeedProfile = async (req, res) => {
  const userId = req.user.userId
  const { name, baseProfileId } = req.body

  let preferences = {
    labels: { GLOBAL: [], COUNTRY: [], LOCAL: [] },
    nsfw: {
      posts: "HIDE",
      communities: { inFeeds: false, onProfile: false },
    },
    ordering: "RECENT",
  }

  if (baseProfileId) {
    const base = await prisma.feedProfile.findFirst({
      where: { id: baseProfileId, userId },
    })

    if (base) {
      preferences = base.preferences
    }
  }

  const profile = await prisma.feedProfile.create({
    data: {
      userId,
      name,
      preferences,
    },
  })

  res.json(profile)
}

// PATCH /users/me/feed-profiles/:id
export const updateFeedProfile = async (req, res) => {
  const userId = req.user.userId

  await prisma.feedProfile.updateMany({
    where: {
      id: req.params.id,
      userId,
    },
    data: {
      name: req.body.name,
      preferences: req.body.preferences,
    },
  })

  res.json({ ok: true })
}

// POST /users/me/feed-profiles/:id/activate
export const activateFeedProfile = async (req, res) => {
  const userId = req.user.userId
  const id = req.params.id

  await prisma.feedProfile.updateMany({
    where: { userId },
    data: { isActive: false },
  })

  await prisma.feedProfile.update({
    where: { id },
    data: { isActive: true },
  })

  res.json({ ok: true })
}

// DELETE /users/me/feed-profiles/:id
export const deleteFeedProfile = async (req, res) => {
  const userId = req.user.userId

  const count = await prisma.feedProfile.count({
    where: { userId },
  })

  if (count <= 1) {
    return res.status(400).json({
      error: "At least one profile required",
    })
  }

  await prisma.feedProfile.delete({
    where: { id: req.params.id },
  })

  res.json({ ok: true })
}
