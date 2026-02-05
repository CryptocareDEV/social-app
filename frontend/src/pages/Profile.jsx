import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"
import CreateFeedProfileModal from "../components/CreateFeedProfileModal"
import FeedProfilesCard from "../components/profile/feedprofilescard"


export default function Profile({ theme, onFeedProfileChange }) {
  const { id } = useParams()
  const colors = getThemeColors(theme)

  const [user, setUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)


  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      api(`/users/${id}`),
      api(`/users/${id}/posts`),
      api("/me/feed-profiles"),
    ])
      .then(([u, userPosts, fps]) => {
        if (!mounted) return

        setUser(u)
        setPosts(userPosts || [])
        setProfiles(fps || [])

        const active = fps?.find((p) => p.isActive)
        if (active) {
          setActiveProfileId(active.id)
          onFeedProfileChange?.({
            id: active.id,
            name: active.name,
          })
        }
      })
      .catch(() => {
        if (mounted) setError("Failed to load profile")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  const activateProfile = async (profile) => {
  await api(`/me/feed-profiles/${profile.id}/activate`, {
    method: "POST",
  })

  // 🔁 reload profiles so isActive is correct
  const fps = await api("/me/feed-profiles")
  setProfiles(fps)

  setActiveProfileId(profile.id)

  onFeedProfileChange?.({
    id: profile.id,
    name: profile.name,
  })
}


  if (loading) return <p style={{ padding: 20 }}>Loading profile…</p>
  if (error) return <p style={{ padding: 20 }}>{error}</p>
  if (!user) return <p style={{ padding: 20 }}>User not found</p>

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      
      <h2
  style={{
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  }}
>
  🧍 Identity
</h2>
      {/* 🧍 Identity card */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          @{user.username}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </div>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          <strong>{user._count?.posts ?? 0}</strong> posts
        </div>
      </div>
<h2
  style={{
    fontSize: 16,
    fontWeight: 600,
    marginTop: 32,
    marginBottom: 12,
  }}
>
  🧠 Feed Profiles
</h2>
      {/* 🧠 Feed profiles */}
      <div
  style={{
    marginBottom: 32,
    padding: 20,
    borderRadius: theme.radius.lg,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    boxShadow: theme.shadow.sm,
  }}
>
        <div style={{ marginBottom: 12 }}>
  <div style={{ fontSize: 15, fontWeight: 600 }}>
    🧠 Feed profiles
  </div>
  <div
    style={{
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    }}
  >
    Switch how your feed is filtered and ranked
  </div>
</div>


        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowCreateProfile(true)}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              cursor: "pointer",
            }}
          >
            + Create new profile
          </button>
        </div>

        <FeedProfilesCard
  theme={theme}
  profiles={profiles}
  activeProfileId={activeProfileId}
  onChange={async (id) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return

    await api(`/me/feed-profiles/${id}/activate`, {
      method: "POST",
    })

    setActiveProfileId(id)

    onFeedProfileChange?.({
      id,
      name: profile.name,
    })
  }}
  onEdit={(profile) => {
    setEditingProfile(profile)
    setShowCreateProfile(true)
  }}
  onDelete={async (profile) => {
    const ok = window.confirm(
      `Delete feed profile "${profile.name}"?`
    )
    if (!ok) return

    await api(`/me/feed-profiles/${profile.id}`, {
      method: "DELETE",
    })

    setProfiles((prev) =>
      prev.filter((p) => p.id !== profile.id)
    )

    // if deleted profile was active → reset feed
    if (profile.id === activeProfileId) {
      setActiveProfileId(null)
      onFeedProfileChange?.({
        id: null,
        name: null,
      })
    }
  }}
/>

      </div>

      {/* 📝 Posts */}
      <div>
        <h2
  style={{
    fontSize: 15,
    fontWeight: 500,
    opacity: 0.7,
    marginBottom: 12,
    marginTop: 32,
  }}
>
  📝 Contributions
</h2>

        {posts.length === 0 && (
          <p style={{ opacity: 0.6 }}>No posts yet.</p>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              marginBottom: 16,
              padding: 16,
              borderRadius: 14,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
          >
            {post.caption && <p>{post.caption}</p>}

            {post.type === "IMAGE" && (
              <img
                src={post.mediaUrl}
                alt=""
                style={{
                  maxWidth: "100%",
                  borderRadius: 12,
                }}
              />
            )}

            {post.type === "VIDEO" && (
              <video
                src={post.mediaUrl}
                controls
                style={{
                  maxWidth: "100%",
                  borderRadius: 12,
                }}
              />
            )}

            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              ❤️ {post._count?.likes ?? 0} likes
            </div>
          </div>
        ))}
      </div>

      {showCreateProfile && (
  <CreateFeedProfileModal
    theme={theme}
    editingProfile={editingProfile}
    onClose={() => {
      setShowCreateProfile(false)
      setEditingProfile(null)
    }}
    onCreated={(profile) => {
      setProfiles((prev) => {
        const exists = prev.find((p) => p.id === profile.id)
        return exists
          ? prev.map((p) =>
              p.id === profile.id ? profile : p
            )
          : [...prev, profile]
      })

      setActiveProfileId(profile.id)

      onFeedProfileChange?.({
        id: profile.id,
        name: profile.name,
      })
    }}
  />
)}
    </div>
  )
}
