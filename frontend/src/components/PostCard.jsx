import { Link } from "react-router-dom"
import { theme } from "../styles/theme"


export default function PostCard({ post, onLike, onMeme, currentUserId }) {
  const isOwnPost = post.user.id === currentUserId

  return (
    <article
  style={{
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: 16,
    background: theme.colors.card,
    boxShadow: theme.shadow.sm,
  }}
>

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <Link
            to={`/profile/${post.user.id}`}
            style={{
              fontWeight: 600,
              textDecoration: "none",
              color: "#111827",
            }}
          >
            @{post.user.username}
          </Link>

          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              marginLeft: 8,
              borderRadius: 999,
              background:
                post.scope === "GLOBAL"
                  ? "#e5e7eb"
                  : post.scope === "COUNTRY"
                  ? "#dbeafe"
                  : "#dcfce7",
              color: "#111827",
            }}
          >
            {post.scope.toLowerCase()}
          </span>
        </div>
      </header>

      {/* Caption */}
      {post.caption && post.type !== "MEME" && (
        <p
          style={{
            marginBottom: 12,
            lineHeight: 1.5,
            color: "#1f2937",
          }}
        >
          {post.caption}
        </p>
      )}

      {/* Media */}
      {(post.type === "IMAGE" || post.type === "MEME") && post.mediaUrl && (
        <div style={{ marginTop: 8 }}>
          <img
            src={post.mediaUrl}
            alt=""
            style={{
              maxWidth: "100%",
              borderRadius: 10,
              display: "block",
              margin: "0 auto",
            }}
          />

          {post.type === "IMAGE" && typeof onMeme === "function" && (
  <button
    type="button"
    onClick={() => onMeme(post)}
    style={{
      marginTop: 8,
      fontSize: 13,
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid #d1d5db",
      background: "#f9fafb",
      cursor: "pointer",
    }}
  >
    Create meme
  </button>
)}

        </div>
      )}

      {/* Video */}
      {post.type === "VIDEO" && (
        <video
          src={post.mediaUrl}
          controls
          style={{
            maxWidth: "100%",
            borderRadius: 10,
            marginTop: 8,
          }}
        />
      )}

      {/* Actions */}
      <footer style={{ marginTop: 14 }}>
  <button
  type="button"
  disabled={isOwnPost}
  onClick={() => onLike(post.id)}
  style={{
    border: "none",
    background: "transparent",
    cursor: isOwnPost ? "not-allowed" : "pointer",
    color: theme.colors.primary,
    fontWeight: 500,
    opacity: isOwnPost ? 0.4 : 1,
  }}
>
  ❤️ {post._count.likes}
</button>
</footer>
    </article>
  )
}
