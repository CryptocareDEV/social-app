import prisma from "../lib/prisma.js"
import { materializeCommunityFeed } from "./communityFeed.service.js"

export const reRankCommunitiesForPost = async (postId) => {
  // 1. Load post with categories
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      categories: true,
    },
  })

  if (!post) return

  const postCategoryKeys = post.categories.map(c => c.categoryKey)

  // 2. Find communities that care about this post
  const communities = await prisma.community.findMany({
    where: {
      scope: post.scope,
      categories: {
        some: {
          categoryKey: { in: postCategoryKeys },
        },
      },
    },
    select: { id: true },
  })

  // 3. Rebuild today's feed for each community
  for (const community of communities) {
    try {
      await materializeCommunityFeed(community.id)
    } catch (err) {
      console.error(
        `Failed to re-rank feed for community ${community.id}`,
        err
      )
    }
  }
}

