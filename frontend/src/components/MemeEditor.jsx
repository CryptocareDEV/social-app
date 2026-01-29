import { useState, useRef } from "react"
import { api } from "../api/client"
import { theme } from "../styles/theme"

export default function MemeEditor({ post, onClose, onPosted }) {
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [saving, setSaving] = useState(false)

  const canvasRef = useRef(null)

  // 🔐 SAFE IMAGE LOADER (avoids CORS-tainted canvas)
  const loadImageSafely = async () => {
    const res = await fetch(post.mediaUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = url
      img.onload = () => resolve({ img, url })
      img.onerror = reject
    })
  }

  const drawMemeToCanvas = async () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const { img, url } = await loadImageSafely()

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)
    ctx.font = "bold 48px Impact"
    ctx.fillStyle = "white"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 4
    ctx.textAlign = "center"

    if (topText) {
      ctx.fillText(topText, canvas.width / 2, 60)
      ctx.strokeText(topText, canvas.width / 2, 60)
    }

    if (bottomText) {
      ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20)
      ctx.strokeText(
        bottomText,
        canvas.width / 2,
        canvas.height - 20
      )
    }

    URL.revokeObjectURL(url)
    return canvas
  }

  // ⬇️ DOWNLOAD (WORKS RELIABLY)
  const downloadMeme = async () => {
    const canvas = await drawMemeToCanvas()

    canvas.toBlob((blob) => {
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "meme.png"
      link.click()
      URL.revokeObjectURL(link.href)
    })
  }

  // 🧬 POST MEME (unchanged logic)
  const postMeme = async () => {
    if (saving) return
    setSaving(true)

    try {
      const canvas = await drawMemeToCanvas()
      const memeDataUrl = canvas.toDataURL("image/png")

      const categories =
        post.categories?.map((c) => c.category.key) || []

      if (categories.length === 0) {
        throw new Error("Cannot create meme without categories")
      }

      await api("/posts", {
        method: "POST",
        body: JSON.stringify({
          type: "MEME",
          caption: `${topText}${bottomText ? " / " + bottomText : ""}`,
          mediaUrl: memeDataUrl,
          scope: post.scope,
          categories,
        }),
      })

      onPosted()
    } catch (err) {
      console.error("POST MEME FAILED", err)
      alert("Failed to create meme")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: theme.colors.card,
          padding: 20,
          maxWidth: 620,
          width: "100%",
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.md,
        }}
      >
        <h3 style={{ marginBottom: 12 }}>Create meme</h3>

        {/* Preview */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <img
            src={post.mediaUrl}
            alt=""
            style={{ maxWidth: "100%", borderRadius: 12 }}
          />

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 32,
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px black",
            }}
          >
            {topText}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 32,
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px black",
            }}
          >
            {bottomText}
          </div>
        </div>

        <input
          placeholder="Top text"
          value={topText}
          onChange={(e) => setTopText(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          placeholder="Bottom text"
          value={bottomText}
          onChange={(e) => setBottomText(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={downloadMeme}>Download</button>

          <div>
            <button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </button>
            <button onClick={postMeme} disabled={saving}>
              {saving ? "Posting…" : "Post meme"}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  )
}
