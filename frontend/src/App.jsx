import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Feed from "./components/Feed"
import PostComposer from "./components/PostComposer"
import Profile from "./pages/Profile"
import MemeEditor from "./components/MemeEditor"
import CreateCommunityModal from "./components/CreateCommunityModal"
import CommunityChat from "./components/CommunityChat"
import Signup from "./pages/Signup"
import {
  primaryButton,
  secondaryButton,
  ghostButton,
  headerPrimaryButton,
  headerGhostButton,
  headerSelect, // 👈 ADD THIS
} from "./ui/buttonStyles"





import { theme as baseTheme, getThemeColors } from "./ui/theme"
import { api } from "./api/client"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // 🎨 Theme (Phase 1 foundation)
  const [theme, setTheme] = useState(baseTheme)
  const colors = getThemeColors(theme)


  const [posts, setPosts] = useState([])
  const [communities, setCommunities] = useState([])

  const [showCreateCommunity, setShowCreateCommunity] = useState(false)

  // 🔁 Feed mode
  const [feedMode, setFeedMode] = useState("GLOBAL") // GLOBAL | COMMUNITY | LABEL
  const [feedScope, setFeedScope] = useState("GLOBAL")
  const [selectedCommunity, setSelectedCommunity] = useState("GLOBAL")
  const [activeLabel, setActiveLabel] = useState(null)
  const [communityMembers, setCommunityMembers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [cooldownInfo, setCooldownInfo] = useState(null)
  
const handleLogout = () => {
  localStorage.removeItem("token")
  setUser(null)
}


  // ❤️ Likes
  const [likingIds, setLikingIds] = useState(new Set())

  // 🖼 Meme
  const [memePost, setMemePost] = useState(null)

  // 🏷 Community label editing
  const [editingLabels, setEditingLabels] = useState(false)
  const [communityLabels, setCommunityLabels] = useState([])
  const [labelInput, setLabelInput] = useState("")
  const [invitations, setInvitations] = useState([])
  const [inviteUsername, setInviteUsername] = useState("")
  const [pendingInvites, setPendingInvites] = useState([])
  const activeCommunity =
  selectedCommunity === "GLOBAL"
    ? null
    : communities.find((c) => c.id === selectedCommunity)

  const memberCount = communityMembers.length

const isInCommunity =
  feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL"

// ✅ MUST come AFTER communityMembers + user exist
const myMembership = isInCommunity
  ? communityMembers.find((m) => m.id === user?.id)
  : null

const isAdmin = myMembership?.role === "ADMIN"







  // 🔐 Auth bootstrap
  useEffect(() => {
  api("/auth/me")
    .then(setUser)
    .catch(() => {
      localStorage.removeItem("token")
      setUser(null)
    })
    .finally(() => setLoading(false))
}, [])


useEffect(() => {
  if (!user) return

  api("/users/me")
    .then((u) => {
      setUser(u)

      // ⛔ Handle cooldown / ban info
      if (u.cooldownUntil) {
        setCooldownInfo({
          cooldownUntil: u.cooldownUntil,
        })
      } else {
        setCooldownInfo(null)
      }
    })
    .catch(() => {})
}, [])


  const loadInvitations = async () => {
  try {
    const data = await api("/communities/invitations/my")
    setInvitations(data || [])
  } catch {}
}
  const loadCommunityInvites = async () => {
  if (selectedCommunity === "GLOBAL") return

  const data = await api(
    `/communities/${selectedCommunity}/invitations`
  )
  setPendingInvites(data || [])
}


  // 🏘 Load my communities
  const loadCommunities = async () => {
    try {
      const data = await api("/communities/my")
      setCommunities(data || [])
    } catch (err) {
      console.error("Failed to load communities", err)
    }
  }

const loadCommunityMembers = async () => {
  if (selectedCommunity === "GLOBAL") return

  try {
    const data = await api(
      `/communities/${selectedCommunity}/members`
    )
    setCommunityMembers(data || [])
  } catch (err) {
    console.error("Failed to load members", err)
  }
}

useEffect(() => {
  if (feedMode === "COMMUNITY" && selectedCommunity !== "GLOBAL") {
    loadCommunityMembers()
  } else {
    setCommunityMembers([])
  }
}, [feedMode, selectedCommunity])



  // 📰 Load feed
  const loadFeed = async () => {
    try {
      let endpoint

      if (feedMode === "LABEL" && activeLabel) {
        endpoint = `/posts/label/${activeLabel}`
      } else if (feedMode === "COMMUNITY" && selectedCommunity !== "GLOBAL") {
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
  
  useEffect(() => {
  if (feedMode === "COMMUNITY") {
    loadCommunityInvites()
  }
}, [selectedCommunity])

  // 🔁 Reload feed + communities
  useEffect(() => {
    if (!user) return
    loadFeed()
    loadCommunities()
  }, [user, feedMode, feedScope, selectedCommunity, activeLabel])

  // 🏷 Load labels for selected community
  useEffect(() => {
    if (!selectedCommunity || selectedCommunity === "GLOBAL") {
      setCommunityLabels([])
      return
    }

    // ⚠️ THIS ENDPOINT MUST EXIST (see backend section below)
    api(`/communities/${selectedCommunity}`)
      .then((c) => {
        setCommunityLabels(
          c.categories?.map((x) => x.categoryKey) || []
        )
      })
      .catch(() => {
        setCommunityLabels([])
      })
  }, [selectedCommunity])

  // ❤️ Like handler (backend is source of truth)
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
  <div
    style={{
      background: colors.bg,
      color: colors.text,
      minHeight: "100vh",
    }}
  >
    <Routes>

      <Route
  path="/login"
  element={
    user
      ? <Navigate to="/" />
      : <Login onLogin={setUser} />
  }
/>

<Route
  path="/signup"
  element={
    user
      ? <Navigate to="/" />
      : <Signup onSignup={setUser} />
  }
/>

<Route
  path="/"
  element={
    !user ? (
      <Navigate to="/login" />
    ) : (
      <>
      



        {/* HEADER */}
<header
  style={{
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
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
    {/* App title */}
    <strong>🌱 Social</strong>

    {/* Right side controls */}
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <button
  onClick={() => setShowCreateCommunity(true)}
  style={headerPrimaryButton(theme)}
>
  + Community
</button>


      <div style={{ position: "relative" }}>
  <select
    value={selectedCommunity}
    onChange={(e) => {
      setFeedMode("COMMUNITY")
      setActiveLabel(null)
      setSelectedCommunity(e.target.value)
    }}
    style={headerSelect(theme)}
  >
    {communities.map((c) => (
      <option key={c.id} value={c.id}>
        {c.scope === "GLOBAL" && "🌍"}
        {c.scope === "COUNTRY" && "🏳️"}
        {c.scope === "LOCAL" && "📍"} {c.name}
      </option>
    ))}
  </select>

  {/* dropdown arrow */}
  <span
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      fontSize: 10,
      color: theme.colors[theme.mode].textMuted,
    }}
  >
    ▼
  </span>
</div>


      {/* Username + Logout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          @{user.username}
        </span>

        <button
          onClick={handleLogout}
          style={headerGhostButton(theme)}
        >
          Logout
        </button>
      </div>
    </div>
  </div>
  
</header>

{cooldownInfo && (
  <div
    style={{
      background: "#fee2e2",
      color: "#7f1d1d",
      padding: "10px 16px",
      textAlign: "center",
      fontSize: 14,
    }}
  >
    🚫 You’re on cooldown until{" "}
    <strong>
      {new Date(cooldownInfo.cooldownUntil).toLocaleString()}
    </strong>
  </div>
)}

              {/* MAIN */}
              <main
              
                style={{
                  maxWidth: 720,
                  margin: "0 auto",
                  padding: 20,
                  background: theme.colors.bg,
                  minHeight: "100vh",
                }}
               >
                {/* 🔔 COMMUNITY INVITATIONS */}
  {invitations.length > 0 && (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        background: "#fef3c7",
        border: "1px solid #fde68a",
      }}
    >
      <strong>Community invitations</strong>

      {invitations.map((inv) => (
        <div
          key={inv.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>
            Invited to <strong>{inv.community.name}</strong>{" "}
            by @{inv.invitedBy.username}
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={async () => {
                await api(
                  `/communities/invitations/${inv.id}/accept`,
                  { method: "POST" }
                )
                setInvitations((prev) =>
                  prev.filter((i) => i.id !== inv.id)
                )
                loadCommunities()
              }}
            >
              Accept
            </button>

            <button
              onClick={async () => {
                await api(
                  `/communities/invitations/${inv.id}/decline`,
                  { method: "POST" }
                )
                setInvitations((prev) =>
                  prev.filter((i) => i.id !== inv.id)
                )
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  )}

{isInCommunity && (
  <div style={{ marginBottom: 16 }}>
    <button
      onClick={() => {
        setFeedMode("GLOBAL")
        setSelectedCommunity("GLOBAL")
        setActiveLabel(null)
      }}
      style={secondaryButton(theme)}
    >
      ← Back to Global feed
    </button>
  </div>
  
)}

{isInCommunity && activeCommunity && (
  <div
    style={{
      marginBottom: 16,
      padding: "12px 16px",
      borderRadius: 16,
      background: "#f8fafc",
      border: "1px solid #e5e7eb",
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 600 }}>
      {activeCommunity.scope === "GLOBAL" && "🌍"}
      {activeCommunity.scope === "COUNTRY" && "🏳️"}
      {activeCommunity.scope === "LOCAL" && "📍"}{" "}
      {activeCommunity.name}
    </div>

    <div
      style={{
        marginTop: 4,
        fontSize: 13,
        color: "#475569",
      }}
    >
      {activeCommunity.scope.toLowerCase()} community •{" "}
      {memberCount} member{memberCount !== 1 ? "s" : ""}
    </div>
  </div>
)}



                <PostComposer
  onPostCreated={loadFeed}
  setCooldownInfo={setCooldownInfo}
  activeCommunity={activeCommunity}
  feedMode={feedMode}
  theme={theme}
/>




{feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL" && (
    

    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>Community members</strong>
        <button
          onClick={() => setShowMembers((v) => !v)}
        >
          {showMembers ? "Hide" : "Show"}
        </button>
      </div>

      {showMembers && (
        <div style={{ marginTop: 8 }}>
          {communityMembers.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                fontSize: 14,
              }}
            >
              <span>
                @{m.username}
                {m.role === "ADMIN" && " 👑"}
                {m.role === "MODERATOR" && " 🛡"}
              </span>

              <span style={{ fontSize: 12, opacity: 0.7 }}>
                {m.role}
              </span>
            </div>
          ))}

          {communityMembers.length === 0 && (
            <p style={{ fontSize: 13, opacity: 0.6 }}>
              No members yet
            </p>
          )}
        </div>
      )}
    </div>
)}

{isInCommunity && (
  <button
    onClick={async () => {
      const res = await api(
        `/communities/${selectedCommunity}/leave`,
        { method: "POST" }
      )

      // Reset UI to world state
      setSelectedCommunity("GLOBAL")
      setFeedMode("GLOBAL")
      loadCommunities()
    }}
    style={{
      marginTop: 12,
      background: "#fee2e2",
      color: "#7f1d1d",
    }}
  >
    Leave community
  </button>
)}


                {/* COMMUNITY LABEL EDITOR */}
                {feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL" &&
  activeCommunity?.role === "ADMIN" && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 12,
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <strong>Community labels</strong>
                        <button
                          onClick={() =>
                            setEditingLabels((v) => !v)
                          }
                        >
                          {editingLabels ? "Done" : "Edit"}
                        </button>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        {communityLabels.map((l) => (
                          <span
                            key={l}
                            onClick={() =>
                              editingLabels &&
                              setCommunityLabels((prev) =>
                                prev.filter((x) => x !== l)
                              )
                            }
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "#e0f2fe",
                              fontSize: 12,
                              cursor: editingLabels
                                ? "pointer"
                                : "default",
                            }}
                          >
                            #{l}
                          </span>
                        ))}
                      </div>

                      {editingLabels && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 8,
                          }}
                        >
                          <input
                            placeholder="Add label"
                            value={labelInput}
                            onChange={(e) =>
                              setLabelInput(e.target.value)
                            }
                          />
                          <button
                            onClick={() => {
                              if (!labelInput.trim()) return
                              setCommunityLabels((prev) => [
                                ...new Set([
                                  ...prev,
                                  labelInput
                                    .trim()
                                    .toLowerCase(),
                                ]),
                              ])
                              setLabelInput("")
                            }}
                          >
                            Add
                          </button>
                        </div>
                      )}

                      {editingLabels && (
                        <button
                          style={{ marginTop: 10 }}
                          onClick={async () => {
                            await api(
                              `/communities/${selectedCommunity}/categories`,
                              {
                                method: "PATCH",
                                body: JSON.stringify({
                                  categories: communityLabels,
                                }),
                              }
                            )
                            await loadFeed()
                            setEditingLabels(false)
                          }}
                        >
                          Save & rebuild feed
                        </button>
                      )}
                    </div>
                  )}

{feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL" &&
  activeCommunity?.role === "ADMIN" && (
  <div
    style={{
      marginBottom: 16,
      padding: 12,
      borderRadius: 12,
      background: "#fff7ed",
      border: "1px solid #fed7aa",
    }}
  >
    <strong>Invite member</strong>

    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input
        placeholder="Username"
        value={inviteUsername}
        onChange={(e) => setInviteUsername(e.target.value)}
      />
      <button
        onClick={async () => {
          if (!inviteUsername.trim()) return
          await api(
            `/communities/${selectedCommunity}/invitations`,
            {
              method: "POST",
              body: JSON.stringify({
                username: inviteUsername.trim(),
              }),
            }
          )
          setInviteUsername("")
          loadCommunityInvites()
        }}
      >
        Invite
      </button>
    </div>

    {pendingInvites.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <strong style={{ fontSize: 13 }}>
          Pending invitations
        </strong>

        {pendingInvites.map((inv) => (
          <div
            key={inv.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 13,
            }}
          >
            <span>
              @{inv.invitedUser.username}
            </span>

            <button
              onClick={async () => {
                await api(
                  `/communities/invitations/${inv.id}/revoke`,
                  { method: "POST" }
                )
                loadCommunityInvites()
              }}
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

                {/* FEED SCOPE */}
                {feedMode !== "COMMUNITY" && (
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
)}


                {/* ACTIVE LABEL */}
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
                  theme={theme}
                />
                {feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL" && (
    <CommunityChat communityId={selectedCommunity} />
)}

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

              {showCreateCommunity && (
  <CreateCommunityModal
    onClose={() => setShowCreateCommunity(false)}
    onCreated={(community) => {
      setCommunities((prev) => [...prev, community])
      setFeedMode("COMMUNITY")
      setSelectedCommunity(community.id)
    }}
    setCooldownInfo={setCooldownInfo}
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
     </div>

  )
}