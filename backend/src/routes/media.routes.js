import express from "express"
import multer from "multer"
import path from "path"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { requireAuth } from "../middleware/auth.middleware.js"
import { rateLimit } from "../middleware/rateLimit.middleware.js"

const router = express.Router()

// ==============================
// Spaces Client (S3 Compatible)
// ==============================
const s3 = new S3Client({
  region: process.env.SPACES_REGION,
  endpoint: process.env.SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
})

// ==============================
// Multer (Memory Storage)
// ==============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 20MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".mp4",
      ".webm",
      ".mov",
    ]

    const ext = path.extname(file.originalname).toLowerCase()

    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtensions.includes(ext)
    ) {
      cb(null, true)
    } else {
      cb(new Error("Unsupported file type"))
    }
  },
})

// ==============================
// POST /api/v1/media/upload
// ==============================
router.post(
  "/upload",
  requireAuth,
  rateLimit({ action: "MEDIA_UPLOAD" }),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
        })
      }

      const ext = path.extname(req.file.originalname).toLowerCase()

      const fileName =
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 10) +
        ext

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.SPACES_BUCKET,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
      )

      const fileUrl = `${process.env.SPACES_CDN_URL}/${fileName}`

      return res.json({ url: fileUrl })
    } catch (err) {
      console.error("SPACES UPLOAD ERROR:", err)
      return res.status(500).json({ error: "Upload failed" })
    }
  }
)

// ==============================
// Multer Error Handler
// ==============================
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message })
  }

  if (err) {
    return res.status(400).json({ error: err.message })
  }

  next()
})

export default router