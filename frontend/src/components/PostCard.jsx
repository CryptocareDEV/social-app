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

    try {
      await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          postId: post.id,
          reason: "OTHER",
        }),
      })
      alert("Report submitted")
    } catch (err) {
      alert(err?.error || "Failed to report post")
    }
  }

  return (
    <article
      style={{
        background: colors.surface,
        borderRadius: theme.radius.lg,
        padding: 16,
        marginBottom: 16,
        border: `1px solid ${colors.border}`,
        boxShadow: theme.shadow.sm,
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 8,
          alignItems: "center",
          fontSize: 13,
        }}
      >
        <Link
          to={`/profile/${post.user.id}`}
          style={{
            color: colors.text,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          @{post.user.username}
        </Link>

        <span style={{ fontSize: 12, color: colors.textMuted }}>
          {post.scope}
        </span>
      </header>

      {/* CAPTION */}
      {post.caption && (
        <p
          style={{
            color: colors.text,
            lineHeight: 1.6,
            marginBottom: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {post.caption}
        </p>
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
                background: colors.primarySoft,
                color: colors.primary,
                cursor: "pointer",
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
          marginTop: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button
          disabled={isLiking}
          onClick={() => onLike(post.id)}
        >
          {post.likedByMe ? "💙" : "🤍"} {post._count.likes}
        </button>

        <span
  title={
    isOnReportCooldown
      ? "Reporting paused due to repeated inaccurate reports"
      : severity === "CRITICAL"
      ? "Use for serious safety concerns only"
      : "Report content that violates rules"
  }
><button
  onClick={handleReport}
  disabled={isOnReportCooldown}
  style={{
    fontSize: 12,
    background: "transparent",
    border: "none",
    color: isOnReportCooldown ? "#94a3b8" : "#64748b",
    cursor: isOnReportCooldown ? "not-allowed" : "pointer",
  }}
>
  {isOnReportCooldown
    ? "Reporting temporarily paused"
    : severity === "CRITICAL"
    ? "Report (safety issue)"
    : "Report"}
</button>
</span>
      </footer>
    </article>
  )
}
