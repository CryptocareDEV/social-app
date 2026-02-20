import { useEffect, useState, useCallback, useRef } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { Link, useNavigate } from "react-router-dom"
import SuperuserDashboard from "./pages/SuperuserDashboard"
import useNow from "./hooks/useNow"



import Login from "./pages/Login"
import Feed from "./components/Feed"
import PostComposer from "./components/PostComposer"
import Profile from "./pages/Profile"
import MemeEditor from "./components/MemeEditor"
import CreateCommunityModal from "./components/CreateCommunityModal"
import CommunityModerationDashboard from "./pages/CommunityModerationDashboard"
import ModerationDashboard from "./pages/ModerationDashboard"
import CommunityChat from "./components/CommunityChat"
import CommunityActionBar from "./components/CommunityActionBar"
import Signup from "./pages/Signup"
import {
  primaryButton,
  secondaryButton,
  ghostButton,
  dangerButton,
  headerPrimaryButton,
  headerGhostButton,
  headerSelect, 
} from "./ui/buttonStyles"

import CommunityPage from "./pages/CommunityPage"


import { theme as baseTheme, getThemeColors } from "./ui/theme"
import { api } from "./api/client"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // 🎨 Theme (Phase 1 foundation)
  const [theme, setTheme] = useState({
  ...baseTheme,
  mode: "light",
  accent: "CALM",
})

const toggleTheme = async () => {
  const nextMode = theme.mode === "light" ? "DARK" : "LIGHT"

  try {
    const updated = await api("/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        themeMode: nextMode,
      }),
    })

    setTheme((t) => ({
      ...t,
      mode: updated.themeMode === "DARK" ? "dark" : "light",
    }))

    setUser((prev) => ({
      ...prev,
      themeMode: updated.themeMode,
    }))
  } catch (err) {
    alert("Failed to update theme")
  }
}

  const colors = getThemeColors(theme)


  const [posts, setPosts] = useState([])
  const [isSwitchingFeed, setIsSwitchingFeed] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
const [loadingMoreFeed, setLoadingMoreFeed] = useState(false)
const loadMoreRef = useRef(null)
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
const [activeFeedProfileId, setActiveFeedProfileId] = useState(null)
const [activeFeedProfileName, setActiveFeedProfileName] = useState(null)
const now = useNow(1000)
let cooldownRemaining = 0

if (cooldownInfo?.until) {
  cooldownRemaining =
    new Date(cooldownInfo.until).getTime() - now
}

const isOnCooldown = cooldownRemaining > 0

  
  
const handleLogout = () => {
  localStorage.removeItem("token")
  setUser(null)
}
const refreshUserState = useCallback(async () => {
  try {
    const u = await api("/users/me")

    setUser(u)

    if (u.reportCooldownUntil) {
      setCooldownInfo({
        type: "REPORT",
        until: u.reportCooldownUntil,
      })
    } else if (u.cooldownUntil) {
      setCooldownInfo({
        type: "ACTION",
        until: u.cooldownUntil,
      })
    } else {
      setCooldownInfo(null)
    }
  } catch (err) {
    console.error("Failed to refresh user state")
  }
}, [])



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
  const isCommunityModerator =
  myMembership?.role === "ADMIN" ||
  myMembership?.role === "MODERATOR"


const isAdmin = myMembership?.role === "ADMIN"




useEffect(() => {
  api("/users/me")
    .then((u) => {
      setUser(u)
      setTheme((t) => ({
  ...t,
  mode: u.themeMode === "DARK" ? "dark" : "light",
  accent: u.accentTheme || "CALM",
}))
      loadInvitations()
      loadCommunities()

      // Priority order:
      // 1. Report cooldown
      // 2. Post / action cooldown
      if (u.reportCooldownUntil) {
        setCooldownInfo({
          type: "REPORT",
          until: u.reportCooldownUntil,
        })
      } else if (u.cooldownUntil) {
        setCooldownInfo({
          type: "ACTION",
          until: u.cooldownUntil,
        })
      } else {
        setCooldownInfo(null)
      }
    })
    .catch(() => {
      localStorage.removeItem("token")
      setUser(null)
    })
    .finally(() => setLoading(false))
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
useEffect(() => {
  if (user) {
    loadInvitations()
  }
}, [user])


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
  if (!user) return

  api("/feed-profiles")
    .then((profiles) => {
      const active = profiles?.find((p) => p.isActive)
      if (active) {
        setActiveFeedProfileId(active.id)
        setActiveFeedProfileName(active.name)
      }
    })
    .catch(() => {
      // fail silently – feed still works with default profile
    })
}, [user])


useEffect(() => {
  if (!isOnCooldown && cooldownInfo) {
    setCooldownInfo(null)
  }
}, [isOnCooldown])


useEffect(() => {
  if (feedMode === "COMMUNITY" && selectedCommunity !== "GLOBAL") {
    loadCommunityMembers()
  } else {
    setCommunityMembers([])
  }
}, [feedMode, selectedCommunity])




  // 📰 Load feed
  // 📰 Load feed (single source of truth)
const loadFeed = async () => {
  try {
    let endpoint = null

    if (feedMode === "LABEL" && activeLabel) {
      endpoint = `/posts/label/${activeLabel}`
    } 
    else if (
      feedMode === "COMMUNITY" &&
      selectedCommunity &&
      selectedCommunity !== "GLOBAL"
    ) {
      endpoint = `/communities/${selectedCommunity}/feed`
    } 
    else {
      endpoint = `/posts/feed/${feedScope}`
    }

    if (!endpoint) return

    if (!user) return


    const query = nextCursor ? `?cursor=${nextCursor}` : ""

const data = await api(
  `${endpoint}${query}`,
  {
    headers: activeFeedProfileId
      ? { "X-Feed-Profile": activeFeedProfileId }
      : {},
  }
)



    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : []

    const formatted = items.map((p) => ({
  ...p,
  likedByMe: !!p.likedByMe,
}))

if (nextCursor) {
  // append mode
  setPosts((prev) => [...prev, ...formatted])
} else {
  // fresh load
  setPosts(formatted)
}

setNextCursor(data?.nextCursor || null)

  } catch (err) {
    console.error("Failed to load feed", err)
    setPosts([]) // fail-safe: never leave stale feed
  }
}
const loadMoreFeed = useCallback(async () => {
  if (!nextCursor || loadingMoreFeed) return

  setLoadingMoreFeed(true)
  await loadFeed()
  setLoadingMoreFeed(false)
}, [nextCursor, loadingMoreFeed, loadFeed])
useEffect(() => {
  if (!nextCursor) return
  if (!loadMoreRef.current) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMoreFeed()
      }
    },
    {
      rootMargin: "200px",
    }
  )

  observer.observe(loadMoreRef.current)

  return () => observer.disconnect()
}, [nextCursor, loadMoreFeed])


// 🔥 DELETE COMMUNITY (ADMIN + only member)
const handleDeleteCommunity = async () => {
  if (!activeCommunity) return

  const ok = window.confirm(
    "Delete this community permanently? This action cannot be undone."
  )
  if (!ok) return

  try {
    await api(`/communities/${activeCommunity.id}`, {
      method: "DELETE",
    })

    // Remove from UI state
    setCommunities((prev) =>
      prev.filter((c) => c.id !== activeCommunity.id)
    )

    // Reset navigation
    setSelectedCommunity("GLOBAL")
    setFeedMode("GLOBAL")
    setCommunityMembers([])
    setCommunityLabels([])

    await loadFeed()
  } catch (err) {
    alert(err?.error || "Failed to delete community")
  }
}

// 🚪 LEAVE COMMUNITY (non-admin OR admin with another admin present)
const handleLeaveCommunity = async () => {
  try {
    await api(`/communities/${selectedCommunity}/leave`, {
      method: "POST",
    })

    setCommunities((prev) =>
      prev.filter((c) => c.id !== selectedCommunity)
    )

    setSelectedCommunity("GLOBAL")
    setFeedMode("GLOBAL")
    setCommunityMembers([])

    await loadFeed()
  } catch (err) {
    alert(err?.error || "Failed to leave community")
  }
}

  
  // 📩 Load community invites when entering a community
useEffect(() => {
  if (
    feedMode === "COMMUNITY" &&
    selectedCommunity &&
    selectedCommunity !== "GLOBAL"
  ) {
    loadCommunityInvites()
  }
}, [feedMode, selectedCommunity])


  // 🔁 Reload feed + communities
  // 🔁 Reload feed when feed inputs change
useEffect(() => {
  if (!user) return

  setNextCursor(null)
  setIsSwitchingFeed(true)

  const loadFresh = async () => {
    try {
      let endpoint = null

      if (feedMode === "LABEL" && activeLabel) {
        endpoint = `/posts/label/${activeLabel}`
      } 
      else if (
        feedMode === "COMMUNITY" &&
        selectedCommunity &&
        selectedCommunity !== "GLOBAL"
      ) {
        endpoint = `/communities/${selectedCommunity}/feed`
      } 
      else {
        endpoint = `/posts/feed/${feedScope}`
      }

      if (!endpoint) return

      const data = await api(endpoint, {
        headers: activeFeedProfileId
          ? { "X-Feed-Profile": activeFeedProfileId }
          : {},
      })

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : []

      const formatted = items.map((p) => ({
        ...p,
        likedByMe: !!p.likedByMe,
      }))

      setPosts(formatted)
      setNextCursor(data?.nextCursor || null)
    } catch (err) {
      console.error("Failed to load feed", err)
    } finally {
      setIsSwitchingFeed(false)
    }
  }

  loadFresh()

}, [
  user,
  feedMode,
  feedScope,
  selectedCommunity,
  activeLabel,
  activeFeedProfileId,
])



  // 🏷 Load labels for selected community
  // 🏷 Load labels for selected community
useEffect(() => {
  if (!selectedCommunity || selectedCommunity === "GLOBAL") {
    setCommunityLabels([])
    return
  }

  api(`/communities/${selectedCommunity}`)
    .then((c) => {
      setCommunityLabels(
        Array.isArray(c?.categories)
          ? c.categories.map((x) => x.categoryKey)
          : []
      )
    })
    .catch(() => {
      setCommunityLabels([])
    })
}, [selectedCommunity])


  // ❤️ Like handler (backend is source of truth)
  const handleLike = useCallback(async (postId) => {
  setLikingIds((prev) => {
    if (prev.has(postId)) return prev
    const next = new Set(prev)
    next.add(postId)
    return next
  })

  try {
    const res = await api(`/likes/${postId}`, { method: "POST" })

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: res.liked,
              _count: {
                ...p._count,
                likes: res.likeCount,
              },
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
}, [])
const handleLabelClick = useCallback((label) => {
  setFeedMode("LABEL")
  setActiveLabel(label)
}, [])

const handleMemeOpen = useCallback((p) => {
  setMemePost(p)
}, [])



  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>
  }



  return (
  <div
  style={{
    background: colors.bg,
    color: colors.text,
    minHeight: "100vh",
    transition: "background 0.4s ease",
  }}
>
    <Routes>

      <Route
    path="/login"
    element={
      user ? <Navigate to="/" /> : <Login onLogin={setUser} />
    }
  />

<Route
    path="/signup"
    element={
      user ? <Navigate to="/" /> : <Signup onSignup={setUser} />
    }
  />


  <Route
  path="/moderation"
  element={
    user && (user.isSuperuser || user.isRoot)
      ? <ModerationDashboard />
      : <Navigate to="/" />
  }
/>

<Route
  path="/superusers"
  element={
    user && (user.isSuperuser || user.isRoot)
      ? <SuperuserDashboard />
      : <Navigate to="/" />
  }
/>



<Route
  path="/communities/:id/moderation"
  element={
  user
    ? <CommunityModerationDashboard />
    : <Navigate to="/" />
}
/>

<Route
  path="/communities/:id"
  element={<CommunityPage theme={theme} />}
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
    padding: "14px 20px",
  }}
>
  <div
    style={{
      maxWidth: 720,
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
    }}
  >
    {/* App title */}
    <div
  style={{
    fontSize: theme.typography.h3.size,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  }}
>
  🌱 Social
</div>


    {/* Right side controls */}
    {activeFeedProfileName && (
  <div
  style={{
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 999,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
    color: colors.textMuted,
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}
>
  <span>Viewing as</span>
  <strong style={{ color: colors.text }}>
    {activeFeedProfileName}
  </strong>
</div>
)}

    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      







      <div style={{ position: "relative" }}>
  <select
  value={selectedCommunity}
  onChange={(e) => {
    const value = e.target.value
    setSelectedCommunity(value)
    setActiveLabel(null)
    setFeedMode(value === "GLOBAL" ? "GLOBAL" : "COMMUNITY")
  }}
  style={headerSelect(theme)}
>
  <option value="GLOBAL">🌍 Global feed</option>

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
        <Link
  to={`/profile/${user.id}`}
  style={{
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
    textDecoration: "none",
  }}
>
  @{user.username}
</Link>
        <button
  onClick={toggleTheme}
  style={headerGhostButton(theme)}
  title={
    theme.mode === "light"
      ? "Switch to dark mode"
      : "Switch to light mode"
  }
>
  {theme.mode === "light" ? "🌙" : "☀️"}
</button>


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

{cooldownInfo?.type === "REPORT" && isOnCooldown && (
  <div
    style={{
      background: "#fff7ed",
      color: "#be7056",
      padding: "10px 16px",
      textAlign: "center",
      fontSize: 14,
      borderBottom: "1px solid #fed7aa",
    }}
  >
    ⚠️ Reporting paused for{" "}
<strong>
  {Math.floor(cooldownRemaining / 60000)}m{" "}
  {Math.floor((cooldownRemaining % 60000) / 1000)}s
</strong>


    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
      This helps keep reports accurate and fair.
    </div>
  </div>
)}


              {/* MAIN */}
              <main
              
                style={{
                  maxWidth: "min(100%, 720px)",
margin: "0 auto",
padding: "24px 16px",
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
        background: colors.surfaceMuted,
border: `1px solid ${colors.border}`,
color: colors.textMuted
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
              style={primaryButton(theme)}
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
              style={secondaryButton(theme)}
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
      background: colors.surface,
border: `1px solid ${colors.border}`,
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
{isInCommunity && activeCommunity && (
  <CommunityActionBar
    theme={theme}
    colors={colors}
    community={activeCommunity}
    isAdmin={isAdmin}
    isModerator={isCommunityModerator}
    memberCount={memberCount}
    onInvite={() => {
      // scroll to invite section instead of duplicating UI
      document
        .getElementById("community-invite")
        ?.scrollIntoView({ behavior: "smooth" })
    }}
    onLeave={handleLeaveCommunity}
    onDelete={handleDeleteCommunity}
  />
)}

              


                <PostComposer
  onPostCreated={loadFeed}
  refreshUserState={refreshUserState}
  activeCommunity={activeCommunity}
  feedMode={feedMode}
  theme={theme}
  isMinor={user?.isMinor}
  nsfwEnabled={user?.nsfwEnabled}
/>





{feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL" && (
    

    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        background: colors.surfaceMuted,
border: `1px solid ${colors.border}`,
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

{/* 🔥 ADMIN: single-member → DELETE */}
{isInCommunity && isAdmin && memberCount === 1 && (
  <button
    onClick={handleDeleteCommunity}
    style={dangerButton(theme)}
  >
    Delete community
  </button>
)}

{/* 🚪 LEAVE COMMUNITY */}
{isInCommunity && (
  <>
    {/* MEMBER or MODERATOR */}
    {!isAdmin && (
      <button
        onClick={handleLeaveCommunity}
        style={secondaryButton(theme)}
      >
        Leave community
      </button>
    )}

    {/* ADMIN with other members */}
    {isAdmin && memberCount > 1 && (
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: colors.textMuted,
        }}
      >
        You must assign another admin before leaving this
        community.
      </div>
    )}
  </>
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
      id="community-invite"
      style={{
        marginBottom: 20,
        padding: 14,
        borderRadius: 16,
        background: colors.surface,
backdropFilter: "blur(8px)",
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        Invite people
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          placeholder="Username"
          value={inviteUsername}
          onChange={(e) => setInviteUsername(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
            fontSize: 14,
          }}
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
          style={primaryButton(theme)}
        >
          Invite
        </button>
      </div>

      {pendingInvites.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            Pending invitations
          </div>

          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: 10,
                background: colors.bg,
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <span>@{inv.invitedUser.username}</span>

              <button
                onClick={async () => {
                  await api(
                    `/communities/invitations/${inv.id}/revoke`,
                    { method: "POST" }
                  )
                  loadCommunityInvites()
                }}
                style={ghostButton(theme)}
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
  <div
    style={{
      display: "flex",
      gap: 8,
      marginBottom: 20,
      padding: 4,
      borderRadius: 999,
      background: colors.surfaceMuted,
      border: `1px solid ${colors.border}`,
      width: "fit-content",
    }}
  >
    {[
      { key: "GLOBAL", label: "🌍 Global" },
      { key: "COUNTRY", label: "🏳️ Country" },
      { key: "LOCAL", label: "📍 Local" },
    ].map((s) => {
      const isActive = feedScope === s.key

      return (
        <button
          key={s.key}
          onClick={() => {
            setFeedMode("GLOBAL")
            setActiveLabel(null)
            setFeedScope(s.key)
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",

            background: isActive
              ? colors.primary
              : "transparent",

            color: isActive
              ? "#ffffff"
              : colors.textMuted,
          }}
        >
          {s.label}
        </button>
      )
    })}
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
<div
  style={{
    background: colors.surface,
    borderRadius: 16,
    padding: 16,
    boxShadow: theme.shadow.sm,
    opacity: isSwitchingFeed ? 0.5 : 1,
    transition: "opacity 0.2s ease",
  }}
>
                <Feed
  posts={posts}
  onLike={handleLike}
  onMeme={handleMemeOpen}
  likingIds={likingIds}
  onLabelClick={handleLabelClick}

  theme={theme}
  reportCooldownUntil={
    cooldownInfo?.type === "REPORT"
      ? cooldownInfo.until
      : null
  }
  refreshUserState={refreshUserState}
/>
<div ref={loadMoreRef} style={{ height: 1 }} />


                </div>
                {feedMode === "COMMUNITY" &&
  selectedCommunity !== "GLOBAL" && (
    <CommunityChat communityId={selectedCommunity} />
)}

              </main>

              {memePost && (
                <MemeEditor
                  post={memePost}
                  theme={theme}
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
  element={
    user ? (
      <Profile
        theme={theme}
        setTheme={setTheme}
        currentUser={user}
        refreshUserState={refreshUserState}
        onFeedProfileChange={async ({ id, name }) => {
  setActiveFeedProfileId(id)
  setActiveFeedProfileName(name)
  setFeedMode("GLOBAL")
  setActiveLabel(null)
  setFeedScope("GLOBAL") // 🔥 force scope reset
  setNextCursor(null)    // 🔥 prevent stale pagination


}}


      />
    ) : (
      <Navigate to="/login" />
    )
  }
/>

    </Routes>
    
     </div>
     

  )
}