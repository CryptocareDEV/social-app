import PostCard from "./PostCard"

export default function Feed({ posts, onLike, onMeme }) {
  if (!posts) {
    return (
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 40 }}>
        Loading your feed…
      </p>
    )
  }

  if (posts.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#6b7280",
          fontStyle: "italic",
        }}
      >
        Nothing here yet.
      </div>
    )
  }

  return (
    <section style={{ marginTop: 20 }}>
      <h2 style={{ marginBottom: 16, color: "#111827" }}>Feed</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={onLike}
            onMeme={onMeme}
          />
        ))}
      </div>
    </section>
  )
}
