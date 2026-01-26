import { Link } from "react-router-dom"

export default function PostCard({ post, onLike, onMeme }) {
  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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

          {post.type === "IMAGE" && (
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
          onClick={() => onLike(post.id)}
          style={{
            fontSize: 14,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#111827",
          }}
        >
          ❤️ {post._count.likes}
        </button>
      </footer>
    </article>
  )
}
