import prisma from "../lib/prisma.js"
import { loadCommunityWithCategories } from "./community.loader.js"


export const materializeCommunityFeed = async (
  communityId,
  date = new Date()
) => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const community = await loadCommunityWithCategories(communityId)
  if (!community) return

  

  /* ============================================================
     1️⃣ INTERNAL POSTS (ALWAYS INCLUDED)
  ============================================================ */

  const internalPosts = await prisma.post.findMany({
    where: {
      communityId: communityId,
      isRemoved: false,
    },
    include: {
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const internalItems = internalPosts.map((p) => ({
    postId: p.id,
    score: p._count.likes,
    createdAt: p.createdAt,
    reason: {
      type: "INTERNAL",
    },
  }))

  /* ============================================================
     2️⃣ EXTERNAL POSTS (LABEL FILTERED)
  ============================================================ */

  const labelImports = await prisma.communityLabelImport.findMany({
    where: { communityId },
  })

  let externalItems = []

  for (const rule of labelImports) {
  let ratingFilter = {}

  if (community.rating === "SAFE") {
    ratingFilter = { rating: "SAFE" }
  } else {
    if (rule.importMode === "SAFE_ONLY") {
      ratingFilter = { rating: "SAFE" }
    }
    if (rule.importMode === "NSFW_ONLY") {
      ratingFilter = { rating: "NSFW" }
    }
  }

  // 🔥 FULLY INDEPENDENT SCOPES
  const enabledScopes = []
  if (rule.global) enabledScopes.push("GLOBAL")
  if (rule.country) enabledScopes.push("COUNTRY")
  if (rule.local) enabledScopes.push("LOCAL")

  // If admin turned everything off → skip this label
  if (enabledScopes.length === 0) continue

  const posts = await prisma.post.findMany({
    where: {
      communityId: null,   // strictly external
      isRemoved: false,
      scope: { in: enabledScopes },

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

  externalItems.push(
    ...posts.map((p) => ({
      postId: p.id,
      score: p._count.likes,
      createdAt: p.createdAt,
      reason: {
        type: "EXTERNAL",
        label: rule.categoryKey,
        importMode: rule.importMode,
      },
    }))
  )
}


  /* ============================================================
     3️⃣ MERGE + DEDUPE
  ============================================================ */

  const combined = [...internalItems, ...externalItems]

  const unique = new Map()
  for (const item of combined) {
    if (!unique.has(item.postId)) {
      unique.set(item.postId, item)
    }
  }

  const ranked = Array.from(unique.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.createdAt - a.createdAt
  })

  /* ============================================================
     4️⃣ CLEAR ONLY TODAY'S FEED
  ============================================================ */

  await prisma.communityFeedItem.deleteMany({
    where: {
      communityId,
      feedDate: startOfDay,
    },
  })

  /* ============================================================
     5️⃣ STORE
  ============================================================ */

  await prisma.communityFeedItem.createMany({
    data: ranked.map((item, index) => ({
      communityId,
      postId: item.postId,
      feedDate: startOfDay,
      rank: index + 1,
      score: item.score,
      reason: item.reason,
    })),
  })
}
