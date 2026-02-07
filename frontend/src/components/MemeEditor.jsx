import { useState, useRef, useEffect } from "react"
import { api } from "../api/client"
import { theme } from "../ui/theme"

export default function MemeEditor({ post, onClose, onPosted }) {
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [saving, setSaving] = useState(false)
  const [baseImageUrl, setBaseImageUrl] = useState(null)
  


  const canvasRef = useRef(null)

useEffect(() => {
  let mounted = true

  const loadBaseImage = async () => {
    try {
      // 🔑 Always ask backend for canonical root image
      const res = await api(`/posts/${post.id}/origin`)


      if (!res?.mediaUrl) {
        throw new Error("No root image returned from backend")
      }

      if (mounted) {
        setBaseImageUrl(res.mediaUrl)
      }
    } catch (err) {
      console.error("Failed to load base image", err)
      alert("Could not load meme base image")
    }
  }

  loadBaseImage()

  return () => {
    mounted = false
  }
}, [post.id])




  // 🔐 SAFE IMAGE LOADER (avoids CORS-tainted canvas)
  const loadImageDirect = () => {
  return new Promise((resolve, reject) => {
    if (!baseImageUrl) {
      reject("No base image URL")
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = baseImageUrl

    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
  })
}

const drawIntoCanvas = async (canvas, top, bottom) => {
  const ctx = canvas.getContext("2d")
  const img = await loadImageDirect()

  // Size FIRST
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  const padding = canvas.height * 0.05
  const maxWidth = canvas.width * 0.9

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  const fontSize = Math.max(
    Math.floor(canvas.width / 12),
    48
  )

  ctx.font = `bold ${fontSize}px Impact`
  ctx.fillStyle = "white"
  ctx.strokeStyle = "black"
  ctx.lineWidth = 4
  ctx.textAlign = "center"

  if (top) {
    ctx.textBaseline = "top"
    ctx.strokeText(top, canvas.width / 2, padding)
    ctx.fillText(top, canvas.width / 2, padding)
  }

  if (bottom) {
    ctx.textBaseline = "bottom"
    ctx.strokeText(
      bottom,
      canvas.width / 2,
      canvas.height - padding
    )
    ctx.fillText(
      bottom,
      canvas.width / 2,
      canvas.height - padding
    )
  }
}


  const drawMemeToCanvas = async (top, bottom) => {
  const canvas = canvasRef.current
  await drawIntoCanvas(canvas, top, bottom)
  return canvas
}



  // ⬇️ DOWNLOAD (WORKS RELIABLY)
  const downloadMeme = async () => {
    const exportCanvas = document.createElement("canvas")

await drawIntoCanvas(
  exportCanvas,
  topText,
  bottomText
)

exportCanvas.toBlob((blob) => {
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
      const exportCanvas = document.createElement("canvas")

await drawIntoCanvas(
  exportCanvas,
  topText,
  bottomText
)

const memeDataUrl =
  exportCanvas.toDataURL("image/png")


      const categories =
        post.categories?.map((c) => c.category.key) || []

      if (categories.length === 0) {
        throw new Error("Cannot create meme without categories")
      }

      await api("/posts", {
  method: "POST",
  body: JSON.stringify({
    type: "MEME",
    caption: "", // heading intentionally empty
    mediaUrl: memeDataUrl,   // 🔑 FINAL IMAGE WITH TEXT
    scope: post.scope,
    categories,
    originPostId:
      post.type === "MEME"
        ? post.originPostId ?? post.id
        : post.id,
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
{baseImageUrl && (
  <div style={{ marginBottom: 8 }}>
    <a
      href={baseImageUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: 12,
        color: "#2563eb",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      View original image
    </a>
  </div>
)}

        {/* Preview */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          
          {baseImageUrl ? (
  <img
    src={baseImageUrl}
    alt=""
    style={{ maxWidth: "100%", borderRadius: 12 }}
  />
) : (
  <div style={{ padding: 40, textAlign: "center" }}>
    Loading image…
  </div>
)}


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

      
      </div>
    </div>
  )
}


