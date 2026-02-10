import prisma from "../lib/prisma.js"
import { isValidLabel } from "../utils/labelValidation.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"
import { getActiveFeedProfile } from "../lib/feedProfile.js"

/* ============================================================
   HELPERS
============================================================ */

const buildNsfwFilter = ({ isMinor, feedProfile }) => {
  if (isMinor) return { rating: "SAFE" }

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

    const userId = req.user.userId

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
        caption,
        mediaUrl,
        scope: communityId ? "GLOBAL" : scope,
        rating,
        userId,
        communityId,
        isCommunityOnly,
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

    /* 🔑 Load active feed profile */
    const feedProfile = await getActiveFeedProfile(userId)

    if (!feedProfile) {
      console.warn("⚠️ No active feed profile for user", userId)
    }

    console.log("🧠 ACTIVE FEED PROFILE:", feedProfile)

    const labelPrefs =
      feedProfile?.preferences?.labels?.[scope] ?? []

    console.log(
      "🧠 FEED LABELS FOR SCOPE",
      scope,
      labelPrefs
    )

    const nsfwFilter = buildNsfwFilter({
      isMinor: req.user.isMinor,
      feedProfile,
    })

    const posts = await prisma.post.findMany({
      where: {
        scope,
        communityId: null,
        isRemoved: false,
        ...nsfwFilter,
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
      orderBy: { createdAt: "desc" },
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
  select: {
    likes: true,
    comments: true,
  }
},
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
    })

    return res.json(
  posts.map((p) => ({
    id: p.id,
    type: p.type,
    caption: p.caption,
    mediaUrl: p.mediaUrl,            // 🔑 FORCE PASS
    scope: p.scope,
    rating: p.rating,
    createdAt: p.createdAt,
    isRemoved: p.isRemoved,

    user: p.user,
    categories: p.categories,
    _count: p._count,

    originPost: p.originPost ?? null,
    likedByMe: p.likes.length > 0,
  }))
)

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

    const nsfwFilter = buildNsfwFilter({
      isMinor: req.user.isMinor,
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
      orderBy: { createdAt: "desc" },
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

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        mediaUrl: true,
        originPostId: true,
        originPost: {
          select: {
            id: true,
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
    })

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    // Walk up to the clean root
    let root = post
    while (root.originPost) {
      root = root.originPost
    }

    return res.json({
      id: root.id,
      mediaUrl: root.mediaUrl,
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
