import { Link } from "react-router-dom"
export default function Feed({ posts, onLike, onMeme }) {
  if (!posts)
  return (
    <p style={{ textAlign: "center", color: "#6b7280" }}>
      Loading your feed…
    </p>
  )
  if (posts.length === 0)
  return (
    <div
      style={{
        padding: 24,
        textAlign: "center",
        color: "#6b7280",
        fontStyle: "italic",
      }}
    >
      Nothing here yet.
    </div>
  )
  return (
    <div>
      <h2>Feed</h2>

      {posts.map((post) => (
        <div
  key={post.id}
  style={{
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  }}
>
          <div style={{ marginBottom: 8 }}>
  <strong>
  <Link
    to={`/profile/${post.user.id}`}
    style={{ textDecoration: "none", color: "inherit" }}
  >
    @{post.user.username}
  </Link>
</strong>

<span
  style={{
    fontSize: 12,
    padding: "2px 6px",
    marginLeft: 8,
    borderRadius: 4,
    background:
      post.scope === "GLOBAL"
        ? "#e5e7eb"
        : post.scope === "COUNTRY"
        ? "#dbeafe"
        : "#dcfce7",
    color: "#111827",
  }}
>
  {post.scope}
</span>

    
</div>
          {post.caption && post.type !== "MEME" && (
  <p style={{ marginBottom: 12, lineHeight: 1.4 }}>
    {post.caption}
  </p>
)}
          {(post.type === "IMAGE" || post.type === "MEME") && post.mediaUrl && (
  <div style={{ marginTop: 8 }}>
    <img
  src={post.mediaUrl}
  alt=""
  style={{
    maxWidth: "100%",
    display: "block",
    margin: "0 auto",
    borderRadius: 6,
  }}
/>
    {post.type === "IMAGE" && (
      <button
        style={{ marginTop: 6 }}
        onClick={() => onMeme(post)}
      >
        Meme
      </button>
    )}
  </div>
)}

          {post.type === "VIDEO" && (
            <video
  src={post.mediaUrl}
  controls
  style={{
    maxWidth: "100%",
    display: "block",
    margin: "8px auto 0",
    borderRadius: 6,
  }}
/>
          )}

          <div style={{ marginTop: 12 }}>
            <button onClick={() => onLike(post.id)}>
              ❤️ {post._count.likes} {post._count.likes === 1 ? "like" : "likes"}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
