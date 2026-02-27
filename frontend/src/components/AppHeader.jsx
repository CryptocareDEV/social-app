import { Link, useNavigate } from "react-router-dom"
import { useRef, useState, useEffect } from "react"
import { getThemeColors } from "../ui/theme"
import {
  headerGhostButton,
  ghostButton,
  dangerButton,
} from "../ui/buttonStyles"
import { api } from "../api/client"

export default function AppHeader({
  theme,
  setTheme,
  user,
  isMobile,
  activeFeedProfileName,
  feedProfiles,
  activeFeedProfileId,
  showProfileMenu,
  setShowProfileMenu,
  handleFeedProfileSwitch,
  goToFeedProfiles,
  toggleTheme,
  handleLogout,
  unreadCount,
  loadNotifications,
  showNotifications,
  setShowNotifications,
  notifications,
  loadingNotifications,
  setHighlightPostId,
}) {
  const colors = getThemeColors(theme)
  const navigate = useNavigate()
  const formatNotification = (n) => {
  const actor = n.actor?.username || "Someone"

  switch (n.type) {
    case "LIKE_POST":
      return `${actor} liked your post`

    case "COMMENT_POST":
      return `${actor} commented on your post`

    case "REPLY_COMMENT":
      return `${actor} replied to your comment`

    case "COMMUNITY_POST":
      return `${actor} posted in ${n.community?.name}`

    default:
      return `${actor} interacted with you`
  }
}

const menuItemStyle = (colors) => ({
  padding: "8px 10px",
  borderRadius: 10,
  border: "none",
  background: "transparent",
  fontSize: 13,
  cursor: "pointer",
  textAlign: "left",
  color: colors.text,
  transition: "background 0.15s ease",
})

const handleNotificationClick = async (n) => {
  setShowNotifications(false)

  if (!n.postId) return

  try {
    await fetch(`/api/v1/notifications/${n.id}/read`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
  } catch {}

  if (n.communityId) {
    navigate(`/communities/${n.communityId}`)
  } else {
    navigate("/")
  }

  // 🔥 Directly trigger highlight
  setHighlightPostId(n.postId)
}

  const handleMarkAllRead = async () => {
  try {
    await fetch("/api/v1/notifications/read-all", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    loadNotifications()
  } catch (err) {
    console.error("Failed to mark all read")
  }
}
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
  if (!showNotifications) return

  const handleScroll = () => setShowNotifications(false)

  window.addEventListener("scroll", handleScroll)
  return () => window.removeEventListener("scroll", handleScroll)
}, [showNotifications])

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setShowNotifications(false)
    }

    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(event.target)
    ) {
      setShowUserMenu(false)
    }
  }

  document.addEventListener("mousedown", handleClickOutside)
  return () =>
    document.removeEventListener("mousedown", handleClickOutside)
}, [])

  if (!user) return null

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: isMobile ? "10px 12px" : "14px 20px",
      }}
    >
      <div
        style={{
          maxWidth: isMobile ? "100%" : 720,
          margin: isMobile ? 0 : "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
  onClick={() => navigate("/")}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  }}
>
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: 8,
      background: colors.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      fontWeight: 700,
      color: "#fff",
    }}
  >
    C
  </div>

  <div
    style={{
      fontSize: theme.typography.h3.size,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: colors.text
    }}
  >
    Civic
  </div>
</div>

          {activeFeedProfileName && (
            <div style={{ position: "relative" }}>
              <div
  onClick={() => setShowProfileMenu((v) => !v)}
  style={{
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: isMobile ? "6px 10px" : "6px 12px",
    borderRadius: 999,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
  }}
>
  <span style={{ opacity: 0.6 }}>Lens:</span>

  <span
    style={{
      fontWeight: 600,
      maxWidth: isMobile ? 90 : 150,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    {activeFeedProfileName}
  </span>

  <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
</div>

              {showProfileMenu && (
  <div
    style={{
      position: "absolute",
      top: 46,
      left: 0,
      minWidth: 240,
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      boxShadow: theme.shadow.md,
      padding: 10,
      zIndex: 100,
    }}
  >
    <div
  style={{
    padding: "6px 8px",
    fontSize: 12,
    color: colors.textMuted,
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: 8,
  }}
>
  Lenses shape what flows into your feed.
</div>
                  {feedProfiles.map((p) => {
                    const isActive = p.id === activeFeedProfileId

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleFeedProfileSwitch(p)
                        }}
                        style={{
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  cursor: "pointer",
  transition: "all 0.15s ease",
  background: isActive
    ? theme.mode === "dark"
      ? colors.primary + "22"
      : colors.primary + "14"
    : "transparent",
  color: isActive ? colors.primary : colors.text,
  fontWeight: isActive ? 600 : 500,
}}
                      >
                        {p.name}
                      </div>
                    )
                  })}

                  {feedProfiles.length === 1 && (
                    <>
                      <div
                        style={{
                          height: 1,
                          background: colors.border,
                          margin: "8px 0",
                        }}
                      />
                      <div
                        onClick={goToFeedProfiles}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          color: colors.primary,
                        }}
                      >
                        + Create new lens
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  }}
>
  {/* 🔔 Notifications */}
  <div ref={notificationRef} style={{ position: "relative" }}>
    <button
      onClick={() => {
  setShowNotifications((prev) => {
    if (!prev) loadNotifications()
    return !prev
  })
}}
      style={headerGhostButton(theme)}
    >
      🔔
    </button>

    {unreadCount > 0 && (
      <span
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          background: colors.primary,
          color: "#fff",
          fontSize: 11,
          padding: "2px 6px",
          borderRadius: theme.radius.pill,
          fontWeight: 600,
        }}
      >
        {unreadCount}
      </span>
    )}

    
    {showNotifications && (
  <div
    style={{
  position: isMobile ? "fixed" : "absolute",
  top: isMobile ? 60 : 42,
  right: isMobile ? 12 : 0,
  left: isMobile ? 12 : "auto",
  width: isMobile ? "auto" : 320,
  maxWidth: isMobile ? "calc(100vw - 24px)" : 320,
  maxHeight: 360,
  overflowY: "auto",
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: theme.radius.md,
  boxShadow: theme.shadow.md,
  padding: 0,
  zIndex: 1000,
}}
  >
   {/* HEADER */}
<div
  style={{
    position: "sticky",
    top: 0,
    background: colors.surface,
    zIndex: 2,
    padding: "10px 12px",
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <span
    style={{
      fontSize: 14,
      fontWeight: 600,
      color: colors.text,
    }}
  >
    Notifications
  </span>

  {unreadCount > 0 && (
    <span
      onClick={(e) => {
        e.stopPropagation()
        handleMarkAllRead()
      }}
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: colors.primary,
        cursor: "pointer",
        padding: "4px 6px",
        borderRadius: 6,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.surfaceMuted
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      Mark all read
    </span>
  )}
</div>
<div style={{ padding: "6px 8px" }}>
    {loadingNotifications ? (
      <div style={{ padding: 12, color: colors.textMuted }}>
        Loading...
      </div>
    ) : !notifications || notifications.length === 0 ? (
      <div style={{ padding: 12, color: colors.textMuted }}>
        No notifications
      </div>
    ) : (
      notifications.map((n) => {
  const baseBg = n.readAt
    ? "transparent"
    : colors.primarySoft

  return (
    <div
      key={n.id}
      onClick={() => handleNotificationClick(n)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.surfaceMuted
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = baseBg
      }}
      style={{
        padding: "8px 10px",
        borderRadius: theme.radius.sm,
        fontSize: theme.typography.small.size,
        cursor: "pointer",
        background: baseBg,
        transition: "background 0.15s ease",
      }}
    >
      <div style={{ fontWeight: 500 }}>
        {formatNotification(n)}
      </div>

      <div
        style={{
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        }}
      >
        {new Date(n.createdAt).toLocaleString()}
      </div>
    </div>
  )
})
    )}
  </div>
  </div>
    )}
  </div>

  {/* 👤 User Dropdown */}
  <div ref={userMenuRef} style={{ position: "relative" }}>
    <button
  onClick={() => setShowUserMenu((v) => !v)}
  style={{
    width: 34,
    height: 34,
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: colors.surfaceMuted,
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {user.username[0].toUpperCase()}
</button>

    {showUserMenu && (
  <div
    style={{
      position: isMobile ? "fixed" : "absolute",
      right: isMobile ? 12 : 0,
      left: isMobile ? 12 : "auto",
      top: isMobile ? "auto" : 46,
      bottom: isMobile ? 12 : "auto",
      width: isMobile ? "auto" : 260,
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 16,
      boxShadow: theme.shadow.md,
      padding: 12,
      zIndex: 200,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}
  >
    {/* Header */}
    <div
      style={{
        padding: "6px 8px",
        fontSize: 13,
        fontWeight: 600,
        color: colors.text,
      }}
    >
      @{user.username}
    </div>

    <div
      style={{
        height: 1,
        background: colors.border,
        margin: "4px 0",
      }}
    />

    {/* Profile */}
    <button
      onClick={() => {
        setShowUserMenu(false)
        navigate(`/profile/${user.id}`)
      }}
      style={menuItemStyle(colors)}
    >
      👤 Profile
    </button>

    {/* Create Community */}
    <button
      onClick={() => {
        setShowUserMenu(false)
        navigate(`/profile/${user.id}`, {
          state: { openTab: "COMMUNITIES" },
        })
      }}
      style={menuItemStyle(colors)}
    >
      🏘 Create Community
    </button>

    {/* Theme Toggle */}
    <button
      onClick={() => {
        toggleTheme()
      }}
      style={menuItemStyle(colors)}
    >
      {theme.mode === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
    <div
  style={{
    padding: "10px 12px",
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    gap: 8,
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
        // 🔥 optimistic UI update first
        setTheme((prev) => ({
          ...prev,
          accent: a,
        }))

        try {
          await api("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ accentTheme: a }),
          })
        } catch (err) {
          console.error("Accent update failed")
        }
      }}
      style={{
        width: 20,
        height: 20,
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

    <div
      style={{
        height: 1,
        background: colors.border,
        margin: "4px 0",
      }}
    />

    {/* Logout */}
    <button
      onClick={() => {
        setShowUserMenu(false)
        handleLogout()
      }}
      style={{
        ...menuItemStyle(colors),
        color: colors.danger,
      }}
    >
      Logout
    </button>
  </div>
)}
  </div>
</div>
      </div>
    </header>
  )
}
