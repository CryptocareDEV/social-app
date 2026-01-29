import { useState } from "react"
import { Link } from "react-router-dom"
import { getThemeColors } from "../ui/theme"

export default function PostCard({
  post,
  onLike,
  onMeme,
  isLiking,
  onLabelClick,
  theme,
}) {
  const [showReason, setShowReason] = useState(false)
  const colors = getThemeColors(theme)

  console.log("POSTCARD POST:", post)

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

        <span
          style={{
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
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

      {/* MEDIA */}
      {(post.type === "IMAGE" || post.type === "MEME") &&
        post.mediaUrl && (
          <>
            <img
              src={post.mediaUrl}
              alt=""
              style={{
                width: "100%",
                borderRadius: theme.radius.md,
                marginTop: 10,
                border: `1px solid ${colors.border}`,
              }}
            />

            {post.type === "IMAGE" && (
              <button
                onClick={() => onMeme(post)}
                style={{
                  marginTop: 8,
                  background: "transparent",
                  border: "none",
                  color: colors.primary,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Create meme
              </button>
            )}
          </>
        )}

      {post.type === "VIDEO" && post.mediaUrl && (
        <video
          src={post.mediaUrl}
          controls
          style={{
            width: "100%",
            borderRadius: theme.radius.md,
            marginTop: 10,
            border: `1px solid ${colors.border}`,
          }}
        />
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 12 }}>
        <button
          disabled={isLiking}
          onClick={() => onLike(post.id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: post.likedByMe
              ? colors.primary
              : colors.textMuted,
            fontWeight: post.likedByMe ? 600 : 400,
          }}
        >
          {post.likedByMe ? "💙" : "🤍"}{" "}
          {post._count?.likes ?? 0}
        </button>
      </footer>
    </article>
  )
}
