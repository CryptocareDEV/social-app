import { useState, useRef } from "react"
import { api } from "../api/client"


export default function MemeEditor({ post, onClose, onPosted }) {
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [saving, setSaving] = useState(false)

  const canvasRef = useRef(null)

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginTop: 10,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
  }

  const buttonBase = {
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 14,
    cursor: "pointer",
  }

  const drawMemeToCanvas = () => {
  return new Promise((resolve) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = post.mediaUrl

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)
      ctx.font = "bold 48px Impact"
      ctx.fillStyle = "white"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 4
      ctx.textAlign = "center"

      ctx.fillText(topText, canvas.width / 2, 60)
      ctx.strokeText(topText, canvas.width / 2, 60)

      ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20)
      ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20)

      resolve(canvas)
    }
  })
}

const saveMeme = async () => {
  const canvas = await drawMemeToCanvas()
  const link = document.createElement("a")
  link.download = "meme.png"
  link.href = canvas.toDataURL("image/png")
  link.click()
}

const postMeme = async () => {
  console.log("POST MEME CLICKED")

  if (saving) return
  setSaving(true)

  try {
    const canvas = await drawMemeToCanvas()
    console.log("CANVAS READY", canvas)

    const memeDataUrl = canvas.toDataURL("image/png")
    console.log("DATA URL LENGTH", memeDataUrl.length)

    await api("/posts", {
  method: "POST",
  body: JSON.stringify({
    type: "MEME",
    caption: `${topText} / ${bottomText}`,
    mediaUrl: memeDataUrl,
    scope: post.scope, // ✅ inherit scope
  }),
})


    console.log("POST SUCCESS")
    onPosted()
  } catch (err) {
    console.error("POST FAILED", err)
  } finally {
    setSaving(false)
  }
}



  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ marginBottom: 12, color: "#111827" }}>
          Create meme
        </h3>

        {/* Preview */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          <img
            src={post.mediaUrl}
            alt=""
            style={{
              maxWidth: "100%",
              borderRadius: 12,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 0,
              right: 0,
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
              fontSize: 32,
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px black",
            }}
          >
            {bottomText}
          </div>
        </div>

        {/* Inputs */}
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

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <div>
            <button
              type="button"
              onClick={saveMeme}
              style={{
                ...buttonBase,
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                marginRight: 8,
              }}
            >
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonBase,
                background: "transparent",
                border: "none",
                color: "#374151",
              }}
            >
              Close
            </button>
          </div>

          <button
            type="button"
            onClick={postMeme}
            disabled={saving}
            style={{
              ...buttonBase,
              background: "#0284c7",
              color: "#fff",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Posting…" : "Post meme"}
          </button>
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  )
}
