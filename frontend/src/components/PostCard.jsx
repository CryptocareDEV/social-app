import { Link } from "react-router-dom"
import { theme } from "../styles/theme"


export default function PostCard({ post, onLike, onMeme, isLiking }) {

  return (
  <article
    style={{
      background: "#ffffff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      border: "1px solid #e5e7eb",
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          to={`/profile/${post.user.id}`}
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "#0f172a",
            textDecoration: "none",
          }}
        >
          @{post.user.username}
        </Link>

        <span
          style={{
            fontSize: 11,
            padding: "2px 10px",
            borderRadius: 999,
            background:
              post.scope === "GLOBAL"
                ? "#e0f2fe"
                : post.scope === "COUNTRY"
                ? "#ede9fe"
                : "#dcfce7",
            color: "#0f172a",
            textTransform: "lowercase",
          }}
        >
          {post.scope}
        </span>
      </div>
    </header>

    {/* Caption */}
    {post.caption && post.type !== "MEME" && (
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "#1f2937",
          marginBottom: 12,
          whiteSpace: "pre-wrap",
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
            width: "100%",
            borderRadius: 14,
            display: "block",
          }}
        />

        {post.type === "IMAGE" && (
          <button
            type="button"
            onClick={() => onMeme(post)}
            style={{
              marginTop: 10,
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#0284c7",
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
          width: "100%",
          borderRadius: 14,
          marginTop: 8,
        }}
      />
    )}

    {/* Actions */}
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: 14,
      }}
    >
      <button
        type="button"
        disabled={isLiking}
        onClick={() => onLike(post.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          border: "none",
          background: "transparent",
          cursor: isLiking ? "not-allowed" : "pointer",
          color: post.likedByMe ? "#0284c7" : "#475569",
          opacity: isLiking ? 0.6 : 1,
          transition: "color 0.15s ease",
        }}
      >
        {post.likedByMe ? "💙" : "🤍"} {post._count.likes}
      </button>
    </footer>
  </article>
)
}