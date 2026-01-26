import { useEffect, useState } from "react"
import PostCard from "./PostCard"

export default function Feed({ posts, onLike }) {
  const [localPosts, setLocalPosts] = useState([])

  // Sync when backend posts change
  useEffect(() => {
  if (posts) {
    setLocalPosts(
      posts.map((p) => ({
        ...p,
        likesCount: p._count.likes,
        likedByMe: false, // ✅ initialize
      }))
    )
  }
}, [posts])

  if (!posts) {
    return (
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        Loading your feed…
      </p>
    )
  }

  if (localPosts.length === 0) {
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

  const handleLikeOptimistic = async (postId) => {
    // 1️⃣ Optimistic update
    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likesCount: p.likedByMe
                ? p.likesCount - 1
                : p.likesCount + 1,
              likedByMe: !p.likedByMe,
            }
          : p
      )
    )

    try {
      // 2️⃣ Backend call
      const res = await onLike(postId)

      // 3️⃣ Align with backend truth
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: res.liked }
            : p
        )
      )
    } catch (err) {
      // 4️⃣ Rollback on failure
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likesCount: p.likedByMe
                  ? p.likesCount + 1
                  : p.likesCount - 1,
                likedByMe: !p.likedByMe,
              }
            : p
        )
      )
    }
  }

  return (
    <div>
      <h2>Feed</h2>

      {localPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLikeOptimistic}
        />
      ))}
    </div>
  )
}
