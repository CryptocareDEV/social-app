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

  // 🔁 FEED MODE (single source of truth)
  // "GLOBAL" | "COMMUNITY" | "LABEL"
  const [feedMode, setFeedMode] = useState("GLOBAL")

  const [feedScope, setFeedScope] = useState("GLOBAL")
  const [selectedCommunity, setSelectedCommunity] = useState("GLOBAL")
  const [activeLabel, setActiveLabel] = useState(null)

  const [memePost, setMemePost] = useState(null)
  const [likingIds, setLikingIds] = useState(new Set())
  const [communities, setCommunities] = useState([])

  // 🔐 Auth bootstrap
  useEffect(() => {
    api("/users/me")
      .then((u) => u && setUser(u))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 📰 FEED LOADER (CANONICAL)
  const loadFeed = async () => {
    try {
      let endpoint

      if (feedMode === "LABEL" && activeLabel) {
        endpoint = `/posts/label/${activeLabel}`
      } else if (
        feedMode === "COMMUNITY" &&
        selectedCommunity !== "GLOBAL"
      ) {
        endpoint = `/communities/${selectedCommunity}/feed`
      } else {
        endpoint = `/posts/feed/${feedScope}`
      }

      const data = await api(endpoint)

      setPosts(
        (data.items ?? data).map((p) => ({
          ...p,
          likedByMe: !!p.likedByMe,
        }))
      )
    } catch (err) {
      console.error("Failed to load feed", err)
    }
  }

  // 🏘 Communities
  const loadCommunities = async () => {
    try {
      const data = await api("/communities/my")
      setCommunities(data || [])
    } catch (err) {
      console.error("Failed to load communities", err)
    }
  }

  // 🔁 Reload feed on mode changes only
  useEffect(() => {
    if (!user) return
    loadFeed()
    loadCommunities()
  }, [user, feedMode, feedScope, selectedCommunity, activeLabel])

  // ❤️ LIKE HANDLER (BACKEND TRUTH ONLY)
  const handleLike = async (postId) => {
    if (likingIds.has(postId)) return

    setLikingIds((prev) => new Set(prev).add(postId))

    try {
      const res = await api(`/likes/${postId}`, { method: "POST" })

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: res.liked,
                _count: { likes: res.likeCount },
              }
            : p
        )
      )
    } catch (err) {
      console.error("Like failed", err)
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />}
      />

      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <>
              {/* Header */}
              <header
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  background: "#fff",
                  borderBottom: "1px solid #e5e7eb",
                  padding: "10px 20px",
                }}
              >
                <div
                  style={{
                    maxWidth: 720,
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>🌱 Social</strong>

                  <div style={{ display: "flex", gap: 12 }}>
                    <select
                      value={selectedCommunity}
                      onChange={(e) => {
                        setFeedMode("COMMUNITY")
                        setActiveLabel(null)
                        setSelectedCommunity(e.target.value)
                      }}
                    >
                      <option value="GLOBAL">🌍 Global</option>
                      {communities.map((c) => (
                        <option key={c.id} value={c.id}>
                          🏠 {c.name}
                        </option>
                      ))}
                    </select>

                    <span>@{user.username}</span>
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

                {/* Scope selector */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {["GLOBAL", "COUNTRY", "LOCAL"].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setFeedMode("GLOBAL")
                        setActiveLabel(null)
                        setFeedScope(s)
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Active label */}
                {feedMode === "LABEL" && activeLabel && (
                  <button
                    onClick={() => {
                      setFeedMode("GLOBAL")
                      setActiveLabel(null)
                    }}
                    style={{ marginBottom: 12 }}
                  >
                    ❌ Clear #{activeLabel}
                  </button>
                )}

                <Feed
                  posts={posts}
                  onLike={handleLike}
                  onMeme={(p) => setMemePost(p)}
                  likingIds={likingIds}
                  onLabelClick={(label) => {
                    setFeedMode("LABEL")
                    setActiveLabel(label)
                  }}
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

      <Route
        path="/profile/:id"
        element={user ? <Profile /> : <Navigate to="/login" />}
      />
    </Routes>
  )
}
