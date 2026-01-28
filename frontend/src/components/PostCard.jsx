import { useState } from "react"
import { Link } from "react-router-dom"



export default function PostCard({
  post,
  onLike,
  onMeme,
  isLiking,
  onLabelClick,
}) {
  const [showReason, setShowReason] = useState(false)

  console.log("POSTCARD POST:", post)

  return (
    <article
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <header style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Link to={`/profile/${post.user.id}`}>
          @{post.user.username}
        </Link>
        <span style={{ fontSize: 12 }}>{post.scope}</span>
      </header>

      {post.caption && <p>{post.caption}</p>}

      {post.reason && (
  <div style={{ marginTop: 6 }}>
    <button
      type="button"
      onClick={() => setShowReason((s) => !s)}
      style={{
        fontSize: 12,
        color: "#475569",
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
          background: "#f1f5f9",
          borderRadius: 8,
          fontSize: 12,
          color: "#334155",
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

      {post.categories?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {post.categories.map((c) => (
            <span
              key={c.category.key}
              onClick={() => onLabelClick(c.category.key)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                background: "#e0f2fe",
                color: "#0369a1",
                cursor: "pointer",
              }}
            >
              #{c.category.key}
            </span>
          ))}
        </div>
      )}

      {(post.type === "IMAGE" || post.type === "MEME") && post.mediaUrl && (
        <>
          <img
            src={post.mediaUrl}
            alt=""
            style={{ width: "100%", borderRadius: 12 }}
          />
          {post.type === "IMAGE" && (
            <button onClick={() => onMeme(post)}>Create meme</button>
          )}
        </>
      )}

      {post.type === "VIDEO" && (
        <video src={post.mediaUrl} controls style={{ width: "100%" }} />
      )}

      <footer style={{ marginTop: 12 }}>
        <button
          disabled={isLiking}
          onClick={() => onLike(post.id)}
        >
          {post.likedByMe ? "💙" : "🤍"} {post._count.likes}
        </button>
      </footer>
    </article>
  )
}
