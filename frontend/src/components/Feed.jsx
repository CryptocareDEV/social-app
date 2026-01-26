import PostCard from "./PostCard"

export default function Feed({ posts, onLike, onMeme }) {
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
    <div>
      <h2>Feed</h2>

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onMeme={onMeme}
        />
      ))}
    </div>
  )
}
