import prisma from "../lib/prisma.js"

export const materializeCommunityFeed = async (
  communityId,
  date = new Date()
) => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // 1. Load community + categories
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: { categories: true },
  })

  if (!community) return

  const categoryKeys = community.categories.map(c => c.categoryKey)

  // 2. Fetch matching posts for the day
  const posts = await prisma.post.findMany({
    where: {
      scope: community.scope,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
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
  })

  // 3. Rank posts: likes desc → time desc
  const ranked = posts
    .map(p => ({
      postId: p.id,
      score: p._count.likes,
      createdAt: p.createdAt,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.createdAt - a.createdAt
    })

  // 4. Clear existing feed for the day
  await prisma.communityFeedItem.deleteMany({
    where: {
      communityId,
      feedDate: startOfDay,
    },
  })

  // 5. Store materialized feed
  await prisma.communityFeedItem.createMany({
    data: ranked.map((item, index) => ({
  communityId,
  postId: item.postId,
  feedDate: startOfDay,
  rank: index + 1,
  score: item.score,
  reason: {
    matchedCategory: categoryKeys,
    scope: community.scope,
    likesToday: item.score,
  },
})),
  })
}

