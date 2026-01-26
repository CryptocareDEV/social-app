const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

import prisma from "../lib/prisma.js"

export const createPost = async (req, res) => {
  try {
    const { type, caption, mediaUrl, scope, categories } = req.body
    const userId = req.user.userId

    if (!type || !scope) {
      return res.status(400).json({ error: "Post type and scope required" })
    }

    if (type !== "TEXT" && !mediaUrl) {
      return res.status(400).json({
        error: "mediaUrl is required for IMAGE and VIDEO posts",
      })
    }

    const post = await prisma.post.create({
      data: {
        type,
        caption,
        mediaUrl,
        scope,
        userId,
        categories: categories
          ? {
              create: categories.map((key) => ({
                categoryKey: key,
              })),
            }
          : undefined,
      },
    })

    return res.status(201).json(post)
  } catch (err) {
    console.error("CREATE POST ERROR:", err)
    return res.status(500).json({ error: "Failed to create post" })
  }
}



export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10)
    const limit = parseInt(req.query.limit || "10", 10)
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
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
        _count: {
          select: { likes: true },
        },
      },
    })

    return res.json({
      success: true,
      data: {
        items: posts,
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
      error: {
        code: "FEED_ERROR",
        message: err.message,
      },
    })
  }
}

export const getScopedFeed = async (req, res) => {
  try {
    const { scope } = req.params

    if (!["LOCAL", "COUNTRY", "GLOBAL"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysPosts = await prisma.post.findMany({
      where: {
        scope,
        createdAt: { gte: today },
      },
      orderBy: [
        { likes: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true } },
      },
    })

    const olderPosts = await prisma.post.findMany({
      where: {
        scope,
        createdAt: { lt: today },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true } },
      },
    })

    res.json([...todaysPosts, ...olderPosts])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch feed" })
  }
}
