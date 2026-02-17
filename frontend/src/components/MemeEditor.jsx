import { useState, useRef, useEffect } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"


export default function MemeEditor({ post, theme, onClose, onPosted }) {

  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [caption, setCaption] = useState("")
  const [saving, setSaving] = useState(false)
  const [baseImageUrl, setBaseImageUrl] = useState(null)
  const colors = getThemeColors(theme)

  


  const canvasRef = useRef(null)

useEffect(() => {
  let mounted = true

  const loadBaseImage = async () => {
    try {
      // 🔑 Always ask backend for canonical root image
      const res = await api(`/posts/${post.id}/origin`)
      console.log("Origin response:", res)



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

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(" ")
  const lines = []
  let currentLine = ""

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i] + " "
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine.trim())
      currentLine = words[i] + " "
    } else {
      currentLine = testLine
    }
  }

  lines.push(currentLine.trim())
  return lines
}

const drawIntoCanvas = async (canvas, top, bottom) => {
  const ctx = canvas.getContext("2d")
  const img = await loadImageDirect()

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  const padding = canvas.height * 0.05
  const maxWidth = canvas.width * 0.9

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  ctx.fillStyle = "white"
  ctx.strokeStyle = "black"
  ctx.lineWidth = 4
  ctx.textAlign = "center"

  const drawTextBlock = (text, position) => {
    if (!text) return

    let fontSize = Math.floor(canvas.width / 12)

    let lines
    do {
      ctx.font = `bold ${fontSize}px Impact`
      lines = wrapText(ctx, text.toUpperCase(), maxWidth)
      fontSize -= 2
    } while (
      lines.some(line => ctx.measureText(line).width > maxWidth) &&
      fontSize > 24
    )

    const lineHeight = fontSize * 1.2

    if (position === "top") {
      let y = padding
      ctx.textBaseline = "top"
      lines.forEach(line => {
        ctx.strokeText(line, canvas.width / 2, y)
        ctx.fillText(line, canvas.width / 2, y)
        y += lineHeight
      })
    }

    if (position === "bottom") {
      let y = canvas.height - padding - (lines.length * lineHeight)
      ctx.textBaseline = "top"
      lines.forEach(line => {
        ctx.strokeText(line, canvas.width / 2, y)
        ctx.fillText(line, canvas.width / 2, y)
        y += lineHeight
      })
    }
  }

  drawTextBlock(top, "top")
  drawTextBlock(bottom, "bottom")
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

    // ✅ Convert canvas to Blob (NOT base64)
    const blob = await new Promise((resolve) =>
      exportCanvas.toBlob(resolve, "image/jpeg", 0.8)
    )

    if (!blob) {
      throw new Error("Failed to generate image")
    }

    // ✅ Upload image first
    const formData = new FormData()
    formData.append("file", blob, "meme.jpg")

    const uploadRes = await api("/media/upload", {
      method: "POST",
      body: formData,
    })

    const imageUrl = uploadRes.url

    const categories =
      post.categories?.map((c) => c.category.key) || []

    if (categories.length === 0) {
      throw new Error("Cannot create meme without categories")
    }

    // ✅ Now create post with normal URL
    await api("/posts", {
      method: "POST",
      body: JSON.stringify({
        type: "MEME",
        caption: caption.trim(),
        mediaUrl: imageUrl,
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


const inputStyle = {
  
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10,
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
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
  style={{
    background: theme.mode === "dark"
  ? "#1e293b"
  : colors.card,
    padding: 20,
    maxWidth: 560,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.md,
    display: "flex",
    flexDirection: "column",
  }}
>
        <h3
  style={{
    margin: 0,
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  }}
>
  Create meme
</h3>

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
        <div
  style={{
    position: "relative",
    marginBottom: 16,
    width: "100%",
    display: "flex",
    justifyContent: "center",
  }}
>


          
          {baseImageUrl ? (
  <img
  src={baseImageUrl}
  alt=""
  style={{
  maxWidth: "100%",
  maxHeight: "65vh",
  objectFit: "contain",
  borderRadius: 12,
  display: "block",
}}

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
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    textAlign: "center",
    fontSize: "clamp(14px, 3vw, 26px)",
    fontWeight: 800,
    color: "white",
    textShadow: "2px 2px 4px black",
    wordBreak: "break-word",
    lineHeight: 1.2,
  }}
>
  {topText.toUpperCase()}
</div>


          <div
  style={{
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    textAlign: "center",
    fontSize: "clamp(14px, 3vw, 26px)",
    fontWeight: 800,
    color: "white",
    textShadow: "2px 2px 4px black",
    wordBreak: "break-word",
    lineHeight: 1.2,
  }}
>
  {bottomText.toUpperCase()}
</div>

        </div>

        <input
          placeholder="Top text"
          value={topText}
          onChange={(e) => setTopText(e.target.value)}
          style={inputStyle}
        />

        <input
  placeholder="Bottom text"
  value={bottomText}
  onChange={(e) => setBottomText(e.target.value)}
  style={inputStyle}
/>


        <textarea
  placeholder="Add a caption (optional)…"
  value={caption}
  onChange={(e) => setCaption(e.target.value)}
  maxLength={420}
  style={{
    ...inputStyle,
    minHeight: 80,
    resize: "vertical",
  }}
/>



<div
  style={{
    fontSize: 11,
    textAlign: "right",
    marginBottom: 16,
    color: colors.textMuted,
  }}
>
  {caption.length}/420
</div>



        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  }}
>
  <button
    onClick={downloadMeme}
    style={{
      fontSize: 13,
      padding: "8px 14px",
      borderRadius: 999,
      border: `1px solid ${colors.border}`,
      background: colors.surfaceMuted,
      color: colors.text,
      cursor: "pointer",
    }}
  >
    Download
  </button>

  <div style={{ display: "flex", gap: 10 }}>
    <button
      onClick={onClose}
      style={{
        fontSize: 13,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        background: "transparent",
        color: colors.textMuted,
        cursor: "pointer",
      }}
    >
      Cancel
    </button>

    <button
      onClick={postMeme}
      disabled={saving}
      style={{
        fontSize: 13,
        padding: "8px 18px",
        borderRadius: 999,
        border: "none",
        background: colors.primary,
        color: "#fff",
        fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        cursor: saving ? "not-allowed" : "pointer",
        opacity: saving ? 0.7 : 1,
      }}
    >
      {saving ? "Posting…" : "Post meme"}
    </button>
  </div>
</div>




      
      </div>
    </div>
  )
}


