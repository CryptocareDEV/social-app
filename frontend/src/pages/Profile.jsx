import { useEffect, useState } from "react"
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
const userPosts = await api(`/users/${u.id}/posts`)

// 5️⃣ Load my feed profiles (ONLY mine)
const fps = viewingOwnProfile
        ? await api("/me/feed-profiles")
        : []


      if (!mounted) return

      setUser(u)
      setPosts(userPosts || [])
      setProfiles(fps || [])
      setBio(u.bio || "")

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

  {["POSTS", "COMMUNITIES", "FEED", "SETTINGS", "MODERATION"].map((tab) => {
    if (tab === "FEED" && !isOwnProfile) return null
    if (tab === "MODERATION" && !isOwnProfile) return null
    if (tab === "SETTINGS" && !isOwnProfile) return null


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

<p
  style={{
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 1.6,
    maxWidth: 560,
  }}
>
  Your feed is shaped by <strong>profiles</strong>, intentional lenses that
  decide what content appears and why.  
  <br />
  <br />
  <strong>Default</strong> is a safe baseline profile that always exists, so
  your feed never becomes empty or unpredictable. You can create, switch,
  and customize other profiles freely.
</p>

      {/* 🧠 Feed profiles */}
      <div
  style={{
    marginBottom: 32,
    padding: 20,
    borderRadius: theme.radius.lg,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
  }}
>



        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowCreateProfile(true)}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
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

      </div>
)}


{activeTab === "COMMUNITIES" && (
<div style={sectionStyle}>



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
          const updated = await api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({
              nsfwEnabled: value,
            }),
          })

          
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
    </div>
  </div>
)}




      {activeTab === "POSTS" && (
<div>
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
      marginBottom: 12,
      padding: 14,
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
    {post.caption && <p>{post.caption}</p>}

    {renderPostMedia(post)}

    {/* Footer row */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
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
))}



{communityPosts.length === 0 && (
  <p style={{ opacity: 0.6 }}>
    No community posts yet.
  </p>
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
