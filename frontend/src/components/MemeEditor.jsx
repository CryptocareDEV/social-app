import { useState, useRef, useEffect } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"


export default function MemeEditor({
  post,
  theme,
  onClose,
  onPosted,
  refreshUserState,
}) {

  const [textBlocks, setTextBlocks] = useState([
  { id: "top", text: "", x: 0.5, y: 0.16 },
  { id: "bottom", text: "", x: 0.5, y: 0.85 },
])
  const [caption, setCaption] = useState("")
  const [saving, setSaving] = useState(false)
  const [baseImageUrl, setBaseImageUrl] = useState(null)
  const [fontFamily, setFontFamily] = useState("Impact")
  const [isItalic, setIsItalic] = useState(false)
  const [activeBlockId, setActiveBlockId] = useState(null)
  const isDraggingRef = useRef(false)
  const colors = getThemeColors(theme)
  const previewCanvasRef = useRef(null)
  const loadedImageRef = useRef(null)


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
        loadedImageRef.current = null
      }
    } catch (err) {
  console.error("Failed to load base image", err)

  if (err?.error?.includes?.("NSFW") || err?.status === 403) {
    alert("This image is not available.")
  } else {
    alert("Could not load meme base image")
  }

  // Prevent further canvas operations
  if (mounted) {
    setBaseImageUrl(null)
  }
}
  }

  loadBaseImage()

  return () => {
    mounted = false
  }
}, [post.id])

useEffect(() => {
  if (!baseImageUrl) return
  if (!previewCanvasRef.current) return

  const setupAndDraw = async () => {
    const img = await loadImageDirect()
    const canvas = previewCanvasRef.current

    const maxPreviewWidth = 900
    const scale = Math.min(1, maxPreviewWidth / img.naturalWidth)

    canvas.width = img.naturalWidth * scale
    canvas.height = img.naturalHeight * scale

    // 🔥 Immediately draw after sizing
    await drawIntoCanvas(canvas)
  }

  setupAndDraw()
}, [baseImageUrl])

useEffect(() => {
  if (!previewCanvasRef.current) return
  if (!baseImageUrl) return

  drawIntoCanvas(previewCanvasRef.current)
}, [textBlocks, fontFamily, isItalic])


  const loadImageDirect = () => {
  return new Promise((resolve, reject) => {
    if (loadedImageRef.current) {
      resolve(loadedImageRef.current)
      return
    }

    if (!baseImageUrl) {
      reject("No base image URL")
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = baseImageUrl

    img.onload = () => {
      loadedImageRef.current = img
      resolve(img)
    }

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

const drawIntoCanvas = async (canvas) => {
  if (!canvas) {
    throw new Error("Canvas not available")
  }

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get canvas context")
  }

  const img = await loadImageDirect()
const scaleX = canvas.width / img.naturalWidth
const scaleY = canvas.height / img.naturalHeight

  

  // 🔥 Improved padding logic (aspect-aware)
  const basePadding = Math.max(canvas.height * 0.06, canvas.width * 0.04)
  const maxWidth = canvas.width * 0.88
  const maxTextHeight = canvas.height * 0.4 // each block max 40% height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  ctx.textAlign = "center"
  ctx.fillStyle = "white"
  ctx.strokeStyle = "black"

  // Ensure selected font is loaded before measuring
if (document.fonts && fontFamily) {
  try {
    await document.fonts.load(
      `${isItalic ? "italic" : "normal"} 900 40px ${fontFamily}`
    )
  } catch (e) {
    // ignore font load errors
  }
}

  const drawTextBlock = (block) => {
    if (!block.text) return

    const content = block.text.toUpperCase().trim()

    let fontSize = Math.floor(canvas.width / 10)
    let lines = []
    let lineHeight = 0
    let blockHeight = 0

    // 🔥 Height + width aware shrink loop
    
    while (fontSize > 22) {
      ctx.font = `${isItalic ? "italic" : "normal"} 900 ${fontSize}px ${fontFamily}, Arial Black, sans-serif`
      lines = wrapText(ctx, content, maxWidth)
      lineHeight = fontSize * 1.15
      blockHeight = lines.length * lineHeight

      const widestLine = Math.max(
        ...lines.map(line => ctx.measureText(line).width)
      )

      if (
        widestLine <= maxWidth &&
        blockHeight <= maxTextHeight
      ) {
        break
      }

      fontSize -= 2
    }

    // 🔥 Dynamic stroke thickness
    ctx.lineWidth = Math.max(canvas.width / 250, 3)

    const centerX = block.x * canvas.width
const centerY = block.y * canvas.height

const startY = centerY - blockHeight / 2

    ctx.textBaseline = "top"

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight

      // Layered stroke for cleaner outline
      ctx.strokeText(line, centerX, y)
ctx.fillText(line, centerX, y)
    })
  }

  textBlocks.forEach(block => {
  if (!block.text?.trim()) return
  drawTextBlock(block)
})

  // 🔥 Hybrid Watermark (Subtle CivicHalls branding)
  const watermark = "CivicHalls.com"
  const watermarkSize = Math.max(canvas.width / 40, 18)

  ctx.font = `600 ${watermarkSize}px Inter, sans-serif`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.globalAlpha = 0.6
  ctx.fillStyle = "white"
  ctx.strokeStyle = "black"
  ctx.lineWidth = Math.max(canvas.width / 500, 2)

  const wmX = canvas.width - basePadding * 0.6
  const wmY = canvas.height - basePadding * 0.6

  ctx.strokeText(watermark, wmX, wmY)
  ctx.fillText(watermark, wmX, wmY)

  ctx.globalAlpha = 1
}


  // ⬇️ DOWNLOAD (WORKS RELIABLY)
  const downloadMeme = async () => {
    const exportCanvas = document.createElement("canvas")

const img = await loadImageDirect()

// Full resolution export
exportCanvas.width = img.naturalWidth
exportCanvas.height = img.naturalHeight

await drawIntoCanvas(exportCanvas)

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
  if (!baseImageUrl) {
  alert("Base image unavailable")
  return
}
  setSaving(true)

  try {
    const exportCanvas = document.createElement("canvas")

const img = await loadImageDirect()

// Full resolution export
exportCanvas.width = img.naturalWidth
exportCanvas.height = img.naturalHeight

await drawIntoCanvas(exportCanvas)

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

    const categories = Array.isArray(post.categories)
  ? post.categories
  : []

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
        originPostId: post.id,
      }),
    })

    onPosted()
  } catch (err) {
  if (err?.cooldownUntil) {
    await refreshUserState?.()
  }

  alert(err?.error || "Action failed")
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

const startDrag = (clientX, clientY) => {
  const canvas = previewCanvasRef.current
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleY = canvas.height / rect.height
  const mouseY = (clientY - rect.top) * scaleY

  const clicked = textBlocks.find(block => {
    const blockY = block.y * canvas.height
    return Math.abs(blockY - mouseY) < canvas.height * 0.08
  })

  if (clicked) {
    setActiveBlockId(clicked.id)
    isDraggingRef.current = true
  }
}

const moveDrag = (clientX, clientY) => {
  if (!isDraggingRef.current || !activeBlockId) return

  const canvas = previewCanvasRef.current
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()

  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  const mouseX = (clientX - rect.left) * scaleX
  const mouseY = (clientY - rect.top) * scaleY

  const normalizedX = mouseX / canvas.width
  const normalizedY = mouseY / canvas.height

  setTextBlocks(prev =>
    prev.map(b =>
      b.id === activeBlockId
        ? {
            ...b,
            x: Math.min(Math.max(normalizedX, 0.05), 0.95),
            y: Math.min(Math.max(normalizedY, 0.05), 0.95),
          }
        : b
    )
  )
}

const endDrag = () => {
  isDraggingRef.current = false
  setActiveBlockId(null)
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
  <canvas
  ref={previewCanvasRef}
  style={{
    maxWidth: "100%",
    maxHeight: "65vh",
    borderRadius: 12,
    display: "block",
    cursor: activeBlockId ? "grabbing" : "grab",
    touchAction: "none", // 🔥 critical for mobile drag
  }}

  // -------------------
  // DESKTOP
  // -------------------
  onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
  onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
  onMouseUp={endDrag}
  onMouseLeave={endDrag}

  // -------------------
  // MOBILE
  // -------------------
  onTouchStart={(e) => {
    const touch = e.touches[0]
    startDrag(touch.clientX, touch.clientY)
  }}
  onTouchMove={(e) => {
    e.preventDefault() // 🔥 prevents scroll interference
    const touch = e.touches[0]
    moveDrag(touch.clientX, touch.clientY)
  }}
  onTouchEnd={endDrag}
/>

) : (
  <div style={{ padding: 40, textAlign: "center" }}>
    Loading image…
  </div>
)}


        </div>
<select
  value={fontFamily}
  onChange={(e) => setFontFamily(e.target.value)}
  style={{
    ...inputStyle,
    cursor: "pointer",
  }}
>
  <option value="Impact">Impact (Classic)</option>
  <option value="Arial Black">Arial Black</option>
  <option value="Anton">Anton</option>
  <option value="Bebas Neue">Bebas Neue</option>
  <option value="Montserrat">Montserrat</option>
</select>
<label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
  <input
    type="checkbox"
    checked={isItalic}
    onChange={(e) => setIsItalic(e.target.checked)}
  />
  Italic style
</label>
        <input
          placeholder="Top text"
          value={textBlocks[0].text}
onChange={(e) =>
  setTextBlocks(prev =>
    prev.map(b =>
      b.id === "top" ? { ...b, text: e.target.value } : b
    )
  )
}
          style={inputStyle}
        />

        <input
  placeholder="Bottom text"
  value={textBlocks[1].text}
onChange={(e) =>
  setTextBlocks(prev =>
    prev.map(b =>
      b.id === "bottom" ? { ...b, text: e.target.value } : b
    )
  )
}
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


