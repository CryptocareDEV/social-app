import prisma from "../lib/prisma.js"

const DEFAULT_PROFILE_NAME = "Default"


/* =========================================
   GET MY FEED PROFILES
========================================= */
export const getMyFeedProfiles = async (req, res) => {
  const userId = req.user.userId

  let profiles = await prisma.feedProfile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  // 🔑 Ensure Default profile exists
  let defaultProfile = profiles.find(
    (p) => p.name === DEFAULT_PROFILE_NAME
  )

  if (!defaultProfile) {
    defaultProfile = await prisma.feedProfile.create({
      data: {
        userId,
        name: DEFAULT_PROFILE_NAME,
        isActive: profiles.length === 0, // activate if first
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

    profiles = [defaultProfile, ...profiles]
  }

  // 🔒 Ensure one active profile
  const active = profiles.find((p) => p.isActive)
  if (!active && profiles.length > 0) {
    await prisma.feedProfile.update({
      where: { id: profiles[0].id },
      data: { isActive: true },
    })

    profiles[0].isActive = true
  }

  return res.json(profiles)
}


/* =========================================
   CREATE FEED PROFILE  ✅ THIS WAS MISSING
========================================= */
export const createFeedProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const { name, allowNSFW, labelPreferences = [] } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" })
    }

    // 🧠 Build labels map ONCE
    const labels = {
      GLOBAL: [],
      COUNTRY: [],
      LOCAL: [],
    }

    for (const pref of labelPreferences) {
      if (
        pref &&
        labels[pref.scope] &&
        Array.isArray(pref.labels)
      ) {
        labels[pref.scope] = pref.labels
      }
    }

    console.log("🔥 FINAL LABELS TO SAVE:", labels)

    // deactivate existing profiles
    await prisma.feedProfile.updateMany({
      where: { userId },
      data: { isActive: false },
    })

    const profile = await prisma.feedProfile.create({
      data: {
        userId,
        name,
        isActive: true,
        preferences: {
          nsfw: {
            posts: allowNSFW ? "SHOW" : "HIDE",
            communities: {
              inFeeds: false,
              onProfile: false,
            },
          },
          labels, // ✅ THIS is now the correct one
          ordering: "RECENT",
        },
      },
    })

    console.log("✅ CREATED FEED PROFILE:", {
      id: profile.id,
      labels: profile.preferences.labels,
    })

    return res.status(201).json(profile)
  } catch (err) {
    console.error("CREATE FEED PROFILE ERROR:", err)
    return res
      .status(500)
      .json({ error: "Failed to create feed profile" })
  }
}




/* =========================================
   ACTIVATE FEED PROFILE
========================================= */
export const activateFeedProfile = async (req, res) => {
  const userId = req.user.userId
  const { id } = req.params

  await prisma.feedProfile.updateMany({
    where: { userId },
    data: { isActive: false },
  })

  const profile = await prisma.feedProfile.update({
    where: { id },
    data: { isActive: true },
  })

  console.log("✅ ACTIVATED FEED PROFILE:", {
    id: profile.id,
    labels: profile.preferences.labels,
  })

  res.json(profile)
}

export const updateFeedProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { name, allowNSFW, labelPreferences = [] } = req.body

    const labels = { GLOBAL: [], COUNTRY: [], LOCAL: [] }

    for (const pref of labelPreferences) {
      if (labels[pref.scope]) {
        labels[pref.scope] = pref.labels
      }
    }

const existing = await prisma.feedProfile.findUnique({
  where: { id },
})

if (!existing || existing.userId !== userId) {
  return res.status(404).json({ error: "Feed profile not found" })
}

if (existing.name === DEFAULT_PROFILE_NAME) {
  return res.status(403).json({
    error: "Default feed profile cannot be edited",
  })
}



    const profile = await prisma.feedProfile.update({
      where: { id },
      data: {
        name,
        preferences: {
          nsfw: {
            posts: allowNSFW ? "SHOW" : "HIDE",
            communities: {
              inFeeds: false,
              onProfile: false,
            },
          },
          labels,
          ordering: "RECENT",
        },
      },
    })

    res.json(profile)
  } catch (err) {
    console.error("UPDATE FEED PROFILE ERROR:", err)
    res.status(500).json({ error: "Failed to update feed profile" })
  }
}


export const deleteFeedProfile = async (req, res) => {
  const userId = req.user.userId
  const { id } = req.params

  const profiles = await prisma.feedProfile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  if (profiles.length <= 1) {
    return res.status(400).json({
      error: "You must have at least one feed profile",
    })
  }

const target = profiles.find((p) => p.id === id)

if (!target) {
  return res.status(404).json({ error: "Feed profile not found" })
}

if (target.name === DEFAULT_PROFILE_NAME) {
  return res.status(403).json({
    error: "Default feed profile cannot be deleted",
  })
}


  const deleting = profiles.find((p) => p.id === id)

  await prisma.feedProfile.delete({ where: { id } })

  if (deleting?.isActive) {
    const next = profiles.find((p) => p.id !== id)

    await prisma.feedProfile.update({
      where: { id: next.id },
      data: { isActive: true },
    })
  }

  res.json({ success: true })
}
