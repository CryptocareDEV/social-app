import { useState, useEffect } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"


export default function PostComposer({
  onPostCreated,
  setCooldownInfo = () => {},
  activeCommunity = null,
  feedMode = "GLOBAL",
  cooldownInfo = null,
  theme,
}) {
  const colors = getThemeColors(theme)
  const [open, setOpen] = useState(true)

  const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginTop: 8,
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  boxSizing: "border-box",
  background: colors.surface,
color: colors.text,

}

const textareaStyle = {
  width: "100%",
  minHeight: 90,
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  lineHeight: 1.5,
  resize: "vertical",
  marginBottom: 8,
  boxSizing: "border-box",
  color: colors.text,
background: colors.surface,

}

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  marginBottom: 8,
  background: colors.surface,
  color: colors.text,
}


  const [type, setType] = useState("TEXT")
  const [caption, setCaption] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [scope, setScope] = useState("GLOBAL")
  


  const [availableLabels, setAvailableLabels] = useState([])
  const [selectedLabels, setSelectedLabels] = useState([])
  const [labelInput, setLabelInput] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState("SAFE")
  const [postInCommunity, setPostInCommunity] = useState(false)

  // 🔹 Load global labels
  useEffect(() => {
    let mounted = true

    api("/categories")
      .then((res) => {
        if (mounted) setAvailableLabels(res || [])
      })
      .catch(() => {
        if (mounted) setAvailableLabels([])
      })

    return () => {
      mounted = false
    }
  }, [])

  // 🔹 Toggle existing label
  const toggleLabel = (key) => {
  setSelectedLabels((prev) => {
    if (prev.includes(key)) {
      return prev.filter((k) => k !== key)
    }
    if (prev.length >= 3) return prev
    return [...prev, key]
  })

 
  setLabelInput("")
}


  // 🔹 Create/select label on Enter
  const handleLabelInputKeyDown = async (e) => {
    if (e.key !== "Enter") return
    e.preventDefault()

    const key = labelInput.toLowerCase().trim()
    if (!key || selectedLabels.includes(key) || selectedLabels.length >= 3) {
      return
    }

    const exists = availableLabels.find((l) => l.key === key)

    if (!exists) {
      try {
        await api("/categories", {
          method: "POST",
          body: JSON.stringify({ key }),
        })
        setAvailableLabels((prev) => [...prev, { key }])
      } catch {
        // ignore duplicate creation errors
      }
    }

    setSelectedLabels((prev) => [...prev, key])
    setLabelInput("")
  }

  // 🔹 Submit post
  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let labels = [...selectedLabels]

      // 🔑 AUTO-PROMOTE typed label if present
      const typed = labelInput.toLowerCase().trim()
      if (typed && !labels.includes(typed) && labels.length < 3) {
        try {
          await api("/categories", {
            method: "POST",
            body: JSON.stringify({ key: typed }),
          })
        } catch {
          // ignore if it already exists
        }

        labels.push(typed)

        setAvailableLabels((prev) =>
          prev.some((l) => l.key === typed)
            ? prev
            : [...prev, { key: typed }]
        )
      }

      if (labels.length === 0) {
        setError("Please add at least one label")
        setLoading(false)
        return
      }
const effectiveCommunityId =
  feedMode === "COMMUNITY" && activeCommunity
    ? activeCommunity.id
    : null

      const post = await api("/posts", {
        method: "POST",
        body: JSON.stringify({
          type,
          caption,
          mediaUrl: type === "TEXT" ? undefined : mediaUrl,
          scope,
          rating,
          categories: labels,
          communityId: postInCommunity
  ? effectiveCommunityId
  : null,
        }),
      })

      setCaption("")
      setMediaUrl("")
      setSelectedLabels([])
      setLabelInput("")
      setType("TEXT")
      setScope("GLOBAL")

      onPostCreated?.(post)
    } catch (err) {
      if (err?.cooldownUntil) {
        setCooldownInfo({
          cooldownUntil: err.cooldownUntil,
        })
      }

      setError(err?.error || "Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  return (
  <div
    style={{
      background: colors.surface,
      borderRadius: theme.radius.lg,
      marginBottom: 24,
      border: `1px solid ${colors.border}`,
      boxShadow: theme.shadow.sm,
    }}
  >
<div
  onClick={() => setOpen((v) => !v)}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    cursor: "pointer",
    userSelect: "none",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: 15,
      fontWeight: 600,
      color: colors.text,
    }}
  >
    Create post
  </h3>

  <span style={{ fontSize: 13, color: colors.textMuted }}>
    {open ? "Hide" : "Show"}
  </span>
</div>
{open && (
  <form onSubmit={submit} style={{ padding: 16 }}>

      

      

      {/* Type */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={selectStyle}
      >
        <option value="TEXT">✍️ Text</option>
        <option value="IMAGE">🖼 Image</option>
        <option value="VIDEO">🎥 Video</option>
      </select>

      {/* Scope */}
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        style={selectStyle}
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
        style={textareaStyle}
      />

      {/* Label input */}
      <input
        placeholder="Type a label and press Enter"
        value={labelInput}
        onChange={(e) => setLabelInput(e.target.value)}
        onKeyDown={handleLabelInputKeyDown}
        style={inputStyle}
      />

      {/* 🔍 Label suggestions */}
      {labelInput && (
        <div
          style={{
            marginTop: 6,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            borderRadius: 12,
            padding: 6,
            background: colors.surface,
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          }}
        >
          {availableLabels
            .filter(
              (l) =>
                l.key.includes(labelInput.toLowerCase()) &&
                !selectedLabels.includes(l.key)
            )
            .slice(0, 5)
            .map((label) => (
              <div
                key={label.key}
                onClick={() => toggleLabel(label.key)}
                style={{
                  padding: "6px 10px",
                  fontSize: 13,
                  cursor: "pointer",
                  borderRadius: 8,
                  color: colors.text,  }}
              >
                #{label.key}
              </div>
            ))}
        </div>
      )}

      {/* Labels */}
      <div
  style={{
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
  }}
>
        <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
          Select up to 3 labels
        </p>

        {selectedLabels.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {selectedLabels.map((key) => (
              <span
                key={key}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  background: colors.primarySoft,
  color: colors.primary,
  border: `1px solid ${colors.primary}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                #{key}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedLabels((prev) =>
                      prev.filter((k) => k !== key)
                    )
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    color: colors.primary,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {type !== "TEXT" && (
        <input
          placeholder="Media URL"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Actions */}
<div style={{ marginTop: 12 }}>
  {feedMode === "COMMUNITY" && activeCommunity && (
    <div
      style={{
        marginBottom: 10,
        padding: "8px 12px",
        borderRadius: 10,
        background: colors.surfaceMuted,
border: `1px solid ${colors.border}`,
        fontSize: 13,
      }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={postInCommunity}
          onChange={(e) =>
            setPostInCommunity(e.target.checked)
          }
        />
        Post only inside{" "}
        <strong>{activeCommunity.name}</strong>
      </label>
    </div>
  )}

  <div style={{ display: "flex", justifyContent: "flex-end" }}>
    <button
      type="submit"
      disabled={loading || !!cooldownInfo}
      style={{
        padding: "8px 18px",
        borderRadius: 999,
        border: "none",
        background: cooldownInfo ? colors.textMuted : colors.primary,
        color: "#fff",
        fontWeight: 500,
        cursor:
          loading || cooldownInfo
            ? "not-allowed"
            : "pointer",
        opacity: loading || cooldownInfo ? 0.6 : 1,
      }}
    >
      {loading
        ? "Posting…"
        : cooldownInfo
        ? "On cooldown"
        : "Post"}
    </button>
  </div>
</div>
        </form>
)}

  </div>
)
}
