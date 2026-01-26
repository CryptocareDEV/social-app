import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Feed from "./components/Feed"
import PostComposer from "./components/PostComposer"
import Profile from "./pages/Profile"
import MemeEditor from "./components/MemeEditor"

import { api } from "./api/client"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [posts, setPosts] = useState([])
  const [feedScope, setFeedScope] = useState("GLOBAL")
  const [memePost, setMemePost] = useState(null)

  // 🔐 Auth bootstrap (single source of truth)
  useEffect(() => {
  api("/users/me")
    .then((u) => {
      if (u) setUser(u)
    })
    .catch(() => {})
    .finally(() => setLoading(false))
}, [])


  // 📰 Feed loader
  const loadFeed = async () => {
    const data = await api(`/posts/feed/${feedScope}`)
    setPosts(data)
  }

  // 🔁 Reload feed when auth or scope changes
  useEffect(() => {
    if (user) loadFeed()
  }, [user, feedScope])

  // ❤️ Like handler
  const handleLike = async (postId) => {
  // 🔑 App does NOT manage optimistic state
  // Feed handles it
  return await api(`/likes/${postId}`, { method: "POST" })
}




  // ⏳ Auth still resolving
  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>
  }

  return (
    <Routes>
      {/* 🔓 Login */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" /> : <Login onLogin={setUser} />
        }
      />

      {/* 🔒 Home / Feed */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : (
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

                {/* 🌍 Feed scope selector */}
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
                          feedScope === scope
                            ? "#111827"
                            : "#f3f4f6",
                        color:
                          feedScope === scope
                            ? "#fff"
                            : "#111827",
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
          )
        }
      />

      {/* 👤 Profile */}
      <Route
        path="/profile/:id"
        element={
          user ? <Profile /> : <Navigate to="/login" />
        }
      />
    </Routes>
  )
}
