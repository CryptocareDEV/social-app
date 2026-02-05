import likeRoutes from "./routes/like.routes.js"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
import postRoutes from "./routes/post.routes.js"
import userRoutes from "./routes/user.routes.js"
import communityRoutes from "./routes/community.routes.js"
import invitationRoutes from "./routes/invitation.routes.js"
import { startCommunityFeedCron } from "./jobs/communityFeed.cron.js"
import categoryRoutes from "./routes/category.routes.js"
import communityChatRoutes from "./routes/communityChat.routes.js"
import profileRoutes from "./routes/profile.routes.js"
import reportRoutes from "./routes/report.routes.js"
import moderationRoutes from "./routes/moderation.routes.js"
import feedProfileRoutes from "./routes/feedProfile.routes.js"





dotenv.config()

const app = express()
app.disable("etag")
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use("/api/v1/communities", communityRoutes)
app.use("/api/v1", feedProfileRoutes)
app.use("/api/v1", profileRoutes)




app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/reports", reportRoutes)
app.use("/api/v1/moderation", moderationRoutes)
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/likes", likeRoutes)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/invitations", invitationRoutes)
app.use("/api/v1/communities", communityChatRoutes)



startCommunityFeedCron()



app.get("/", (req, res) => {
  res.send("API is alive")
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
