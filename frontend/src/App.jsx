import { useEffect, useState } from "react"
import Login from "./pages/Login"
import Feed from "./components/Feed"
import PostComposer from "./components/PostComposer"
import { api } from "./api/client"
import { Routes, Route } from "react-router-dom"
import Profile from "./pages/Profile"
import MemeEditor from "./components/MemeEditor"



export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState(null)
  const [feedScope, setFeedScope] = useState("GLOBAL")


  const loadFeed = async () => {
  const data = await api(`/posts/feed/${feedScope}`)
  setPosts(data)
}


  useEffect(() => {
    api("/users/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user) loadFeed()
  }, [user, feedScope])
  const [memePost, setMemePost] = useState(null)
  const handleLike = async (postId) => {
    await api(`/likes/${postId}`, { method: "POST" })
    loadFeed()
  }

  if (loading) return <p>Loading...</p>
  if (!user) return <Login onLogin={setUser} />

  return (
  <Routes>
    <Route
  path="/"
  element={
    <>
      <header
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>🌱 Social</strong>
        <span>@{user.username}</span>
      </header>

      <main
  style={{
    maxWidth: 720,
    margin: "0 auto",
    padding: 20,
    background: "#f9fafb",
    minHeight: "100vh",
  }}
>
        <PostComposer onPostCreated={loadFeed} />

        <div
  style={{
    display: "flex",
    gap: 8,
    marginBottom: 16,
  }}
>
  {["GLOBAL", "COUNTRY", "LOCAL"].map((scope) => (
    <button
      key={scope}
      onClick={() => setFeedScope(scope)}
      style={{
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        background:
          feedScope === scope ? "#111827" : "#f3f4f6",
        color:
          feedScope === scope ? "#fff" : "#111827",
        cursor: "pointer",
      }}
    >
      {scope === "GLOBAL" && "🌍 Global"}
      {scope === "COUNTRY" && "🏳️ Country"}
      {scope === "LOCAL" && "📍 Local"}
    </button>
  ))}
</div>

        <Feed
          posts={posts}
          onLike={handleLike}
          onMeme={(post) => setMemePost(post)}
        />
      </main>

      {memePost && (
  <MemeEditor
    post={memePost}
    onClose={() => setMemePost(null)}
    onPosted={() => {
      setMemePost(null)
      loadFeed()
    }}
  />
)}
    </>
  }
/>

    <Route path="/profile/:id" element={<Profile />} />
  </Routes>
)
}
