import fetch from "node-fetch"

export const proxyImage = async (req, res) => {
  try {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ error: "Missing image URL" })
    }

    // 🔒 Basic safety: only allow http/https
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid URL protocol" })
    }

    const response = await fetch(url)

    if (!response.ok) {
      return res.status(400).json({ error: "Failed to fetch image" })
    }

    const contentType = response.headers.get("content-type")

    // 🔒 Only allow images
    if (!contentType || !contentType.startsWith("image/")) {
      return res.status(400).json({ error: "URL is not an image" })
    }

    // 🔑 Forward image bytes
    res.setHeader("Content-Type", contentType)
    res.setHeader("Cache-Control", "public, max-age=86400")

    response.body.pipe(res)
  } catch (err) {
    console.error("IMAGE PROXY ERROR:", err)
    res.status(500).json({ error: "Image proxy failed" })
  }
}

