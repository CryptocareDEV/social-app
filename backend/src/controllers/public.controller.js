import prisma from "../lib/prisma.js"

export const getPublicGlobalFeed = async (req, res) => {
  try {
    const { cursor, limit, label } = req.query
    const take = Math.min(parseInt(limit) || 10, 20)

    const whereClause = {
      scope: "GLOBAL",
      communityId: null,
      isRemoved: false,
      rating: "SAFE",
      ...(label &&
        label !== "ALL" && {
          categories: {
            some: {
              category: {
                key: label.toLowerCase(),
              },
            },
          },
        }),
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    let nextCursor = null

    if (posts.length > take) {
      const nextItem = posts.pop()
      nextCursor = nextItem.id
    }

    return res.json({
      items: posts.map((p) => ({
        id: p.id,
        type: p.type,
        caption: p.caption,
        mediaUrl: p.mediaUrl,
        createdAt: p.createdAt,
        scope: p.scope,
        rating: p.rating,
        user: p.user,
        categories: p.categories.map((c) => c.category.key),
        _count: p._count,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error("PUBLIC GLOBAL FEED ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch public feed",
    })
  }
}
