import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { api } from "../api/client"

export default function PostCard({
  post,
  onLike,
  onMeme,
  isLiking,
  onLabelClick,
  theme,
}) {
  if (post.isRemoved) {
  return null
}
  const [showReason, setShowReason] = useState(false)
  const [reportCooldownUntil, setReportCooldownUntil] = useState(null)
  const [hasReported, setHasReported] = useState(false)

  const severityCopy = {
  LOW: {
    tone: "#64748b",
    text: "Content may be low quality or off-topic",
  },
  MEDIUM: {
    tone: "#92400e",
    text: "Content visibility is limited due to reports",
  },
  HIGH: {
    tone: "#7c2d12",
    text: "Content removed for policy violations",
  },
  CRITICAL: {
    tone: "#7f1d1d",
    text: "Sensitive content restricted for safety",
  },
}

  const colors = getThemeColors(theme)
  // 🔑 Render post's own media (MEME and IMAGE are first-class)
  const imageSrc = post.mediaUrl || null



  const severity = (() => {
  if (!post?.rating) return null

  if (post.rating === "NSFW") return "CRITICAL"

  if (post.reason?.autoLimited) return "MEDIUM"

  if (post.reason?.moderationOutcome === "REMOVED")
    return "HIGH"

  return null
})()


  /* ================================
     🔎 Load user cooldown (once)
  ================================= */
  useEffect(() => {
    let mounted = true

    const loadMe = async () => {
      try {
        const me = await api("/users/me")
        if (mounted && me?.reportCooldownUntil) {
         setReportCooldownUntil(me.reportCooldownUntil)
        }
      } catch {
        // backend still enforces cooldown
      }
    }

    loadMe()
    return () => {
      mounted = false
    }
  }, [])

  /* ================================
     ⛔ Derived cooldown state
  ================================= */
  const isOnReportCooldown =
    reportCooldownUntil &&
    new Date(reportCooldownUntil) > new Date()

  /* ================================
     🚩 Report handler
  ================================= */
  const handleReport = async () => {
  if (isOnReportCooldown) {
    alert("Reporting is temporarily disabled due to cooldown")
    return
  }

  if (hasReported) {
    return
  }

  try {
    await api("/reports", {
      method: "POST",
      body: JSON.stringify({
        postId: post.id,
        reason: "OTHER",
      }),
    })

    setHasReported(true)
    alert("Report submitted. Thank you for helping keep the community safe.")
  } catch (err) {
    alert(err?.error || "Failed to report post")
  }
}


const actionButtonStyle = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: theme.radius.pill,
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.textMuted,
  cursor: "pointer",
  transition: "background 0.15s ease, color 0.15s ease",
}


  return (
    <article
  style={{
    background: colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    border: `1px solid ${colors.border}`,
    boxShadow: theme.shadow.sm,
    transition: "box-shadow 0.18s ease, transform 0.18s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = theme.shadow.md
    e.currentTarget.style.transform = "translateY(-1px)"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = theme.shadow.sm
    e.currentTarget.style.transform = "translateY(0)"
  }}
>
      {/* HEADER */}
      <header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    fontSize: 13,
  }}
>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <Link
      to={`/profile/${post.user.id}`}
      style={{
        color: colors.text,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      @{post.user.username}
    </Link>

    <span
  style={{
    fontSize: 12,
    color: colors.textMuted,
    opacity: 0.75,
  }}
>
  {post.scope}
</span>
  </div>

<div style={{ marginLeft: "auto" }}>
  <span
  title={
  hasReported
    ? "You’ve already reported this post"
    : isOnReportCooldown
    ? "Reporting paused due to repeated inaccurate reports"
    : severity === "CRITICAL"
    ? "Use for serious safety concerns only"
    : "Report content that violates rules"
}

  
>
  <button
  onClick={handleReport}
  disabled={isOnReportCooldown}
  style={{
  ...actionButtonStyle,
  color: isOnReportCooldown ? "#94a3b8" : "#64748b",
  borderStyle: "dashed",
  opacity: 0.75,
  cursor: isOnReportCooldown ? "not-allowed" : "pointer",
}}
onMouseEnter={(e) => {
  if (!isOnReportCooldown) e.currentTarget.style.opacity = 1
}}
onMouseLeave={(e) => {
  e.currentTarget.style.opacity = 0.75
}}

>
  {isOnReportCooldown
    ? "Reporting paused"
    : severity === "CRITICAL"
    ? "Report (safety)"
    : "Report"}


</button>

</span>
</div>
</header>

      {/* CAPTION */}
      {post.caption && (
        <p
          style={{
            color: colors.text,
            lineHeight: 1.6,
            marginBottom: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {post.caption}
        </p>
      )}

{/* IMAGE / MEME */}
{imageSrc && (
  <div
    style={{
      marginTop: 12,
      borderRadius: theme.radius.md,
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
      background: colors.surfaceMuted,
      position: "relative",
    }}
  >
    <img
      src={imageSrc}
      alt={post.type === "MEME" ? "Meme image" : "Post media"}
      loading="lazy"
      style={{
        width: "100%",
        display: "block",
        maxHeight: 520,
        objectFit: "contain",
        background: colors.bg,
      }}
    />
    {/* 📝 MEME TEXT OVERLAY */}
    {post.type === "MEME" && post.memeMeta && (
  <>
    {/* TOP TEXT */}
    {post.memeMeta.topText && (
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "90%",
          padding: "6px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          textAlign: "center",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {post.memeMeta.topText}
      </div>
    )}

    {/* BOTTOM TEXT */}
    {post.memeMeta.bottomText && (
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "90%",
          padding: "6px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          textAlign: "center",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {post.memeMeta.bottomText}
      </div>
    )}
  </>
)}


  </div>
)}





      {/* WHY AM I SEEING THIS */}
      {post.reason && (
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setShowReason((s) => !s)}
            style={{
              fontSize: 12,
              color: colors.textMuted,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {showReason ? "Hide why" : "Why am I seeing this?"}
          </button>

          {showReason && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                background: colors.surfaceMuted,
                borderRadius: theme.radius.sm,
                fontSize: 12,
                color: colors.textMuted,
                border: `1px solid ${colors.border}`,
              }}
            >
              {post.reason.matchedCategories?.length > 0 && (
                <div>
                  <strong>Matched labels:</strong>{" "}
                  {post.reason.matchedCategories.join(", ")}
                </div>
              )}

              {post.reason.scopeCeiling && (
                <div>
                  <strong>Community scope:</strong>{" "}
                  {post.reason.scopeCeiling}
                </div>
              )}

              {"likes" in post.reason && (
                <div>
                  <strong>Engagement:</strong>{" "}
                  {post.reason.likes} likes
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LABELS */}
      {post.categories?.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          {post.categories.map((c) => (
            <span
              key={c.category.key}
              onClick={() => onLabelClick(c.category.key)}
              style={{
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: theme.radius.pill,
    background:
      theme.mode === "dark"
        ? "rgba(59,130,246,0.15)"
        : "rgba(37,99,235,0.08)",
    color:
      theme.mode === "dark"
        ? "#bfdbfe"
        : "#1e3a8a",
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    fontWeight: 500,
  }}
            >
              #{c.category.key}
            </span>
          ))}
        </div>
      )}
{severity && severityCopy[severity] && (
  <div
    style={{
      marginTop: 10,
      padding: "8px 10px",
      borderRadius: 8,
      fontSize: 12,
      background: "#fff7ed",
      color: severityCopy[severity].tone,
      border: "1px solid #fed7aa",
    }}
  >
    ⚠️ {severityCopy[severity].text}
  </div>
)}

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button
  disabled={isLiking}
  onClick={() => onLike(post.id)}
  style={{
    ...actionButtonStyle,
    fontWeight: 500,
    color: post.likedByMe ? colors.primary : colors.textMuted,
    borderColor: post.likedByMe ? colors.primarySoft : colors.border,
  }}
>
  {post.likedByMe ? "💙" : "🤍"} {post._count.likes}
</button>

{/* MEME (image-only) */}
  {["IMAGE", "MEME"].includes(post.type) && imageSrc && (
  <button
    onClick={() => onMeme(post)}
    style={{
      fontSize: 12,
      padding: "6px 10px",
      borderRadius: theme.radius.pill,
      border: `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.textMuted,
      opacity: 0.75,
      cursor: "pointer",
      transition: "opacity 0.15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = 1
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = 0.75
    }}
  >
    🖼️ Meme
  </button>
)}


        
      </footer>
    </article>
  )
}
