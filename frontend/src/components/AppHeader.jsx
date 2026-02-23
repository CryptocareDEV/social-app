import { Link, useNavigate } from "react-router-dom"
import { useRef, useState, useEffect } from "react"
import { getThemeColors } from "../ui/theme"
import {
  headerGhostButton,
  ghostButton,
  dangerButton,
} from "../ui/buttonStyles"

export default function AppHeader({
  theme,
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
const handleNotificationClick = (n) => {
  setShowNotifications(false)

  if (!n.postId) return

  sessionStorage.setItem("highlightPostId", n.postId)

  if (n.communityId) {
    navigate(`/communities/${n.communityId}`, {
      state: { highlightPostId: n.postId, fromNotification: true },
    })
  } else {
    navigate("/", {
      state: { highlightPostId: n.postId, fromNotification: true },
    })
  }
}
  const handleMarkAllRead = async () => {
  try {
    await fetch("/notifications/mark-all-read", {
      method: "POST",
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
            style={{
              fontSize: theme.typography.h3.size,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            🌱 Social
          </div>

          {activeFeedProfileName && (
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowProfileMenu((v) => !v)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  fontSize: 12,
                  fontWeight: 500,
                  color: colors.textMuted,
                }}
              >
                <span style={{ fontSize: 11 }}>MODE</span>
                <span
  style={{
    fontWeight: 600,
    color: colors.text,
    maxWidth: isMobile ? 80 : 140,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
    verticalAlign: "bottom",
  }}
>
  {activeFeedProfileName}
</span>
                <span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
              </div>

              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: 40,
                    left: 0,
                    minWidth: 200,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    boxShadow: theme.shadow.sm,
                    padding: 8,
                    zIndex: 100,
                  }}
                >
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
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          background: isActive
                            ? colors.primary + "15"
                            : "transparent",
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
        setShowNotifications((v) => !v)
        if (!showNotifications) loadNotifications()
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
      style={headerGhostButton(theme)}
    >
      @{user.username} ▾
    </button>

    {showUserMenu && (
      <div
  style={{
    position: "absolute",
    right: 0,
    top: 42,
    minWidth: 220,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.md,
    padding: 0,
    zIndex: 200,
  }}
>
  {/* Profile */}
  <div
    onClick={() => {
      setShowUserMenu(false)
      window.location.href = `/profile/${user.id}`
    }}
    style={{
      padding: "8px 10px",
      borderRadius: theme.radius.sm,
      fontSize: theme.typography.small.size,
      color: colors.text,
      cursor: "pointer",
      background: "transparent",
    }}
  >
    View Profile
  </div>

  {/* Theme */}
  <div
    onClick={() => {
      toggleTheme()
      setShowUserMenu(false)
    }}
    style={{
      padding: "8px 10px",
      borderRadius: theme.radius.sm,
      fontSize: theme.typography.small.size,
      color: colors.text,
      cursor: "pointer",
      background: "transparent",
    }}
  >
    {theme.mode === "light"
      ? "Switch to Dark Mode"
      : "Switch to Light Mode"}
  </div>

  <div
    style={{
      height: 1,
      background: colors.border,
      margin: `${theme.spacing.sm}px 0`,
    }}
  />

  {/* Logout */}
  <div
    onClick={() => {
      setShowUserMenu(false)
      handleLogout()
    }}
    style={{
      padding: "8px 10px",
      borderRadius: theme.radius.sm,
      fontSize: theme.typography.small.size,
      color: colors.danger,
      cursor: "pointer",
      background: "transparent",
    }}
  >
    Logout
  </div>
</div>
    )}
  </div>
</div>
      </div>
    </header>
  )
}
