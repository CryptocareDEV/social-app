import { useEffect, useState, useCallback, useRef } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Link, useNavigate } from "react-router-dom"
import SuperuserDashboard from "./pages/SuperuserDashboard"
import useNow from "./hooks/useNow"
import useFeed from "./hooks/useFeed"
import useBreakpoint from "./hooks/useBreakpoint"
import AppHeader from "./components/AppHeader"


import Login from "./pages/Login"
import Feed from "./components/Feed"
import PostComposer from "./components/PostComposer"
import Profile from "./pages/Profile"
import MemeEditor from "./components/MemeEditor"
import CommunityModerationDashboard from "./pages/CommunityModerationDashboard"
import ModerationDashboard from "./pages/ModerationDashboard"
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

import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"

import CommunityPage from "./pages/CommunityPage"
import RootDashboard from "./pages/RootDashboard"

import { theme as baseTheme, getThemeColors } from "./ui/theme"
import { api } from "./api/client"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const goToFeedProfiles = () => {
  setShowProfileMenu(false)
  navigate(`/profile/${user?.id}`, {
    state: { openTab: "FEED" },
  })
}

  // 🎨 Theme (Phase 1 foundation)
  const [theme, setTheme] = useState({
  ...baseTheme,
  mode: "dark", // default dark
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
  
  const [feedMode, setFeedMode] = useState("GLOBAL") // GLOBAL | COMMUNITY | LABEL
  const [feedScope, setFeedScope] = useState("GLOBAL")
  const [activeLabel, setActiveLabel] = useState(null)
  const [cooldownInfo, setCooldownInfo] = useState(null)
  const [activeFeedProfileId, setActiveFeedProfileId] = useState(null)
  const [activeFeedProfileName, setActiveFeedProfileName] = useState(null)
  const [feedProfiles, setFeedProfiles] = useState([])
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false)
  const [showIntegrityBar, setShowIntegrityBar] = useState(false)
  const [feedCache, setFeedCache] = useState({})
  const [highlightPostId, setHighlightPostId] = useState(null)
  const now = useNow(1000)
let cooldownRemaining = 0

if (cooldownInfo?.until) {
  cooldownRemaining =
    new Date(cooldownInfo.until).getTime() - now
}

const isOnCooldown = cooldownRemaining > 0

const {
  posts,
  setPosts,
  totalCount,
  isSwitchingFeed,
  loadMoreRef,
  refreshFeed,
  loadingMore,
} = useFeed({
  user,
  feedMode,
  feedScope,
  activeLabel,
  activeFeedProfileId,
  setFeedCache,
})
  
const handleLogout = () => {
  localStorage.removeItem("token")
  setUser(null)
}
const refreshUserState = useCallback(async () => {
  try {
    const u = await api("/users/me")

    if (!u) return

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

  const [memePost, setMemePost] = useState(null)
  
  const [invitations, setInvitations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  
  
useEffect(() => {
  const bootAuth = async () => {
    try {
      const u = await api("/users/me")

      if (!u) {
        setUser(null)
        return
      }

      setUser(u)

      // Apply theme safely
      setTheme((t) => ({
        ...t,
        mode: u.themeMode === "DARK" ? "dark" : "light",
        accent: u.accentTheme || "CALM",
      }))

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
      if (err?.error === "Unauthorized") {
        setUser(null)
      } else {
        console.error("Auth boot unexpected error:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  bootAuth()
}, [])

useEffect(() => {
  if (!user) return

  loadInvitations()
  loadNotifications()

}, [user])


  const loadInvitations = async () => {
  try {
    const data = await api("/communities/invitations/my")
    setInvitations(data || [])
  } catch {}
}

const loadNotifications = async () => {
  try {
    setLoadingNotifications(true)
    const data = await api("/notifications")
    setNotifications(data.items || [])
    setUnreadCount(data.unreadCount || 0)
  } catch (err) {
    console.error("Failed to load notifications")
  } finally {
    setLoadingNotifications(false)
  }
}

useEffect(() => {
  if (!user) return

  api("/feed-profiles")
  .then((profiles) => {
    setFeedProfiles(profiles || [])

    const active = profiles?.find((p) => p.isActive)
    if (active) {
      setActiveFeedProfileId(active.id)
      setActiveFeedProfileName(active.name)
    }
  })
    .catch(() => {
      
    })
}, [user])
const handleFeedProfileSwitch = async (profile) => {
  if (isSwitchingProfile) return
setIsSwitchingProfile(true)
  try {
    await api(`/me/feed-profiles/${profile.id}/activate`, {
  method: "POST",
})

    setActiveFeedProfileId(profile.id)
    setActiveFeedProfileName(profile.name)

    setFeedMode("GLOBAL")
    setActiveLabel(null)
    setFeedScope("GLOBAL")

    if (feedCache[profile.id]) {
  setPosts(feedCache[profile.id])
} else {
  await refreshFeed()
}

setTimeout(() => {
  document.body.style.opacity = "1"
}, 150)
  } catch (err) {
    console.error("Failed to switch profile")
  }

  setTimeout(() => {
  setIsSwitchingProfile(false)
}, 300)
}

useEffect(() => {
  if (!isOnCooldown && cooldownInfo) {
    setCooldownInfo(null)
  }
}, [isOnCooldown, cooldownInfo])

useEffect(() => {
  const style = document.createElement("style")
  style.innerHTML = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `
  document.head.appendChild(style)
  return () => document.head.removeChild(style)
}, [])

useEffect(() => {
  if (!highlightPostId) return

  let attempts = 0
  const maxAttempts = 20

  const tryHighlight = () => {
    const el = document.getElementById(`post-${highlightPostId}`)

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.style.transition = "background 0.6s ease"
      el.style.background = "#fff7ed"

      setTimeout(() => {
        el.style.background = ""
      }, 2000)

      // 🔥 Consume trigger
      setHighlightPostId(null)

    } else if (attempts < maxAttempts) {
      attempts++
      setTimeout(tryHighlight, 200)
    }
  }

  tryHighlight()

}, [highlightPostId, posts])

useEffect(() => {
  setShowIntegrityBar(true)

  const timeout = setTimeout(() => {
    setShowIntegrityBar(false)
  }, 2000)

  return () => clearTimeout(timeout)

}, [feedScope, activeFeedProfileId, activeLabel])


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
}, [setPosts])
const handleLabelClick = useCallback((label) => {
  setFeedMode("LABEL")
  setActiveLabel(label)
}, [])

const handleMemeOpen = useCallback((p) => {
  setMemePost(p)
}, [])


useEffect(() => {
  const style = document.createElement("style")
  style.innerHTML = `
  @keyframes fadeInProfile {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes lensPulse {
    0% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    50% { box-shadow: 0 0 0 3px var(--lens-accent); }
    100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
  }
`
  document.head.appendChild(style)

  return () => {
    document.head.removeChild(style)
  }
}, [])

useEffect(() => {
  document.documentElement.style.setProperty(
    "--lens-accent",
    colors.primary + "22"
  )
}, [colors.primary])

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
    overflowX: "clip",
  }}
>
   <AppHeader
      theme={theme}
      setTheme={setTheme}
      user={user}
      isMobile={isMobile}
      activeFeedProfileName={activeFeedProfileName}
      feedProfiles={feedProfiles}
      activeFeedProfileId={activeFeedProfileId}
      showProfileMenu={showProfileMenu}
      setShowProfileMenu={setShowProfileMenu}
      handleFeedProfileSwitch={handleFeedProfileSwitch}
      goToFeedProfiles={goToFeedProfiles}
      toggleTheme={toggleTheme}
      handleLogout={handleLogout}
      unreadCount={unreadCount}
      loadNotifications={loadNotifications}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      notifications={notifications}
      loadingNotifications={loadingNotifications}
      setHighlightPostId={setHighlightPostId}
    />
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

<Route path="/root" element={<RootDashboard theme={theme} />} />

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
  element={
    <CommunityPage
      theme={theme}
      isMobile={isMobile}
    />
  }
/>

<Route
  path="/forgot-password"
  element={
    user ? <Navigate to="/" /> : <ForgotPassword theme={theme} isMobile={isMobile} />
  }
/>

<Route
  path="/reset-password"
  element={
    user ? <Navigate to="/" /> : <ResetPassword theme={theme} isMobile={isMobile} />
  }
/>

<Route
    path="/"
    element={
      !user ? (
        <Navigate to="/login" />
      ) : (
        <>


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
                  padding: isMobile ? "8px 0" : "24px 16px",
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


{/* FEED INTEGRITY PANEL */}
<div
  style={{
  position: "sticky",
  top: 70,
  zIndex: 5,
  marginBottom: 20,
  padding: isMobile ? "8px 12px" : "10px 16px",
  borderRadius: 10,
  background: isMobile ? "transparent" : colors.surface,
  border: `1px solid ${colors.border}`,
  fontSize: 12,
  color: colors.textMuted,
  opacity: showIntegrityBar ? 1 : 0,
  transform: showIntegrityBar ? "translateY(0)" : "translateY(-6px)",
  transition: "opacity 0.25s ease, transform 0.25s ease",
  pointerEvents: "none",
}}
>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: isMobile ? 10 : 16,
    }}
  >
    <div>
      <strong style={{ color: colors.text }}>Scope:</strong>{" "}
      {feedScope}
    </div>

    <div>
      <strong style={{ color: colors.text }}>Lens:</strong>{" "}
      {activeFeedProfileName}
    </div>

    <div>
  <strong style={{ color: colors.text }}>
    Posts
  </strong>{" "}
  {totalCount.toLocaleString()}
</div>

    {activeLabel && (
      <div>
        <strong style={{ color: colors.text }}>Filter:</strong>{" "}
        #{activeLabel}
      </div>
    )}
  </div>
</div>

                <PostComposer
  onPostCreated={refreshFeed}
  refreshUserState={refreshUserState}
  activeCommunity={null}
  feedMode="GLOBAL"
  theme={theme}
  isMinor={user?.isMinor}
  nsfwEnabled={user?.nsfwEnabled}
  isMobile={isMobile}
/>

                {/* FEED SCOPE */}
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
    background: isMobile ? "transparent" : colors.surface,
    borderRadius: isMobile ? 0 : 16,
    padding: isMobile ? 0 : 16,
    boxShadow: isMobile ? "none" : theme.shadow.sm,
  }}
>
                <Feed
  posts={posts}
  onLike={handleLike}
  onMeme={handleMemeOpen}
  likingIds={likingIds}
  onLabelClick={handleLabelClick}
  isMobile={isMobile}

  theme={theme}
  reportCooldownUntil={
    cooldownInfo?.type === "REPORT"
      ? cooldownInfo.until
      : null
  }
  refreshUserState={refreshUserState}
/>
<div ref={loadMoreRef} style={{ height: 1 }} />

{loadingMore && (
  <div
    style={{
      textAlign: "center",
      padding: "16px 0",
      color: colors.textMuted,
      fontSize: 14,
    }}
  >
    Loading more…
  </div>
)}


                </div>

              </main>

              {memePost && (
                <MemeEditor
                  post={memePost}
                  theme={theme}
                  onClose={() => setMemePost(null)}
                  onPosted={() => {
                    setMemePost(null)
                    refreshFeed()
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
        isMobile={isMobile}
        onFeedProfileChange={async ({ id, name }) => {
  setActiveFeedProfileId(id)
  setActiveFeedProfileName(name)
  setFeedMode("GLOBAL")
  setActiveLabel(null)
  setFeedScope("GLOBAL")
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