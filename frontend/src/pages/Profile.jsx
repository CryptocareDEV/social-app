import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../api/client"

export default function Profile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      api(`/users/${id}`),
      api(`/users/${id}/posts`),
    ])
      .then(([userData, postsData]) => {
        setUser(userData)
        setPosts(postsData)
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>Loading profile...</p>
  if (error) return <p>{error}</p>
  if (!user) return <p>User not found</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>@{user.username}</h2>
      <p>
        Joined: {new Date(user.createdAt).toLocaleDateString()}
      </p>
      <p>Total posts: {user._count.posts}</p>

      <hr />

      <h3>Posts</h3>

      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginBottom: 16,
          }}
        >
          {post.caption && <p>{post.caption}</p>}

          {post.type === "IMAGE" && (
            <img
              src={post.mediaUrl}
              alt=""
              style={{ maxWidth: "100%", marginTop: 8 }}
            />
          )}

          {post.type === "VIDEO" && (
            <video
              src={post.mediaUrl}
              controls
              style={{ maxWidth: "100%", marginTop: 8 }}
            />
          )}

          <p style={{ fontSize: 12, color: "#666" }}>
            Likes: {post._count.likes}
          </p>
        </div>
      ))}
    </div>
  )
}
