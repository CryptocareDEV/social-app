import { useState, useEffect } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"


export default function PostComposer({
  onPostCreated,
  refreshUserState,
  activeCommunity = null,
  feedMode = "GLOBAL",
  cooldownInfo = null,
  theme,
  isMinor = false,
  nsfwEnabled = false,
  isMobile = false,
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
  minHeight: 110,
  padding: "14px 16px",
  borderRadius: 16,
  border: `1px solid ${colors.border}`,
  fontSize: 15,
  lineHeight: 1.6,
  resize: "vertical",
  boxSizing: "border-box",
  color: colors.text,
  background: colors.surface,
  outline: "none",
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
const [file, setFile] = useState(null)
const [uploadedUrl, setUploadedUrl] = useState("")
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

const compressImage = async (file) => {
  // Skip small images
  if (file.size < 1 * 1024 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const maxWidth = 1920

      let { width, height } = img

      // Resize only if needed
      if (width > maxWidth) {
        const scale = maxWidth / width
        width = maxWidth
        height = height * scale
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, width, height)

      // Detect PNG transparency
      const isPNG = file.type === "image/png"

      let outputType = "image/jpeg"
      let quality = 0.82

      if (isPNG) {
        // Check transparency by sampling pixels
        const imageData = ctx.getImageData(0, 0, width, height).data
        let hasAlpha = false

        for (let i = 3; i < imageData.length; i += 4) {
          if (imageData[i] < 255) {
            hasAlpha = true
            break
          }
        }

        if (hasAlpha) {
          outputType = "image/png"
          quality = undefined
        }
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"))
            return
          }

          const compressedFile = new File(
            [blob],
            file.name,
            { type: blob.type }
          )

          resolve(compressedFile)
        },
        outputType,
        quality
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
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

      let finalMediaUrl = undefined

// 🔥 If IMAGE or VIDEO → upload first
if (type !== "TEXT") {
  if (!file) {
    setError("Please select a file")
    setLoading(false)
    return
  }

  const processedFile =
  type === "IMAGE"
    ? await compressImage(file)
    : file

const formData = new FormData()
formData.append("file", processedFile)
  
  const uploadData = await api("/media/upload", {
  method: "POST",
  body: formData,
  })

  finalMediaUrl = uploadData.url
  
}

const post = await api("/posts", {
  method: "POST",
  body: JSON.stringify({
    type,
    caption,
    mediaUrl: finalMediaUrl,
    scope,
    rating,
    categories: labels,
    communityId: postInCommunity
      ? effectiveCommunityId
      : null,
  }),
})


      setCaption("")
setFile(null)
setUploadedUrl("")
setSelectedLabels([])
setLabelInput("")
setType("TEXT")
setScope("GLOBAL")


      onPostCreated?.(post)
    } catch (err) {
  if (err?.cooldownUntil) {
    await refreshUserState?.()
  }

  alert(err?.error || "Action failed")
}
 finally {
      setLoading(false)
    }
  }

const scopeMeta = {
  GLOBAL: { icon: "🌍", label: "Global feed" },
  COUNTRY: { icon: "🏳️", label: "Country feed" },
  LOCAL: { icon: "📍", label: "Local feed" },
}

  return (
  <div
    style={{
  background: colors.surface,
  borderRadius: isMobile ? 0 : 20,
  marginBottom: isMobile ? 4 : 28,
  border: isMobile ? "none" : `1px solid ${colors.border}`,
  boxShadow: isMobile
    ? "none"
    : `0 4px 24px rgba(0,0,0,${theme.mode === "dark" ? 0.4 : 0.06})`,
  overflow: "hidden",
}}
  >
<div
  onClick={() => setOpen((v) => !v)}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isMobile ? 14 : 18,
    cursor: "pointer",
    borderBottom: open ? `1px solid ${colors.border}` : "none",
  }}
>
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <span
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: colors.text,
      }}
    >
      Create Post
    </span>

    <span
      style={{
        fontSize: 12,
        color: colors.textMuted,
      }}
    >
      Share something thoughtful
    </span>
  </div>

  <span
    style={{
      fontSize: 14,
      color: colors.textMuted,
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }}
  >
    ⌄
  </span>

</div>
{open && (
  <form
  onSubmit={submit}
  style={{
    padding: isMobile ? 14 : 20,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  }}
>

      {error && (
  <div
    style={{
      marginBottom: 12,
      padding: "10px 12px",
      borderRadius: 10,
      background: "rgba(255, 0, 0, 0.08)",
      border: "1px solid rgba(255, 0, 0, 0.2)",
      color: "#b00020",
      fontSize: 13,
    }}
  >
    {error}
  </div>
)}


      

      {/* Type */}
      <div
  style={{
    display: "flex",
    gap: 6,
    marginBottom: 10,
  }}
>
  {[
    { key: "TEXT", label: "✍️ Text" },
    { key: "IMAGE", label: "🖼 Image" },
    { key: "VIDEO", label: "🎥 Video" },
  ].map((t) => {
    const active = type === t.key

    return (
      <button
        key={t.key}
        type="button"
        onClick={() => setType(t.key)}
        style={{
          flex: 1,
          padding: "6px 10px",
          borderRadius: 999,
          border: active
  ? `1px solid ${colors.primary}`
  : `1px solid ${colors.border}`,
          background: active
  ? colors.primary + "15"
  : colors.surfaceMuted,
          color: active
            ? colors.primary
            : colors.textMuted,
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {t.label}
      </button>
    )
  })}
</div>

      {/* Scope */}
      <div
  style={{
    display: "flex",
    gap: 6,
    marginBottom: 12,
  }}
>
  {[
    { key: "GLOBAL", label: "🌍 Global" },
    { key: "COUNTRY", label: "🏳️ Country" },
    { key: "LOCAL", label: "📍 Local" },
  ].map((s) => {
    const active = scope === s.key

    return (
      <button
        key={s.key}
        type="button"
        onClick={() => setScope(s.key)}
        style={{
          flex: 1,
          padding: "6px 10px",
          borderRadius: 999,
          border: active
  ? `1px solid ${colors.primary}`
  : `1px solid ${colors.border}`,
          background: active
  ? colors.primary + "15"
  : colors.surfaceMuted,
          color: active
            ? colors.primary
            : colors.textMuted,
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {s.label}
      </button>
    )
  })}
</div>

      {/* NSFW Rating */}
{!isMinor &&
 nsfwEnabled &&
 (!activeCommunity || activeCommunity.rating === "NSFW") && (

  <div
    style={{
      marginTop: 8,
      marginBottom: 8,
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
        checked={rating === "NSFW"}
        onChange={(e) =>
          setRating(e.target.checked ? "NSFW" : "SAFE")
        }
      />
      Mark as NSFW
    </label>
  </div>
)}


      {/* Caption */}
<div
  style={{
    position: "relative",
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    transition: "border 0.15s ease",
  }}
>
  <textarea
    placeholder="What’s on your mind?"
    value={caption}
    onChange={(e) => {
      setCaption(e.target.value)
      if (error) setError("")
    }}
    onFocus={(e) => {
      e.target.parentElement.style.border =
        `1px solid ${colors.primary}`
    }}
    onBlur={(e) => {
      e.target.parentElement.style.border =
        `1px solid ${colors.border}`
    }}
    style={{
      width: "100%",
      minHeight: isMobile ? 100 : 120,
      padding: "14px 16px 32px 16px",
      borderRadius: 16,
      border: "none",
      fontSize: 15,
      lineHeight: 1.6,
      resize: "vertical",
      boxSizing: "border-box",
      color: colors.text,
      background: "transparent",
      outline: "none",
    }}
  />

  {/* Character Counter */}
  <div
    style={{
      position: "absolute",
      bottom: 8,
      right: 14,
      fontSize: 11,
      fontWeight: 500,
      color:
        caption.length > 420
          ? "#b00020"
          : caption.length > 380
          ? "#cc8800"
          : colors.textMuted,
      pointerEvents: "none",
    }}
  >
    {caption.length}/420
  </div>
</div>


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
    padding: 14,
    borderRadius: 16,
    background: theme.mode === "dark"
  ? "rgba(255,255,255,0.03)"
  : "rgba(0,0,0,0.02)",
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
  <div style={{ marginTop: 8 }}>
    <input
      type="file"
      accept={type === "IMAGE" ? "image/*" : "video/*"}
      onChange={(e) => {
  const selected = e.target.files[0]
  if (!selected) return

  const maxImageSize = 20 * 1024 * 1024   // 8MB
  const maxVideoSize = 45 * 1024 * 1024  // 20MB

  if (type === "IMAGE" && selected.size > maxImageSize) {
    setError("Image must be under 20MB")
    return
  }

  if (type === "VIDEO" && selected.size > maxVideoSize) {
    setError("Video must be under 45MB")
    return
  }

  setError("")
  setFile(selected)
  setUploadedUrl("")
}}
      style={inputStyle}
    />

    {file && (
      <div
        style={{
          fontSize: 12,
          marginTop: 6,
          color: colors.textMuted,
        }}
      >
        Selected: {file.name}
        <div style={{ fontSize: 11, opacity: 0.6 }}>
  {(file.size / (1024 * 1024)).toFixed(2)} MB
</div>
      </div>
    )}
  </div>
)}


      {/* Actions */}
<div style={{ marginTop: 12 }}>
  {/* Posting scope indicator */}
<div
  style={{
    marginBottom: 14,
    padding: "8px 12px",
    borderRadius: 12,
    background:
      theme.mode === "dark"
        ? "rgba(255,255,255,0.04)"
        : "rgba(0,0,0,0.03)",
    border: `1px solid ${colors.border}`,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: colors.textMuted,
  }}
>
  <span style={{ fontSize: 13 }}>
    {scopeMeta[scope].icon}
  </span>

  <span>
    Posting to{" "}
    <span
      style={{
        color: colors.primary,
        fontWeight: 600,
      }}
    >
      {scopeMeta[scope].label}
    </span>
  </span>
</div>
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
      disabled={
  loading ||
  (cooldownInfo?.type === "ACTION") ||
  caption.length > 420
}

      style={{
  padding: "10px 22px",
  borderRadius: 999,
  border: "none",
  background: loading || cooldownInfo
    ? colors.textMuted
    : colors.primary,
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor:
    loading || cooldownInfo
      ? "not-allowed"
      : "pointer",
  transition: "all 0.15s ease",
  boxShadow:
    !loading && !cooldownInfo
      ? `0 4px 14px ${colors.primary}40`
      : "none",
}}
    >
      {loading
  ? "Posting…"
  : cooldownInfo?.type === "ACTION"
? "On cooldown"
  : caption.length > 420
  ? "Too long"
  : "Post"}
    </button>
  </div>
</div>
        </form>
)}

  </div>
)
}
