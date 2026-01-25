import { useState } from "react"
import { api } from "../api/client"

export default function PostComposer({ onPostCreated }) {
  const [type, setType] = useState("TEXT")
  const [caption, setCaption] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState("GLOBAL")


  // 🔹 shared styles
  const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  marginTop: 8,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
}
  const buttonStyle = {
    marginTop: 12,
    padding: "8px 14px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
  }

  const submit = async (e) => {
    e.preventDefault()
    setError("")
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
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        background: "#fff",
        overflow: "hidden",

      }}
    >
      <h3 style={{ marginBottom: 8 }}>Create Post</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={inputStyle}
      >
        <option value="TEXT">Text</option>
        <option value="IMAGE">Image</option>
        <option value="VIDEO">Video</option>
      </select>

      <select
  value={scope}
  onChange={(e) => setScope(e.target.value)}
  style={{
    width: "100%",
    padding: "8px 10px",
    marginTop: 8,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  }}
>
  <option value="GLOBAL">🌍 Global</option>
  <option value="COUNTRY">🏳️ Country</option>
  <option value="LOCAL">📍 Local</option>
</select>

      <textarea
        placeholder="Write something..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ ...inputStyle, minHeight: 80, resize: "vertical", maxWidth: "100%"}}
      />

      {type !== "TEXT" && (
        <input
          placeholder="Media URL"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          style={inputStyle}
        />
      )}

      <button disabled={loading} style={buttonStyle}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  )
}
