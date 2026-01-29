import prisma from "../lib/prisma.js"

export const materializeCommunityFeed = async (
  communityId,
  date = new Date()
) => {
  // Normalize date to start of day (UTC-safe)
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  // 1. Load community + categories
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: { categories: true },
  })

  if (!community) return

  const categoryKeys = community.categories.map(
    (c) => c.categoryKey
  )

  // 🚨 No categories → nothing to materialize
  if (categoryKeys.length === 0) {
    console.warn(
      `Community ${communityId} has no categories; skipping materialization`
    )
    return
  }

  // 2. Scope acts as a ceiling
  const scopeHierarchy = {
    GLOBAL: ["GLOBAL"],
    COUNTRY: ["COUNTRY", "GLOBAL"],
    LOCAL: ["LOCAL", "COUNTRY", "GLOBAL"],
  }

  const allowedScopes = scopeHierarchy[community.scope]

  // 3. Fetch matching posts (NO hard day restriction)
  const posts = await prisma.post.findMany({
    where: {
      scope: { in: allowedScopes },
      categories: {
        some: {
          categoryKey: { in: categoryKeys },
        },
      },
    },
    include: {
      _count: {
        select: { likes: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // safety cap
  })

  if (posts.length === 0) return

  // 4. Rank posts: likes desc → recency
  const ranked = posts
    .map((p) => ({
      postId: p.id,
      score: p._count.likes,
      createdAt: p.createdAt,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.createdAt - a.createdAt
    })

  // 5. Clear existing feed for the day
  await prisma.communityFeedItem.deleteMany({
    where: {
      communityId,
      feedDate: startOfDay,
    },
  })

  // 6. Store materialized feed
  await prisma.communityFeedItem.createMany({
    data: ranked.map((item, index) => ({
      communityId,
      postId: item.postId,
      feedDate: startOfDay,
      rank: index + 1,
      score: item.score,
      reason: {
        matchedCategories: categoryKeys,
        scopeCeiling: community.scope,
        likes: item.score,
      },
    })),
  })
}
