import express from "express"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"))
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueName + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// POST /api/v1/media/upload
router.post("/upload", upload.single("file"), (req, res) => {
  console.log("UPLOAD FILE OBJECT:", req.file)

  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    })
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`

  console.log("Saved file path:", req.file.path)
  console.log("Returning URL:", fileUrl)

  return res.json({ url: fileUrl })
})


export default router
