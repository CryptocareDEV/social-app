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
import mediaRoutes from "./routes/media.routes.js"
import commentRoutes from "./routes/comment.routes.js"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import superuserRoutes from "./routes/superuser.routes.js"








dotenv.config()

const app = express()
app.disable("etag")
/* ================================
   🌐 CORS Configuration
================================ */
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5173", "http://localhost:4000"]

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser requests (like curl / mobile apps)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
)
/* ================================
   🛡 Security Headers
================================ */
app.use(helmet())
/* ================================
   🚦 Global Rate Limiter
================================ */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500, // much more forgiving
  standardHeaders: true,
  legacyHeaders: false,
})
/* ================================
   🔐 Login Rate Limiter
================================ */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // max 10 login attempts
  message: {
    error: "Too many login attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})


app.use(globalLimiter)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use("/api/v1/communities", communityRoutes)
app.use("/api/v1", feedProfileRoutes)
app.use("/api/v1", profileRoutes)
app.use("/api/v1/media", mediaRoutes)
app.use("/api/v1/comments", commentRoutes)
app.use("/api/v1/superusers", superuserRoutes)






app.use("/api/v1/auth/login", loginLimiter)
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
