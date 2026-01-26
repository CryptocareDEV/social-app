import { api } from "../api/client"
import { useState, useRef } from "react"

export default function MemeEditor({ post, onClose, onPosted }) {
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [saving, setSaving] = useState(false)
  const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  marginTop: 8,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
}

const buttonStyle = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  marginRight: 6,
}

  const canvasRef = useRef(null)

  const saveMeme = () => {
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

      // Top text
      ctx.fillText(topText, canvas.width / 2, 60)
      ctx.strokeText(topText, canvas.width / 2, 60)

      // Bottom text
      ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20)
      ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20)

      const link = document.createElement("a")
      link.download = "meme.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
  }
const postMeme = async () => {
  if (saving) return
  setSaving(true)

  const canvas = canvasRef.current
  const ctx = canvas.getContext("2d")
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = post.mediaUrl

  img.onload = async () => {
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

    const memeDataUrl = canvas.toDataURL("image/png")

    await api("/posts", {
  method: "POST",
  body: JSON.stringify({
    type: "MEME",
    caption: `${topText} / ${bottomText}`,
    mediaUrl: memeDataUrl,
    scope: post.scope, 
  }),
})


    setSaving(false)
    onPosted()
  }
}
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ background: "#fff", padding: 16, maxWidth: 600 }}>
        <h3>Meme Editor</h3>

        <div style={{ position: "relative", textAlign: "center" }}>
          <img src={post.mediaUrl} alt="" style={{ maxWidth: "100%" }} />

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
        <div style={{ marginTop: 12 }}>
  <button style={buttonStyle} onClick={saveMeme}>
    Download
  </button>

  <button
    style={buttonStyle}
    onClick={postMeme}
    disabled={saving}
  >
    {saving ? "Posting…" : "Post Meme"}
  </button>

  <button
    style={{ ...buttonStyle, background: "#f3f4f6", color: "#111" }}
    onClick={onClose}
  >
    Close
  </button>
</div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  )
}
