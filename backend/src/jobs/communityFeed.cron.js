import cron from "node-cron"
import prisma from "../lib/prisma.js"
import { materializeCommunityFeed } from "../services/communityFeed.service.js"

export const startCommunityFeedCron = () => {
  // Runs every day at 00:05
  cron.schedule("5 0 * * *", async () => {
    console.log("🌙 Starting daily community feed materialization")

    const communities = await prisma.community.findMany({
      select: { id: true },
    })

    for (const community of communities) {
      try {
        await materializeCommunityFeed(community.id)
        console.log(`✅ Feed built for community ${community.id}`)
      } catch (err) {
        console.error(
          `❌ Failed to build feed for community ${community.id}`,
          err
        )
      }
    }

    console.log("🌅 Daily community feed materialization complete")
  })
}

