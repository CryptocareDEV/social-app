import PostCard from "./PostCard"

export default function Feed({
  posts,
  onLike,
  onMeme,
  likingIds,
  onLabelClick,
}) {
  if (!Array.isArray(posts)) {
    return <p style={{ textAlign: "center" }}>Loading feed…</p>
  }

  if (posts.length === 0) {
    return <p style={{ textAlign: "center" }}>Nothing here yet.</p>
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onMeme={onMeme}
          isLiking={likingIds.has(post.id)}
          onLabelClick={onLabelClick}
        />
      ))}
    </>
  )
}
