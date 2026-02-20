import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"
import { secondaryButton } from "../ui/buttonStyles"
import CreateFeedProfileModal from "../components/CreateFeedProfileModal"
import FeedProfilesCard from "../components/profile/feedprofilescard"
import CreateCommunityModal from "../components/CreateCommunityModal"


export default function Profile({
  theme,
  setTheme,
  currentUser,
  onFeedProfileChange,
  refreshUserState,
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const colors = getThemeColors(theme)
  const [activeTab, setActiveTab] = useState("POSTS")



  const [user, setUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [bio, setBio] = useState("")
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState("")
  const [communities, setCommunities] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
const [loadingMore, setLoadingMore] = useState(false)
const loadMoreRef = useRef(null)
  const [showCommunities, setShowCommunities] = useState(true)
const [showCommunityPosts, setShowCommunityPosts] = useState(true)
  const [postView, setPostView] = useState("PUBLIC")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [showCreateCommunity, setShowCreateCommunity] = useState(false)
  const isSuperuser = currentUser?.isSuperuser === true


  const moderatedCommunities =
  isOwnProfile
    ? communities.filter(
        (c) => c.role === "ADMIN" || c.role === "MODERATOR"
      )
    : []


  const sectionStyle = {
  marginTop: 8,
}
  const publicPosts = posts.filter(
  (p) => !p.communityId
)

const communityPosts = posts.filter(
  (p) => p.communityId
)


const visiblePosts =
  postView === "PUBLIC" ? publicPosts : communityPosts

const renderPostMedia = (post) => {
  if (!post.mediaUrl) return null

  if (post.type === "VIDEO") {
    return (
      <video
        src={post.mediaUrl}
        controls
        style={{
          maxWidth: "100%",
          borderRadius: 12,
          marginTop: 12,
        }}
      />
    )
  }

  if (["IMAGE", "MEME"].includes(post.type)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <img
          src={post.mediaUrl}
          alt=""
          style={{
            maxWidth: "100%",
            borderRadius: 12,
          }}
        />
      </div>
    )
  }


  return null
}

  useEffect(() => {
  let mounted = true
  setLoading(true)

  const loadProfile = async () => {
    
try {
// 2️⃣ Load profile owner explicitly
const u = await api(`/users/${id}`)


// 3️⃣ Decide ownership based on actual user identity
const viewingOwnProfile = u.id === currentUser?.id



// 4️⃣ Load posts for profile owner
const postRes = await api(`/users/${u.id}/posts`)

// 5️⃣ Load my feed profiles (ONLY mine)
const fps = viewingOwnProfile
        ? await api("/me/feed-profiles")
        : []


      if (!mounted) return

      setUser(u)
      setPosts(postRes?.posts || [])
setNextCursor(postRes?.nextCursor || null)
      setProfiles(fps || [])
      setBio(u.bio || "")
      setShowCommunities(
  typeof u.showCommunities === "boolean"
    ? u.showCommunities
    : true
)

setShowCommunityPosts(
  typeof u.showCommunityPosts === "boolean"
    ? u.showCommunityPosts
    : true
)


      setIsOwnProfile(viewingOwnProfile)

      const communitiesData = viewingOwnProfile
  ? await api("/communities/my")
  : await api(`/users/${u.id}/communities`)


      if (!mounted) return
      setCommunities(communitiesData || [])

      const active = fps?.find((p) => p.isActive)
      if (active) {
        setActiveProfileId(active.id)
        onFeedProfileChange?.({
          id: active.id,
          name: active.name,
        })
      }
    } catch (err) {
      if (mounted) setError("Failed to load profile")
    } finally {
      if (mounted) setLoading(false)
    }
  }

  if (currentUser) {
    loadProfile()
  }

  return () => {
    mounted = false
  }
}, [id, currentUser])

useEffect(() => {
  if (!loadMoreRef.current) return
  if (!nextCursor) return

  const observer = new IntersectionObserver(
    (entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        loadMorePosts()
      }
    },
    {
      rootMargin: "200px",
    }
  )

  observer.observe(loadMoreRef.current)

  return () => {
    if (loadMoreRef.current) {
      observer.unobserve(loadMoreRef.current)
    }
  }
}, [nextCursor, loadingMore, user])


useEffect(() => {
  if (!isOwnProfile && !showCommunityPosts && postView === "COMMUNITY") {
    setPostView("PUBLIC")
  }
}, [isOwnProfile, showCommunityPosts])


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
const loadMorePosts = async () => {
  if (!nextCursor || loadingMore || !user?.id) return

  setLoadingMore(true)

  try {
    const res = await api(
      `/users/${user.id}/posts?cursor=${nextCursor}`
    )

    setPosts((prev) => [...prev, ...(res.posts || [])])
    setNextCursor(res.nextCursor || null)
  } catch (err) {
    console.error("Failed loading more posts")
  } finally {
    setLoadingMore(false)
  }
}


  if (loading) return <p style={{ padding: 20 }}>Loading profile…</p>
  if (error) return <p style={{ padding: 20 }}>{error}</p>
  if (!user) return <p style={{ padding: 20 }}>User not found</p>




  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <button
  onClick={() => navigate("/")}
  style={{
    background: "transparent",
    border: "none",
    padding: 0,
    marginBottom: 16,
    cursor: "pointer",
    fontSize: 13,
    color: colors.textMuted,
  }}
>
  ← Back to feed
</button>

      <div style={sectionStyle}>
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

        {/* Bio */}
<div style={{ marginTop: 16 }}>
  <div
    style={{
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 6,
      color: colors.textMuted,
    }}
  >
    Bio
  </div>

  {!editingBio ? (
    <>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          padding: "10px 12px",
          borderRadius: 12,
          background: colors.surfaceMuted,
          border: `1px solid ${colors.border}`,
          color: bio ? colors.text : colors.textMuted,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {bio || "No bio yet."}
      </div>


{isOwnProfile && (
      <button
        onClick={() => {
          setBioDraft(bio)
          setEditingBio(true)
        }}
        style={{
          marginTop: 6,
          fontSize: 14,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: colors.text,
        }}
      >
        Edit bio
      </button>
)}
    </>
  ) : (
    <>
      <textarea
        value={bioDraft}
        onChange={(e) => setBioDraft(e.target.value)}
        maxLength={280}
        rows={3}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          fontSize: 14,
          resize: "none",
          boxSizing: "border-box",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          onClick={() => setEditingBio(false)}
          style={{
            fontSize: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: colors.text,
          }}
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            await api("/users/me", {
  method: "PATCH",
  body: JSON.stringify({
    bio: bioDraft.trim(),
  }),
})


            setBio(bioDraft.trim())
            setEditingBio(false)
          }}
          style={{
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </>
  )}
</div>


        <div style={{ marginTop: 12, fontSize: 14 }}>
          <strong>{user._count?.posts ?? 0}</strong> posts
        </div>
      </div>
</div>

{/* 🔹 Profile Tabs */}
<div
  style={{
    display: "flex",
    gap: 8,
    marginTop: 24,
    marginBottom: 24,
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: 8,
  }}
>

  {["POSTS", "COMMUNITIES", "FEED", "SETTINGS", "MODERATION", "PHILOSOPHY"].map((tab) => {
    if (tab === "FEED" && !isOwnProfile) return null
if (tab === "MODERATION" && !isOwnProfile) return null
if (tab === "SETTINGS" && !isOwnProfile) return null

// 👁 Hide communities tab for public viewers
if (
  tab === "COMMUNITIES" &&
  !isOwnProfile &&
  showCommunities === false
)
  return null


    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          fontSize: 13,
          border: "none",
          cursor: "pointer",
          background:
            activeTab === tab
              ? colors.primarySoft
              : "transparent",
          color:
            activeTab === tab
              ? colors.primary
              : colors.textMuted,
        }}
      >
        {tab}
      </button>
    )
  })}
</div>

{/* 🔹 Tab Content Container */}
<div
  style={{
    background: colors.surface,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 20,
  }}
>

{activeTab === "FEED" && isOwnProfile && (
<div style={sectionStyle}>

<div
  style={{
    marginBottom: 28,
    padding: 20,
    borderRadius: 18,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
  }}
>
  <div
    style={{
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 8,
    }}
  >
    Your Feed Control Center
  </div>

  <div
    style={{
      fontSize: 14,
      lineHeight: 1.7,
      color: colors.textMuted,
      maxWidth: 640,
    }}
  >
    There is no algorithm deciding what you see.
    <br /><br />
    A <strong>Feed Profile</strong> is an intentional lens.
    It defines which labels matter to you and how content flows
    across global, country, and local scopes.
    <br /><br />
    You are not following people.
    You are structuring information.
  </div>
</div>


      {/* 🧠 Feed profiles */}
      <div
  style={{
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    boxShadow: theme.shadow.sm,
  }}
>
        <div style={{ marginTop: 12 }}>
          <button
  onClick={() => setShowCreateProfile(true)}
  style={{
    padding: "10px 18px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 500,
    border: "none",
    background: colors.primary,
    color: "#fff",
    cursor: "pointer",
    marginBottom: 20,
  }}
>
  + Create Feed Profile
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
    // TRUE edit mode
    setEditingProfile(profile)
    setShowCreateProfile(true)
  }}

  onDuplicate={(profile) => {
    // TRUE create mode
    setEditingProfile({
      ...profile,
      id: null,
      name: `${profile.name} Copy`,
    })
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

  // Remove from state
  const updatedProfiles = profiles.filter(
    (p) => p.id !== profile.id
  )

  setProfiles(updatedProfiles)

  // If deleted profile was active → switch to Default
  if (profile.id === activeProfileId) {
    const defaultProfile = updatedProfiles.find(
      (p) => p.name === "Default"
    )

    if (defaultProfile) {
      await api(
        `/me/feed-profiles/${defaultProfile.id}/activate`,
        { method: "POST" }
      )

      setActiveProfileId(defaultProfile.id)

      onFeedProfileChange?.({
        id: defaultProfile.id,
        name: defaultProfile.name,
      })
    }
  }
}}

/>

</div>

      </div>
)}


{activeTab === "COMMUNITIES" && (
<div style={sectionStyle}>
{/* 🏘 Communities Explainer */}
<div
  style={{
    marginBottom: 28,
    padding: 20,
    borderRadius: 18,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
  }}
>
  <div
    style={{
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 8,
    }}
  >
    Structured Spaces
  </div>

  <div
    style={{
      fontSize: 14,
      lineHeight: 1.7,
      color: colors.textMuted,
      maxWidth: 640,
    }}
  >
    Communities are intentional containers.
    <br /><br />
    You gather around shared labels.
    <br /><br />
    Import topics.
    Organize thinking.
    Build local clarity.
    <br /><br />
    Whether there are 3 members or 3 million,
    information flows equally to all.
  </div>
</div>



{isOwnProfile && (
  <div
    style={{
      marginBottom: 16,
      padding: 16,
      borderRadius: theme.radius.lg,
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        Create a new community
      </div>
      <div
        style={{
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 4,
        }}
      >
        Start a space with clear intention and labels.
      </div>
    </div>

    <button
      onClick={() => setShowCreateCommunity(true)}
      style={{
        padding: "8px 14px",
        borderRadius: theme.radius.pill,
        fontSize: 13,
        fontWeight: 500,
        background: colors.primary,
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      + Create
    </button>
  </div>
)}


{communities.length === 0 ? (
  <p style={{ fontSize: 13, color: colors.textMuted }}>
    You are not part of any communities yet.
  </p>
) : (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 24,
    }}
  >
    {communities.map((c) => (
      <div
        key={c.id}
        style={{
          padding: 14,
          borderRadius: 12,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflow: "hidden", // 🔒 prevents layout break
        }}
      >
        <div style={{ minWidth: 0 }}>
          <button
            onClick={() =>
              (window.location.href = `/communities/${c.id}`)
            }
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: colors.text,
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 420,
            }}
          >
            {c.name}
          </button>

          <div
            style={{
              fontSize: 12,
              color: colors.textMuted,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 420,
            }}
          >
            {c.intention}
          </div>
        </div>

        <div
  style={{
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "capitalize",
    flexShrink: 0,
    textAlign: "right",
  }}
>
  <div>{c.role?.toLowerCase()}</div>

  {isOwnProfile && c.role !== "ADMIN" && (
    <button
      onClick={async () => {
        const ok = window.confirm(
          `Leave community "${c.name}"?`
        )
        if (!ok) return

        try {
          await api(`/communities/${c.id}/leave`, {
            method: "POST",
          })

          setCommunities((prev) =>
            prev.filter((x) => x.id !== c.id)
          )
        } catch (err) {
          alert(
            err?.error || "Failed to leave community"
          )
        }
      }}
      style={{
        marginTop: 6,
        fontSize: 12,
        background: "transparent",
        border: "none",
        color: colors.textMuted,
        cursor: "pointer",
        padding: 0,
      }}
    >
      Leave
    </button>
  )}
</div>

      </div>
    ))}
  </div>
)}
</div>
)}

{/* 🛡 Moderation */}
{activeTab === "MODERATION" &&
  isOwnProfile &&
  (isSuperuser || moderatedCommunities.length > 0) && (
  <div style={sectionStyle}>
    

    <div
      style={{
        padding: 16,
        borderRadius: theme.radius.lg,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Platform moderation */}
      {isSuperuser && (
        <button
          onClick={() => navigate("/moderation")}
          style={{
  padding: "12px 16px",
  borderRadius: theme.radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.text,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  textAlign: "left",
  transition: "all 0.15s ease",
}}

        >
          🛡 Platform moderation dashboard
        </button>
      )}

      {/* Community moderation */}
      {moderatedCommunities.map((c) => (
        <button
          key={c.id}
          onClick={() =>
            navigate(`/communities/${c.id}/moderation`)
          }
          style={{
  padding: "12px 16px",
  borderRadius: theme.radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.text,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  textAlign: "left",
  transition: "all 0.15s ease",
}}

        >
          🏘️ Moderate {c.name}
        </button>
      ))}
    </div>
  </div>
)}


{activeTab === "SETTINGS" && isOwnProfile && (
  <div style={sectionStyle}>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Section Card */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Content Preferences
        </div>

        <div
          style={{
            fontSize: 13,
            color: colors.textMuted,
            marginBottom: 12,
          }}
        >
          Control what type of content you see across the platform.
        </div>

        {!currentUser?.isMinor && (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 14,
      color: colors.text,
    }}
  >
    <input
      type="checkbox"
      checked={currentUser?.nsfwEnabled || false}
      onChange={async (e) => {
  const value = e.target.checked

  try {
    await api("/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        nsfwEnabled: value,
      }),
    })

    await refreshUserState?.()

  } catch (err) {
    alert(err?.error || "Update failed")
  }
}}

    />
    Allow NSFW content
  </label>
)}


      </div>

      {/* Appearance Card */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Appearance
        </div>

        {/* Theme Mode */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            Theme Mode
          </div>

          <button
            onClick={() => {
              const next =
                theme.mode === "light" ? "DARK" : "LIGHT"

              api("/users/me", {
                method: "PATCH",
                body: JSON.stringify({
                  themeMode: next,
                }),
              }).then((updated) => {
                setTheme((t) => ({
                  ...t,
                  mode:
                    updated.themeMode === "DARK"
                      ? "dark"
                      : "light",
                }))
              })
            }}
            style={secondaryButton(theme)}
          >
            Switch to{" "}
            {theme.mode === "light"
              ? "Dark Mode"
              : "Light Mode"}
          </button>
        </div>

        {/* Accent */}
        <div>
          <div
            style={{
              fontSize: 13,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            Accent Color
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {[
              "REDDIT",
              "SUN_ORANGE",
              "SKY_BLUE",
              "TURQUOISE",
              "SOFT_GREEN",
            ].map((a) => (
              <button
                key={a}
                onClick={async () => {
                  const updated = await api(
                    "/users/me",
                    {
                      method: "PATCH",
                      body: JSON.stringify({
                        accentTheme: a,
                      }),
                    }
                  )

                  setTheme((t) => ({
                    ...t,
                    accent: updated.accentTheme,
                  }))
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border:
                    theme.accent === a
                      ? `2px solid ${colors.text}`
                      : `1px solid ${colors.border}`,
                  background:
                    getThemeColors({
                      ...theme,
                      accent: a,
                    }).primary,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
        </div>


{/* Profile Visibility */}
<div
  style={{
    padding: 20,
    borderRadius: 16,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: 8,
  }}
>
  <div
    style={{
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 4,
    }}
  >
    Profile Visibility
  </div>

  <div
    style={{
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 8,
    }}
  >
    Control what visitors can see on your profile.
  </div>

  {/* Communities Toggle */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>
        Communities
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted }}>
        Show communities you belong to
      </div>
    </div>

    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={async () => {
          setShowCommunities(true)
          await api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ showCommunities: true }),
          })
        }}
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 12,
          border: `1px solid ${colors.border}`,
          background: showCommunities ? colors.primarySoft : colors.surface,
          color: showCommunities ? colors.primary : colors.textMuted,
          cursor: "pointer",
        }}
      >
        Public
      </button>

      <button
        onClick={async () => {
          setShowCommunities(false)
          await api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ showCommunities: false }),
          })
        }}
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 12,
          border: `1px solid ${colors.border}`,
          background: !showCommunities ? colors.primarySoft : colors.surface,
          color: !showCommunities ? colors.primary : colors.textMuted,
          cursor: "pointer",
        }}
      >
        Private
      </button>
    </div>
  </div>

  {/* Community Posts Toggle */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>
        Community Posts
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted }}>
        Show posts made inside communities
      </div>
    </div>

    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={async () => {
          setShowCommunityPosts(true)
          await api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ showCommunityPosts: true }),
          })
        }}
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 12,
          border: `1px solid ${colors.border}`,
          background: showCommunityPosts ? colors.primarySoft : colors.surface,
          color: showCommunityPosts ? colors.primary : colors.textMuted,
          cursor: "pointer",
        }}
      >
        Public
      </button>

      <button
        onClick={async () => {
          setShowCommunityPosts(false)
          await api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ showCommunityPosts: false }),
          })
        }}
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 12,
          border: `1px solid ${colors.border}`,
          background: !showCommunityPosts ? colors.primarySoft : colors.surface,
          color: !showCommunityPosts ? colors.primary : colors.textMuted,
          cursor: "pointer",
        }}
      >
        Private
      </button>
    </div>
  </div>
</div>


      </div>
    </div>
)}




{activeTab === "PHILOSOPHY" && (
  <div
    style={{
      maxWidth: 820,
      margin: "0 auto",
      padding: "40px 28px",
      borderRadius: 20,
      border: "1px solid rgba(212, 175, 55, 0.6)", // subtle gold
      boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
      background: colors.surface,
      display: "flex",
      flexDirection: "column",
      gap: 40,
      lineHeight: 1.9,
      color: colors.text,
    }}
  >
    {/* Header */}
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: colors.textMuted,
          marginBottom: 18,
        }}
      >
        Declaration
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        A Different Kind of Social Space
      </div>
    </div>

    {/* Section 1 */}
    <div style={{ fontSize: 17 }}>
      <p>
        We removed following.
      </p>

      <p>
        Not because connection is unimportant,
        but because influence should never decide truth.
      </p>

      <p>
        Here, no one rises because they are amplified.
        Nothing spreads because it performs.
      </p>
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: "rgba(212, 175, 55, 0.4)",
      }}
    />

    {/* Section 2 */}
    <div style={{ fontSize: 17 }}>
      <p>
        You choose what you see.
      </p>

      <p>
        Through labels.
        Through profiles.
        Through communities built intentionally.
      </p>

      <p>
        The structure defines the flow.
        Not popularity.
        Not outrage.
      </p>
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: "rgba(212, 175, 55, 0.4)",
      }}
    />

    {/* Section 3 */}
    <div style={{ fontSize: 17 }}>
      <p>
        This is not influencer culture.
      </p>

      <p>
        There are no hidden agendas.
        No engagement traps.
        No advertisements shaping perception.
      </p>

      <p>
        We will keep it that way.
      </p>
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: "rgba(212, 175, 55, 0.4)",
      }}
    />

    {/* Section 4 */}
    <div style={{ fontSize: 17 }}>
      <p>
        Use labels to follow subjects instead of people.
      </p>

      <p>
        Import a topic into a community.
        Create a local space.
        Join globally.
      </p>

      <p>
        Whether one member or one million,
        the information remains the same for everyone.
      </p>
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: "rgba(212, 175, 55, 0.4)",
      }}
    />

    {/* Section 5 */}
    <div style={{ fontSize: 17 }}>
      <p>
        You can find work here.
        Friendship.
        Love.
        Humor.
        Shared curiosity.
      </p>

      <p>
        Build communities that matter.
        Stay aligned without fighting algorithms.
      </p>
    </div>

    {/* Final Statement */}
    <div
      style={{
        textAlign: "center",
        marginTop: 20,
        fontSize: 18,
        fontWeight: 500,
      }}
    >
      <p>
        Hello world.
      </p>

      <p>
        Let us unite with clarity.
      </p>

      <p>
        Let us move humanity forward
        together.
      </p>
    </div>
  </div>
)}




      {activeTab === "POSTS" && (
<div>
  {/* 📝 Posts Explainer */}
<div
  style={{
    marginBottom: 28,
    padding: 20,
    borderRadius: 18,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
  }}
>
  <div
    style={{
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 8,
    }}
  >
    Your Public Voice
  </div>

  <div
    style={{
      fontSize: 14,
      lineHeight: 1.7,
      color: colors.textMuted,
      maxWidth: 640,
    }}
  >
    This is where your thinking lives.
    <br /><br />
    Public posts appear across global, country, and local scopes
    based on their labels.
    <br /><br />
    Community posts stay inside the spaces you intentionally join.
    <br /><br />
    Nothing spreads because of followers.
    It spreads because it is categorized clearly.
  </div>
</div>

        <div style={sectionStyle}>
        

<div
  style={{
    display: "flex",
    gap: 8,
    marginBottom: 16,
  }}
>
  <button
    onClick={() => setPostView("PUBLIC")}
    style={{
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 12,
      cursor: "pointer",
      border: `1px solid ${colors.border}`,
      background:
        postView === "PUBLIC"
          ? colors.primarySoft
          : colors.surface,
      color:
        postView === "PUBLIC"
          ? colors.primary
          : colors.textMuted,
    }}
  >
    Public
  </button>



  {(isOwnProfile || showCommunityPosts) && (
  <button
    onClick={() => setPostView("COMMUNITY")}
    style={{
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 12,
      cursor: "pointer",
      border: `1px solid ${colors.border}`,
      background:
        postView === "COMMUNITY"
          ? colors.primarySoft
          : colors.surface,
      color:
        postView === "COMMUNITY"
          ? colors.primary
          : colors.textMuted,
    }}
  >
    Community
  </button>
)}

</div>



{visiblePosts.length === 0 && (
  <p style={{ opacity: 0.6 }}>
    No posts here yet.
  </p>
)}

{visiblePosts.map((post) => (
  <div
    key={post.id}
    style={{
      marginBottom: 20,
      padding: 20,
      borderRadius: 12,
      background:
        postView === "COMMUNITY"
          ? colors.surfaceMuted
          : colors.surface,
      border:
        postView === "COMMUNITY"
          ? `1px dashed ${colors.border}`
          : `1px solid ${colors.border}`,
    }}
  >
    {post.caption && (
  <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
    {post.caption}
  </p>
)}

    {renderPostMedia(post)}

    {/* Meta Section */}
<div
  style={{
    marginTop: 16,
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  }}
>
  {/* Scope or Community */}
  <div
    style={{
      fontSize: 12,
      color: colors.textMuted,
    }}
  >
    {!post.communityId && (
      <>
        {post.scope === "GLOBAL" && "🌍 Global"}
        {post.scope === "COUNTRY" && "🏳️ Country"}
        {post.scope === "LOCAL" && "📍 Local"}
      </>
    )}

    {post.communityId && post.community && (
      <>
        🏘 {post.community.name}
        {post.community.scope && (
          <> • {post.community.scope.toLowerCase()}</>
        )}
      </>
    )}
  </div>

  {/* Engagement Row */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12,
      color: colors.textMuted,
    }}
  >
    <div>
      ❤️ {post._count?.likes ?? 0} likes
    </div>

    {isOwnProfile && (
      <button
        onClick={async () => {
          const ok = window.confirm(
            "Delete this post? This cannot be undone."
          )
          if (!ok) return

          await api(`/posts/${post.id}`, {
            method: "DELETE",
          })

          setPosts((prev) =>
            prev.filter((p) => p.id !== post.id)
          )
        }}
        style={{
          fontSize: 12,
          background: "transparent",
          border: "none",
          color: colors.textMuted,
          cursor: "pointer",
        }}
      >
        Delete
      </button>
    )}
  </div>
</div>

  </div>
))}
{nextCursor && (
  <div
    ref={loadMoreRef}
    style={{
      height: 1,
    }}
  />
)}



{(isOwnProfile || showCommunityPosts) && postView === "COMMUNITY" && (
  <>
    {communityPosts.length === 0 && (
      <p style={{ opacity: 0.6 }}>
        No community posts yet.
      </p>
    )}
  </>
)}




      </div>
      </div>
      )}
      </div>


      {showCreateProfile && (
  <CreateFeedProfileModal
    theme={theme}
    editingProfile={editingProfile}
    isMinor={currentUser?.isMinor}
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
{showCreateCommunity && (
  <CreateCommunityModal
    theme={theme}
    onClose={() => setShowCreateCommunity(false)}
    onCreated={async () => {
      setShowCreateCommunity(false)
      const updated = await api("/communities/my")
      setCommunities(updated || [])
    }}
  />
)}


    </div>
  )
}
