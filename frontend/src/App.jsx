import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Feed from "./components/Feed"
import PostComposer from "./components/PostComposer"
import Profile from "./pages/Profile"
import MemeEditor from "./components/MemeEditor"
import { theme } from "./styles/theme"


import { api } from "./api/client"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [posts, setPosts] = useState([])
  const [feedScope, setFeedScope] = useState("GLOBAL")
  const [memePost, setMemePost] = useState(null)
  const [likingIds, setLikingIds] = useState(new Set())


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
  try {
    const data = await api(`/posts/feed/${feedScope}`)

    // normalize posts for optimistic likes
    setPosts(
      data.map((p) => ({
        ...p,
        likedByMe: p.likedByMe ?? false,
      }))
    )
  } catch (err) {
    console.error("Failed to load feed", err)
  }
}



  // 🔁 Reload feed when auth or scope changes
  useEffect(() => {
    if (user) loadFeed()
  }, [user, feedScope])

  // ❤️ Like handler
  const handleLike = async (postId) => {
  // prevent double clicks
  if (likingIds.has(postId)) return

  setLikingIds((prev) => new Set(prev).add(postId))

  // optimistic update
  setPosts((prev) =>
    prev.map((p) =>
      p.id === postId
        ? {
            ...p,
            likedByMe: !p.likedByMe,
            _count: {
              ...p._count,
              likes: p.likedByMe
                ? Math.max(0, p._count.likes - 1)
                : p._count.likes + 1,
            },
          }
        : p
    )
  )

  try {
    await api(`/likes/${postId}`, { method: "POST" })
  } catch (err) {
    console.error("Like failed", err)

    // rollback on error
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              _count: {
                ...p._count,
                likes: p.likedByMe
                  ? p._count.likes + 1
                  : Math.max(0, p._count.likes - 1),
              },
            }
          : p
      )
    )
  } finally {
    setLikingIds((prev) => {
      const next = new Set(prev)
      next.delete(postId)
      return next
    })
  }
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
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    padding: "10px 20px",
  }}
>
  <div
    style={{
      maxWidth: 720,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    {/* Brand */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 700,
        fontSize: 15,
        color: "#0f172a",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "#0284c7",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        🌱
      </span>
      Social
    </div>

    {/* User */}
    <div
      style={{
        fontSize: 13,
        color: "#475569",
      }}
    >
      @{user.username}
    </div>
  </div>
</header>



              <main
  style={{
    maxWidth: 720,
    margin: "0 auto",
    padding: 20,
    background: theme.colors.bg,
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
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px solid ${theme.colors.border}`,
    background:
      feedScope === scope
        ? theme.colors.primary
        : theme.colors.card,
    color:
      feedScope === scope
        ? "#fff"
        : theme.colors.text,
    cursor: "pointer",
    fontWeight: 500,
    boxShadow:
      feedScope === scope
        ? theme.shadow.sm
        : "none",
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
  likingIds={likingIds}
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
