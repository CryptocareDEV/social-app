import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/client"
import useBreakpoint from "../hooks/useBreakpoint"
import { theme as baseTheme, getThemeColors } from "../ui/theme"
import AppHeader from "../components/AppHeader"

const PUBLIC_LENSES = [
  { key: "ALL", label: "🌍 All" },
  { key: "meme", label: "😂 Meme" },
  { key: "philosophy", label: "🧠 Philosophy" },
  { key: "science", label: "🔬 Science" },
  { key: "politics", label: "🏛 Politics" },
]

export default function PublicLanding() {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [posts, setPosts] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeLens, setActiveLens] = useState("ALL")
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const publicFeedProfiles = PUBLIC_LENSES.map(l => ({
  id: l.key,
  name: l.label.replace(/^[^\s]+ /, ""), // remove emoji for clean name
}))
  const handlePublicLensSwitch = (profile) => {
  setActiveLens(profile.id)
}

  const loadMoreRef = useRef(null)

  const theme = {
    ...baseTheme,
    mode: "dark",
    accent: "CALM",
  }

  const colors = getThemeColors(theme)

  const fetchPosts = async (cursor = null) => {
    try {
      let query = `?label=${activeLens}`
if (cursor) query += `&cursor=${cursor}`
      const data = await api(`/public/global${query}`)

      if (cursor) {
        setPosts((prev) => [...prev, ...data.items])
      } else {
        setPosts(data.items)
      }

      setNextCursor(data.nextCursor)
    } catch (err) {
      console.error("Failed to load public feed")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
  setPosts([])
  setNextCursor(null)
  setLoading(true)
  fetchPosts()
}, [activeLens])

  useEffect(() => {
    if (!nextCursor) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true)
          fetchPosts(nextCursor)
        }
      },
      { threshold: 1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [nextCursor])

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        Loading CivicHalls…
      </div>
    )
  }

  return (
    <div
      style={{
        background: colors.bg,
        color: colors.text,
        minHeight: "100vh",
      }}
    >
      <AppHeader
  theme={theme}
  setTheme={() => {}}
  user={null}
  isMobile={isMobile}
  activeFeedProfileName={
    PUBLIC_LENSES.find(l => l.key === activeLens)?.label
  }
  feedProfiles={publicFeedProfiles}
  activeFeedProfileId={activeLens}
  showProfileMenu={showProfileMenu}
setShowProfileMenu={setShowProfileMenu}
  handleFeedProfileSwitch={handlePublicLensSwitch}
  goToFeedProfiles={() => navigate("/signup")}
  toggleTheme={() => {}}
  handleLogout={() => {}}
  unreadCount={0}
  loadNotifications={() => {}}
  showNotifications={false}
  setShowNotifications={() => {}}
  notifications={[]}
  loadingNotifications={false}
  setHighlightPostId={() => {}}
  
/>

      {/* SCOPE BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          padding: 16,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: colors.primary,
            color: "#fff",
            border: "none",
          }}
        >
          🌍 Global
        </button>

        <button
          onClick={() => navigate("/signup")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: colors.surfaceMuted,
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
            cursor: "pointer",
          }}
        >
          🔒 Country
        </button>

        <button
          onClick={() => navigate("/signup")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: colors.surfaceMuted,
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
            cursor: "pointer",
          }}
        >
          🔒 Local
        </button>
      </div>

      {/* INFO STRIP */}
<div
  style={{
    textAlign: "center",
    padding: "10px 16px",
    fontSize: 13,
    opacity: 0.7,
    borderBottom: `1px solid ${colors.border}`,
  }}
>
  Viewing Global scope. Country, Local, and custom lenses activate after signup.
</div>

      {/* FEED */}
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: isMobile ? 12 : 24,
        }}
      >
        {posts.map((p) => (
          <div
            key={p.id}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              background: colors.surface,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              @{p.user.username}
            </div>

            {p.caption && (
              <div style={{ marginBottom: 12 }}>{p.caption}</div>
            )}

            {p.mediaUrl && (
              p.type === "VIDEO" ? (
                <video
                  src={p.mediaUrl}
                  controls
                  style={{ width: "100%", borderRadius: 12 }}
                />
              ) : (
                <img
                  src={p.mediaUrl}
                  alt=""
                  style={{ width: "100%", borderRadius: 12 }}
                />
              )
            )}

            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                opacity: 0.8,
                display: "flex",
                gap: 16,
              }}
            >
              <span>{p._count.likes} likes</span>
              <span>{p._count.comments} comments</span>
            </div>
          </div>
        ))}

        {loadingMore && (
          <div style={{ textAlign: "center", padding: 20 }}>
            Loading more…
          </div>
        )}

        <div ref={loadMoreRef} style={{ height: 1 }} />
      </main>
    </div>
  )
}
