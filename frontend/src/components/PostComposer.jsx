import { useState } from "react"
import { api } from "../api/client"
import { primaryButton } from "../ui/buttonStyles"


export default function PostComposer({ onPostCreated }) {
  const [type, setType] = useState("TEXT")
  const [caption, setCaption] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState("GLOBAL")

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginTop: 10,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    fontSize: 14,
  }
  const isInvalid =
  (type === "TEXT" && !caption.trim()) ||
  ((type === "IMAGE" || type === "VIDEO") && !mediaUrl.trim())


  const submit = async (e) => {
    e.preventDefault()
    setError("")
    if (isInvalid) {
  setError("Please add some content before posting.")
  return
}
    setLoading(true)

    try {
      await api("/posts", {
        method: "POST",
        body: JSON.stringify({
          type,
          caption,
          mediaUrl: type === "TEXT" ? undefined : mediaUrl,
          categories: ["reflection"],
          scope,
        }),
      })

      setCaption("")
      setMediaUrl("")
      setType("TEXT")
      setScope("GLOBAL")
      onPostCreated()
    } catch (err) {
      setError(err.error || "Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginBottom: 28,
        padding: 16,
        borderRadius: 12,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <h3 style={{ marginBottom: 10, color: "#111827" }}>
        Create post
      </h3>

      {error && (
        <p style={{ color: "#b91c1c", marginBottom: 8 }}>
          {error}
        </p>
      )}

      {/* Post type */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={inputStyle}
      >
        <option value="TEXT">Text</option>
        <option value="IMAGE">Image</option>
        <option value="VIDEO">Video</option>
      </select>

      {/* Scope */}
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        style={inputStyle}
      >
        <option value="GLOBAL">🌍 Global</option>
        <option value="COUNTRY">🏳️ Country</option>
        <option value="LOCAL">📍 Local</option>
      </select>

      {/* Caption */}
      <textarea
        placeholder="What’s on your mind?"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{
          ...inputStyle,
          minHeight: 90,
          resize: "vertical",
        }}
      />

      {/* Media URL */}
      {type !== "TEXT" && (
        <input
          placeholder="Paste media URL"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 14,
        }}
      >
        <button
  type="submit"
  disabled={loading || isInvalid}
  style={{
    ...primaryButton,
    opacity: loading || isInvalid ? 0.4 : 1,
    cursor: loading || isInvalid ? "not-allowed" : "pointer",
  }}
>
  {loading ? "Posting…" : "Post"}
</button>

      </div>
    </form>
  )
}
