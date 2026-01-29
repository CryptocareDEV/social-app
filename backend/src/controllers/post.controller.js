import prisma from "../lib/prisma.js"
import { isValidLabel } from "../utils/labelValidation.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"


/**
 * CREATE POST
 * Enforces:
 * - cooldown / ban (via middleware)
 * - NSFW invariants
 * - community containment
 * - world-feed safety
 */
export const createPost = async (req, res) => {
  try {
    const {
      type,
      caption,
      mediaUrl,
      scope,
      categories,
      communityId = null,
      rating = "SAFE",
    } = req.body

    const userId = req.user.userId

    /* =========================
       1️⃣ BASIC VALIDATION
    ========================= */

    if (!type || !scope) {
      return res.status(400).json({
        error: "Post type and scope required",
      })
    }

    if (type === "TEXT" && !caption?.trim()) {
      return res.status(400).json({
        error: "Text posts require a caption",
      })
    }

    if (
      (type === "IMAGE" ||
        type === "VIDEO" ||
        type === "MEME") &&
      !mediaUrl?.trim()
    ) {
      return res.status(400).json({
        error: "Media posts require a mediaUrl",
      })
    }

    /* =========================
       2️⃣ CATEGORY VALIDATION
    ========================= */

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

    /* =========================
       3️⃣ NORMALIZE + UPSERT CATEGORIES
    ========================= */

    const categoryRecords = []

    for (const raw of safeCategories) {
      const key = raw.toLowerCase().trim()

      if (!isValidLabel(key)) {
        return res.status(400).json({
          error: `Invalid label: ${raw}`,
        })
      }

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

    /* =========================
       4️⃣ COMMUNITY + NSFW ENFORCEMENT
    ========================= */

    let isCommunityOnly = false

   
    if (communityId) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
  })

  if (!community) {
    return res.status(404).json({ error: "Community not found" })
  }

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

  if (community.rating === "NSFW" && rating !== "NSFW") {
    return res.status(400).json({
      error: "Posts in NSFW communities must be marked NSFW",
    })
  }

  if (community.rating === "SAFE" && rating === "NSFW") {
    return res.status(400).json({
      error: "NSFW content not allowed in SAFE communities",
    })
  }

  isCommunityOnly = true
}


    /* =========================
       5️⃣ CREATE POST
    ========================= */

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
    return res
      .status(500)
      .json({ error: "Failed to create post" })
  }
}

/* ============================================================
   GLOBAL FEED (SAFE + WORLD ONLY)
============================================================ */

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10)
    const limit = parseInt(req.query.limit || "10", 10)
    const skip = (page - 1) * limit
    const userId = req.user?.userId

    const posts = await prisma.post.findMany({
      where: {
        communityId: null,      // 🔒 no community content
        rating: "SAFE",         // 🔞 no NSFW
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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
            category: {
              select: { key: true },
            },
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
        _count: {
          select: { likes: true },
        },
      },
    })

    const enriched = posts.map((p) => ({
      ...p,
      likedByMe: userId
        ? p.likes.length > 0
        : false,
      likes: undefined,
    }))

    return res.json({
      success: true,
      data: {
        items: enriched,
        page,
        hasMore: posts.length === limit,
      },
      error: null,
    })
  } catch (err) {
    console.error("getFeed error:", err)
    return res.status(500).json({
      success: false,
      data: null,
      error: { message: "Failed to load feed" },
    })
  }
}

/* ============================================================
   SCOPED FEEDS (STRICT SEPARATION)
============================================================ */

export const getScopedFeed = async (req, res) => {
  try {
    const { scope } = req.params

    if (!["LOCAL", "COUNTRY", "GLOBAL"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" })
    }

    const posts = await prisma.post.findMany({
      where: {
        scope,
        communityId: null,   // 🔒 world-only
        rating: "SAFE",      // 🔞 safe-only
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
            category: {
              select: { key: true },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    return res.json(posts)
  } catch (err) {
    console.error(err)
    res
      .status(500)
      .json({ error: "Failed to fetch feed" })
  }
}

/* ============================================================
   POSTS BY LABEL (WORLD ONLY)
============================================================ */

export const getPostsByLabel = async (req, res) => {
  try {
    const { key } = req.params

    const posts = await prisma.post.findMany({
      where: {
        communityId: null,   // 🔒 no community leakage
        rating: "SAFE",
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
            category: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    res.json(posts)
  } catch (err) {
    console.error("GET POSTS BY LABEL ERROR:", err)
    res
      .status(500)
      .json({ error: "Failed to fetch posts by label" })
  }
}
