import prisma from "../lib/prisma.js"

/* =========================================
   GET MY FEED PROFILES
========================================= */
export const getMyFeedProfiles = async (req, res) => {
  const userId = req.user.userId

  const profiles = await prisma.feedProfile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

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
