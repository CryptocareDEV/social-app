import PostCard from "./PostCard"

export default function Feed({ posts, onLike, onMeme, likingIds }) {
  if (!Array.isArray(posts)) {
    return (
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        Loading your feed…
      </p>
    )
  }

  if (posts.length === 0) {
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
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {posts.map((post) => (
        <PostCard
  key={post.id}
  post={post}
  onLike={onLike}
  onMeme={onMeme}
  isLiking={likingIds.has(post.id)}
/>
      ))}
    </div>
  )
}
