import { useState } from "react"
import { api } from "../api/client"
import { primaryButton } from "../ui/buttonStyles"
import { theme } from "../styles/theme"



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
      background: "#ffffff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    }}
  >
    {/* Header */}
    <h3
      style={{
        marginBottom: 12,
        fontSize: 15,
        fontWeight: 600,
        color: "#0f172a",
      }}
    >
      Create post
    </h3>

    {error && (
      <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>
        {error}
      </p>
    )}

    {/* Type */}
    <select
      value={type}
      onChange={(e) => setType(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        fontSize: 14,
        marginBottom: 8,
      }}
    >
      <option value="TEXT">✍️ Text</option>
      <option value="IMAGE">🖼 Image</option>
      <option value="VIDEO">🎥 Video</option>
    </select>

    {/* Scope */}
    <select
      value={scope}
      onChange={(e) => setScope(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        fontSize: 14,
        marginBottom: 8,
      }}
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
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  minHeight: 90,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  fontSize: 14,
  lineHeight: 1.5,
  resize: "vertical",
  marginBottom: 8,
}}
    />

    {/* Media URL */}
    {type !== "TEXT" && (
      <input
        placeholder="Media URL"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          fontSize: 14,
          marginBottom: 8,
        }}
      />
    )}

    {/* Actions */}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 12,
      }}
    >
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "8px 18px",
          borderRadius: 999,
          border: "none",
          background: "#0284c7",
          color: "#fff",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Posting…" : "Post"}
      </button>
    </div>
  </form>
)
}
