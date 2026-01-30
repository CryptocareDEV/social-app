import prisma from "../lib/prisma.js"

export const materializeCommunityFeed = async (
  communityId,
  date = new Date()
) => {
  // Normalize date to start of day (UTC-safe)
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  // 1. Load community + label import rules
const community = await prisma.community.findUnique({
  where: { id: communityId },
})

if (!community) return

const labelImports = await prisma.communityLabelImport.findMany({
  where: { communityId },
})

// 🚨 No imports → nothing to materialize
if (labelImports.length === 0) {
  console.warn(
    `Community ${communityId} has no label imports; skipping materialization`
  )
  return
}


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

  let collectedPosts = []

for (const rule of labelImports) {
  let ratingFilter = {}

  // 🔒 SAFE community hard rule
  if (community.rating === "SAFE") {
    ratingFilter = { rating: "SAFE" }
  } else {
    if (rule.importMode === "SAFE_ONLY") {
      ratingFilter = { rating: "SAFE" }
    }
    if (rule.importMode === "NSFW_ONLY") {
      ratingFilter = { rating: "NSFW" }
    }
    // BOTH → no rating filter
  }

  const posts = await prisma.post.findMany({
    where: {
      communityId: null, // 🔒 no community leakage
      scope: { in: allowedScopes },
      categories: {
        some: {
          categoryKey: rule.categoryKey,
        },
      },
      ...ratingFilter,
    },
    include: {
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  collectedPosts.push(
    ...posts.map((p) => ({
      postId: p.id,
      score: p._count.likes,
      createdAt: p.createdAt,
      reason: {
        label: rule.categoryKey,
        importMode: rule.importMode,
        scopeCeiling: community.scope,
      },
    }))
  )
}


  if (posts.length === 0) return

  // 4. Deduplicate posts (same post may match multiple labels)
const unique = new Map()

for (const item of collectedPosts) {
  if (!unique.has(item.postId)) {
    unique.set(item.postId, item)
  }
}

const ranked = Array.from(unique.values()).sort((a, b) => {
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
