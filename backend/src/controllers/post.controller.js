import prisma from "../lib/prisma.js"
import { isValidLabel } from "../utils/labelValidation.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"
import { getActiveFeedProfile } from "../lib/feedProfile.js"
import sanitizeHtml from "sanitize-html"


/* ============================================================
   HELPERS
============================================================ */

const buildNsfwFilter = ({
  isMinor,
  nsfwEnabled,
  feedProfile,
}) => {
  // 🔒 Hard ceiling: minors never see NSFW
  if (isMinor) return { rating: "SAFE" }

  // 🔒 Hard ceiling: user disabled NSFW
  if (!nsfwEnabled) return { rating: "SAFE" }

  // 🧠 Feed profile preference
  const nsfwPref =
    feedProfile?.preferences?.nsfw?.posts === "SHOW"
      ? "SHOW"
      : "HIDE"

  return nsfwPref === "SHOW" ? {} : { rating: "SAFE" }
}


/* ============================================================
   CREATE POST
============================================================ */

export const createPost = async (req, res) => {
  try {
        console.log("🧬 CREATE POST BODY:", req.body)

    const {
      type,
      caption,
      mediaUrl,
      scope,
      categories,
      communityId = null,
      rating = "SAFE",
      originPostId = null,
    } = req.body

    /* ================================
   🧼 Sanitize text inputs
================================ */
const cleanCaption = caption
  ? sanitizeHtml(caption, {
      allowedTags: [],
      allowedAttributes: {},
    })
  : null

const cleanMemeTopText = req.body.memeTopText
  ? sanitizeHtml(req.body.memeTopText, {
      allowedTags: [],
      allowedAttributes: {},
    })
  : null

const cleanMemeBottomText = req.body.memeBottomText
  ? sanitizeHtml(req.body.memeBottomText, {
      allowedTags: [],
      allowedAttributes: {},
    })
  : null


    const userId = req.user.userId
    /* ================================
   ⛔ Enforce posting cooldown
================================ */
if (
  req.user.cooldownUntil &&
  new Date(req.user.cooldownUntil) > new Date()
) {
  return res.status(403).json({
    error: "You are temporarily restricted from posting",
    cooldownUntil: req.user.cooldownUntil,
  })
}

        // 🌍 Get user's stored location
    const userLocation = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        countryCode: true,
        regionCode: true,
      },
    })

    const userCountry = userLocation?.countryCode || null
    const userRegion = userLocation?.regionCode || null
if (scope === "COUNTRY" && !userCountry) {
  return res.status(400).json({
    error: "Country not set for user",
  })
}

if (scope === "LOCAL" && (!userCountry || !userRegion)) {
  return res.status(400).json({
    error: "Local region not set for user",
  })
}

    /* 🔞 NSFW guards */
    if (rating === "NSFW" && req.user.isMinor) {
      return res.status(403).json({
        error: "Minors cannot create NSFW content",
      })
    }

    if (communityId && rating === "NSFW") {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { rating: true },
      })

      if (!community) {
        return res.status(404).json({ error: "Community not found" })
      }

      if (community.rating !== "NSFW") {
        return res.status(403).json({
          error: "NSFW posts not allowed in SAFE communities",
        })
      }
    }

    /* Basic validation */
    const allowedTypes = ["TEXT", "IMAGE", "VIDEO", "MEME"]

if (!allowedTypes.includes(type)) {
  return res.status(400).json({
    error: "Invalid post type",
  })
}
// 🔒 MEME posts must ALWAYS have originPostId
if (type === "MEME") {
  if (!originPostId) {
    return res.status(400).json({
      error: "MEME posts require originPostId",
    })
  }
}

/* ================================
   🧱 Backend character limits
================================ */

const MAX_CAPTION_LENGTH = 420
const MAX_MEDIA_URL_LENGTH = 500
const MAX_MEME_TEXT_LENGTH = 120

if (caption && caption.length > MAX_CAPTION_LENGTH) {
  return res.status(400).json({
    error: "Caption exceeds maximum length",
  })
}

if (mediaUrl && mediaUrl.length > MAX_MEDIA_URL_LENGTH) {
  return res.status(400).json({
    error: "Media URL too long",
  })
}

if (type === "MEME") {
  if (
    req.body.memeTopText &&
    req.body.memeTopText.length > MAX_MEME_TEXT_LENGTH
  ) {
    return res.status(400).json({
      error: "Meme top text too long",
    })
  }

  if (
    req.body.memeBottomText &&
    req.body.memeBottomText.length > MAX_MEME_TEXT_LENGTH
  ) {
    return res.status(400).json({
      error: "Meme bottom text too long",
    })
  }
}


    if (type === "TEXT" && !caption?.trim()) {
      return res.status(400).json({
        error: "Text posts require a caption",
      })
    }

    if (
      ["IMAGE", "VIDEO", "MEME"].includes(type) &&
      !mediaUrl?.trim()
    ) {
      return res.status(400).json({
        error: "Media posts require a mediaUrl",
      })
    }

/* MEME lineage validation */
let originPost = null

if (type === "MEME") {
  if (!originPostId) {
    return res.status(400).json({
      error: "originPostId is required for meme posts",
    })
  }

  originPost = await prisma.post.findUnique({
    where: { id: originPostId },
    select: {
      id: true,
      type: true,
      mediaUrl: true,
      isRemoved: true,
    },
  })

  if (!originPost || originPost.isRemoved) {
    return res.status(404).json({
      error: "Original post not found",
    })
  }

  if (!["IMAGE", "MEME"].includes(originPost.type)) {
    return res.status(400).json({
      error: "Memes can only be created from image posts",
    })
  }
}


    /* Category validation */
    const safeCategories = Array.isArray(categories)
      ? categories
      : []

    if (safeCategories.length === 0) {
      return res.status(400).json({
        error: "At least one label is required",
      })
    }

    if (safeCategories.length > 3) {
      return res.status(400).json({
        error: "You can select up to 3 labels only",
      })
    }

    /* Normalize + upsert categories */
    const categoryRecords = []

    for (const raw of safeCategories) {
      const key = raw.toLowerCase().trim()

      if (!isValidLabel(key)) {
        return res.status(400).json({
          error: `Invalid label: ${raw}`,
        })
      }

      const category =
        (await prisma.category.findUnique({ where: { key } })) ??
        (await prisma.category.create({ data: { key } }))

      categoryRecords.push({ categoryKey: category.key })
    }

    /* Community enforcement */
    let isCommunityOnly = false

    if (communityId) {
      const membership = await prisma.communityMember.findFirst({
        where: { communityId, userId },
      })

      if (!membership) {
        return res.status(403).json({
          error: "You are not a member of this community",
        })
      }

      isCommunityOnly = true
    }



console.log("🧠 CREATING POST", {
  type,
  mediaUrl,
  originPostId,
})
   /* Create post */
    const post = await prisma.post.create({
      data: {
        type,
        caption: cleanCaption,
        mediaUrl,
        scope: communityId ? "GLOBAL" : scope,
        rating,
        userId,
        communityId,
        isCommunityOnly,
        countryCode:
  scope === "COUNTRY" || scope === "LOCAL"
    ? userCountry
    : null,

regionCode:
  scope === "LOCAL"
    ? userRegion
    : null,
    
        originPostId: type === "MEME" ? originPostId : null,
        originType: "USER",
        categories: {
          create: categoryRecords,
        },
      },
      include: {
        categories: {
          include: {
            category: { select: { key: true } },
          },
        },
      },
    })

    if (communityId) {
  await materializeCommunityFeed(communityId)

  const members = await prisma.communityMember.findMany({
    where: {
      communityId,
      userId: { not: userId }, // exclude author
    },
    select: { userId: true },
  })

  if (members.length > 0) {
    await prisma.notification.createMany({
      data: members.map((member) => ({
        recipientId: member.userId,
        actorId: userId,
        communityId: communityId,
        postId: post.id,
        type: "COMMUNITY_POST",
      })),
    })
  }
}

    return res.status(201).json(post)
  } catch (err) {
    console.error("CREATE POST ERROR:", err)
    return res.status(500).json({
      error: "Failed to create post",
    })
  }
}

/* ============================================================
   GLOBAL FEED
============================================================ */

export const getFeed = async (req, res) => {
  req.params.scope = "GLOBAL"
  return getScopedFeed(req, res)
}

/* ============================================================
   SCOPED FEED (THIS IS THE IMPORTANT PART)
============================================================ */

export const getScopedFeed = async (req, res) => {
  try {
    const { scope } = req.params

    if (!["GLOBAL", "COUNTRY", "LOCAL"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" })
    }

    const userId = req.user.userId

    // 🌍 Get user's stored location
    const userLocation = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        countryCode: true,
        regionCode: true,
      },
    })

    const userCountry = userLocation?.countryCode || null
    const userRegion = userLocation?.regionCode || null

    if (scope === "COUNTRY" && !userCountry) {
      return res.json({ items: [], nextCursor: null })
    }

    if (scope === "LOCAL" && (!userCountry || !userRegion)) {
      return res.json({ items: [], nextCursor: null })
    }

    /* 🔑 Load active feed profile */
    const feedProfile = await getActiveFeedProfile(userId)

    const labelPrefs =
      feedProfile?.preferences?.labels?.[scope] ?? []

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nsfwEnabled: true },
    })

    const nsfwFilter = buildNsfwFilter({
      isMinor: req.user.isMinor,
      nsfwEnabled: user?.nsfwEnabled,
      feedProfile,
    })

    const { cursor, limit } = req.query
    const take = Math.min(parseInt(limit) || 10, 20)

    const posts = await prisma.post.findMany({
      where: {
        scope,
        communityId: null,
        isRemoved: false,
        ...nsfwFilter,

        ...(scope === "COUNTRY" && userCountry
          ? { countryCode: userCountry }
          : {}),

        ...(scope === "LOCAL" && userRegion && userCountry
          ? {
              regionCode: userRegion,
              countryCode: userCountry,
            }
          : {}),

        ...(labelPrefs.length > 0 && {
          categories: {
            some: {
              category: {
                key: { in: labelPrefs },
              },
            },
          },
        }),
      },

      orderBy: [
  { createdAt: "desc" },
  { id: "desc" },
],

      take: take + 1,

      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),

      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },

        categories: {
          select: {
            category: {
              select: { key: true },
            },
          },
        },

        likes: {
          where: { userId },
          select: { id: true },
        },

        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },

        originPost: req.user.isMinor
  ? {
      where: {
        rating: "SAFE",
        isRemoved: false,
      },
      select: {
        id: true,
        type: true,
        mediaUrl: true,
      },
    }
  : {
      select: {
        id: true,
        type: true,
        mediaUrl: true,
      },
    },
      },
    })

    let nextCursor = null

    if (posts.length > take) {
      const nextItem = posts.pop()
      nextCursor = nextItem.id
    }

const totalCount = await prisma.post.count({
  where: {
    scope,
    communityId: null,
    isRemoved: false,
    ...nsfwFilter,

    ...(scope === "COUNTRY" && userCountry
      ? { countryCode: userCountry }
      : {}),

    ...(scope === "LOCAL" && userRegion && userCountry
      ? {
          regionCode: userRegion,
          countryCode: userCountry,
        }
      : {}),

    ...(labelPrefs.length > 0 && {
      categories: {
        some: {
          category: {
            key: { in: labelPrefs },
          },
        },
      },
    }),
  },
})

    const payload = {
      items: posts.map((p) => {
  const categoryKeys = p.categories.map(
    (c) => c.category.key
  )

  const isDefaultProfile =
    !labelPrefs || labelPrefs.length === 0

  return {
    id: p.id,
    type: p.type,
    caption: p.caption,
    mediaUrl: p.mediaUrl,
    scope: p.scope,
    rating: p.rating,
    createdAt: p.createdAt,
    isRemoved: p.isRemoved,
    user: p.user,
    categories: categoryKeys,
    _count: p._count,
    originPost: p.originPost ?? null,
    likedByMe: p.likes.length > 0,
    reason: {
      scope,
      profileName: feedProfile?.name ?? "Default",
      isDefaultProfile,
      matchedCategories: categoryKeys,
      scopeCeiling: scope,
      likes: p._count?.likes ?? 0,
    },
    
  }
  
}),
nextCursor,
totalCount,      
    }

    return res.json(payload)
  } catch (err) {
    console.error("GET SCOPED FEED ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch feed",
    })
  }
}

/* ============================================================
   POSTS BY LABEL
============================================================ */

export const getPostsByLabel = async (req, res) => {
  try {
    const { key } = req.params
    const userId = req.user.userId

    const feedProfile = await getActiveFeedProfile(userId)

    const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { nsfwEnabled: true },
})

const nsfwFilter = buildNsfwFilter({
  isMinor: req.user.isMinor,
  nsfwEnabled: user?.nsfwEnabled,
  feedProfile,
})


    const posts = await prisma.post.findMany({
      where: {
        communityId: null,
        isRemoved: false,
        ...nsfwFilter,
        categories: {
          some: {
            categoryKey: key,
          },
        },
      },
      orderBy: [
  { createdAt: "desc" },
  { id: "desc" },
],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
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
      },
    })

    return res.json(
      posts.map((p) => ({
        ...p,
        likedByMe: p.likes.length > 0,
        likes: undefined,
      }))
    )
  } catch (err) {
    console.error("GET POSTS BY LABEL ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch posts by label",
    })
  }
}



export const getPostOrigin = async (req, res) => {
  try {
    const { id } = req.params

    let current = await prisma.post.findUnique({
  where: { id },
  select: {
    id: true,
    mediaUrl: true,
    originPostId: true,
    rating: true,      
    isRemoved: true,  
  },
})

    if (!current) {
      return res.status(404).json({ error: "Post not found" })
    }

    
if (req.user?.isMinor && current.rating === "NSFW") {
  return res.status(403).json({
    error: "Minors cannot access NSFW content",
  })
}

if (current.isRemoved) {
  return res.status(404).json({
    error: "Post not found",
  })
}

    // 🔁 Walk up dynamically until true root
    while (current.originPostId) {
      current = await prisma.post.findUnique({
  where: { id: current.originPostId },
  select: {
    id: true,
    mediaUrl: true,
    originPostId: true,
    rating: true,       
    isRemoved: true, 
  },
})

      if (!current) break
    }
    if (req.user?.isMinor && current.rating === "NSFW") {
  return res.status(403).json({
    error: "Minors cannot access NSFW content",
  })
}

    return res.json({
      id: current.id,
      mediaUrl: current.mediaUrl,
    })
  } catch (err) {
    console.error("GET POST ORIGIN ERROR", err)
    return res.status(500).json({ error: "Failed to fetch origin post" })
  }
}



/* ============================================================
   DELETE POST (SOFT DELETE)
============================================================ */

export const deletePost = async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        userId: true,
        isRemoved: true,
      },
    })

    if (!post || post.isRemoved) {
      return res.status(404).json({
        error: "Post not found",
      })
    }

    // 🔒 Ownership guard
    if (post.userId !== userId) {
      return res.status(403).json({
        error: "You are not allowed to delete this post",
      })
    }

    await prisma.post.update({
      where: { id },
      data: { isRemoved: true },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("DELETE POST ERROR:", err)
    return res
      .status(500)
      .json({ error: "Failed to delete post" })
  }
}
