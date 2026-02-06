import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"
import Feed from "../components/Feed"
import PostComposer from "../components/PostComposer"
import CommunityChat from "../components/CommunityChat"

export default function CommunityPage({ theme }) {
  const { id } = useParams()
  const colors = getThemeColors(theme)

  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [activeTab, setActiveTab] = useState("feed")

  const [posts, setPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  /* =====================
     Load community meta
  ====================== */
  useEffect(() => {
    let mounted = true
    setLoading(true)

    api(`/communities/${id}`)
      .then((data) => {
        if (mounted) setCommunity(data)
      })
      .catch(() => {
        if (mounted) setError("Failed to load community")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])
  useEffect(() => {
  setActiveTab("feed")
}, [id])

  /* =====================
     Load feed
  ====================== */
  useEffect(() => {
    if (activeTab !== "feed") return

    let mounted = true
    setLoadingFeed(true)

    api(`/communities/${id}/feed`)
      .then((data) => {
        if (mounted) setPosts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (mounted) setPosts([])
      })
      .finally(() => {
        if (mounted) setLoadingFeed(false)
      })

    return () => {
      mounted = false
    }
  }, [activeTab, id])

  /* =====================
     Load members
  ====================== */
  useEffect(() => {
    if (activeTab !== "members") return

    let mounted = true
    setLoadingMembers(true)

    api(`/communities/${id}/members`)
      .then((data) => {
        if (mounted) setMembers(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (mounted) setMembers([])
      })
      .finally(() => {
        if (mounted) setLoadingMembers(false)
      })

    return () => {
      mounted = false
    }
  }, [activeTab, id])

  /* =====================
     Guards
  ====================== */
  if (loading) return <p style={{ padding: 24 }}>Loading community…</p>
  if (error) return <p style={{ padding: 24 }}>{error}</p>
  if (!community) return <p style={{ padding: 24 }}>Community not found</p>

  return (
    <div
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      {/* COMMUNITY HEADER */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {community.name}
        </div>

        {community.intention && (
          <div
            style={{
              marginTop: 6,
              fontSize: 14,
              color: colors.textMuted,
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            {community.intention}
          </div>
        )}

        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {community.scope} · {community.rating}
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: 6,
          fontSize: 13,
        }}
      >
        {["feed", "chat", "members"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: activeTab === tab ? colors.text : colors.textMuted,
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          minHeight: 200,
        }}
      >
        {activeTab === "feed" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}
  >
    {/* Composer */}
    <div
      style={{
        paddingBottom: 16,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <PostComposer
        theme={theme}
        feedMode="COMMUNITY"
        activeCommunity={community}
        onPostCreated={async () => {
          setLoadingFeed(true)
          try {
            const data = await api(`/communities/${id}/feed`)
            setPosts(Array.isArray(data) ? data : [])
          } finally {
            setLoadingFeed(false)
          }
        }}
      />
    </div>

    {/* Feed */}
    {loadingFeed ? (
      <p style={{ opacity: 0.6, fontSize: 13 }}>
        Loading community feed…
      </p>
    ) : posts.length === 0 ? (
      <p style={{ opacity: 0.6, fontSize: 13 }}>
        Nothing here yet. Be the first to post.
      </p>
    ) : (
      <Feed posts={posts} theme={theme} />
    )}
  </div>
)}




        {activeTab === "chat" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: 420,
      maxHeight: "60vh",
      overflow: "hidden",
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      boxSizing: "border-box",
    }}
  >
    {/* Header */}
    <div
      style={{
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 600,
        borderBottom: `1px solid ${colors.border}`,
        color: colors.textMuted,
        flexShrink: 0,
      }}
    >
      Community chat
    </div>

    {/* Chat body */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        boxSizing: "border-box",
      }}
    >
      <CommunityChat
        communityId={id}
        isMember
      />
    </div>
  </div>
)}


        {activeTab === "members" && (
  <>
    {loadingMembers ? (
      <p style={{ opacity: 0.6 }}>Loading members…</p>
    ) : members.length === 0 ? (
      <p style={{ opacity: 0.6 }}>No members found.</p>
    ) : (
      members.map((m) => (
        <div
          key={m.id}
          style={{
            padding: "6px 0",
            fontSize: 13,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          @{m.username} · {m.role.toLowerCase()}
        </div>
      ))
    )}
  </>
)}

      </div>
    </div>
  )
}
