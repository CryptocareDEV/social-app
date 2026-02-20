import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"
import {
  primaryButton,
  dangerButton,
  ghostButton,
  secondaryButton,
} from "../ui/buttonStyles"
import Feed from "../components/Feed"
import PostComposer from "../components/PostComposer"
import CommunityChat from "../components/CommunityChat"


export default function CommunityPage({ theme }) {
  const { id } = useParams()
  const colors = getThemeColors(theme)
  const t = theme.typography
const s = theme.spacing

  const [openSections, setOpenSections] = useState({
  invite: true,
  requests: true,
  intention: true,
  labels: true,
})

  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [allCategories, setAllCategories] = useState([])


  const [joinRequests, setJoinRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [inviteUsername, setInviteUsername] = useState("")
const [inviting, setInviting] = useState(false)



  const [showAddLabel, setShowAddLabel] = useState(false)
  const [availableCategories, setAvailableCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [labelSearch, setLabelSearch] = useState("")

  const [addingLabel, setAddingLabel] = useState(false)


  const [activeTab, setActiveTab] = useState("feed")

  const [posts, setPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [me, setMe] = useState(null)


  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [myRole, setMyRole] = useState(null)
  const [selectedScopes, setSelectedScopes] = useState(["ALL"])


  const [editingIntention, setEditingIntention] = useState(false)
  const [intentionDraft, setIntentionDraft] = useState("")
  const [savingIntention, setSavingIntention] = useState(false)
  const isMember = !!myRole
  const isAdmin = myRole === "ADMIN"

  const renderSectionHeader = (key, title) => (
  <div
    onClick={() =>
      setOpenSections((prev) => ({
        ...prev,
        [key]: !prev[key],
      }))
    }
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      padding: "14px 16px",
      borderRadius: theme.radius.lg,
      background: colors.surfaceMuted,
      border: `1px solid ${colors.border}`,
      fontSize: t.h4.size,
      fontWeight: t.h4.weight,
      transition: "all 0.15s ease",
    }}
  >
    <span>{title}</span>

    <span
      style={{
        fontSize: 18,
        fontWeight: 600,
        color: colors.primary,
        lineHeight: 1,
      }}
    >
      {openSections[key] ? "−" : "+"}
    </span>
  </div>
)



  /* =====================
     Load community meta
  ====================== */
  useEffect(() => {
  let mounted = true
  setLoading(true)
  setError("")

  api("/users/me")
  .then((user) => {
    console.log("ME OBJECT 👉", user)
    if (mounted) setMe(user)
  })
  .catch(() => {
    if (mounted) setMe(null)
  })


  api(`/communities/${id}`)
    .then((data) => {
      if (!mounted) return
      setCommunity({
  ...data,
  labelImports: data.labelImports || [],
})
      const role =
  data.myRole ??
  data.membership?.role ??
  data.member?.role ??
  null

setMyRole(role)
console.log("Community role resolved →", role)
      setIntentionDraft(data.intention || "")
    })
    .catch(async (err) => {
      // 👇 FALLBACK TO PUBLIC VIEW
      try {
        const publicData = await api(`/communities/${id}/public`)
        if (!mounted) return

        setCommunity({
  ...publicData.community,
  labelImports: publicData.community.labelImports || [],
  myInvitationStatus: publicData.myInvitationStatus || null,
})

        setPosts(publicData.posts || [])
        setMyRole(null) // 🔒 not a member
      } catch {
        if (mounted) setError("Failed to load community")
      }
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
    if (activeTab !== "feed" || !isMember) return

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
  }, [activeTab, id, isMember])

useEffect(() => {
  if (!community) return

  api("/categories")
    .then((cats) => {
      const all = cats || []

      const importedKeys = new Set(
        (community.labelImports || []).map((l) => l.categoryKey)
      )

      const filtered = all.filter(
        (c) => !importedKeys.has(c.key)
      )

      setAllCategories(all)
      setAvailableCategories(filtered)
    })
    .catch(() => {
      setAvailableCategories([])
    })
}, [community])


useEffect(() => {
  if (showAddLabel) {
    setLabelSearch("")
    setSelectedCategory("")
  }
}, [showAddLabel])


useEffect(() => {
  if (activeTab !== "settings" || myRole !== "ADMIN") return

  setLoadingRequests(true)

  api(`/communities/${id}/invitations`)
    .then((data) => {
  if (!Array.isArray(data)) {
    setJoinRequests([])
    return
  }

  // 🔑 ONLY join requests (self-initiated)
  const onlyJoinRequests = data.filter(
    (i) => i.invitedById === i.invitedUserId
  )

  setJoinRequests(onlyJoinRequests)
})
    .catch(() => {
      setJoinRequests([])
    })
    .finally(() => {
      setLoadingRequests(false)
    })
}, [activeTab, myRole, id])


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
  maxWidth: 820,
  margin: "0 auto",
  padding: s.xl,
  fontFamily: t.fontFamily,
  background: colors.bg,
  boxSizing: "border-box",
}}
    >
      {/* Top navigation */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    fontSize: 13,
  }}
>
  <div style={{ display: "flex", gap: 12 }}>
  <Link
    to="/"
    style={{ textDecoration: "none", color: colors.textMuted }}
  >
    ← Home
  </Link>

  {me?.id && (
    <Link
      to={`/profile/${me.id}`}
      style={{ textDecoration: "none", color: colors.textMuted }}
    >
      Profile
    </Link>
  )}
</div>


</div>

      {/* COMMUNITY HEADER */}
      <div
        style={{
  padding: s.lg,
  borderRadius: theme.radius.lg,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  marginBottom: s.lg,
}}
      >
        <div
  style={{
    fontSize: t.h2.size,
    fontWeight: t.h2.weight,
    lineHeight: t.h2.lineHeight,
  }}
>
  {community.name}
</div>

<div
  style={{
    marginTop: 6,
    fontSize: t.small.size,
    lineHeight: t.small.lineHeight,
    color: colors.textMuted,
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  }}
>
  <span>
    {isMember ? "You’re a member here" : "You’re viewing as a guest"}
  </span>
  <span>·</span>
  <span>
    {community._count?.members ?? "—"} people gathering
  </span>
</div>

        {community.intention && (
          <div
            style={{
  marginTop: s.md,
  fontSize: t.body.size,
  lineHeight: t.body.lineHeight,
  color: colors.text,
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
    display: "flex",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  }}
>
  <span>{community.scope}</span>
  <span>·</span>
  <span>{community.rating}</span>

  {typeof community?._count?.members === "number" && (
    <>
      <span>·</span>
      <span>{community._count.members} members</span>
    </>
  )}
</div>

      </div>
      {!isMember && (
  <div style={{ marginBottom: 20 }}>
    <button
      disabled={community?.myInvitationStatus === "PENDING"}
      style={{
  ...secondaryButton(theme),
  background:
    community?.myInvitationStatus === "PENDING"
      ? colors.surfaceMuted
      : colors.surface,
  opacity:
    community?.myInvitationStatus === "PENDING" ? 0.6 : 1,
  cursor:
    community?.myInvitationStatus === "PENDING"
      ? "not-allowed"
      : "pointer",
}}
      onClick={async () => {
  try {
    await api(`/communities/${id}/invitations`, {
      method: "POST",
      body: JSON.stringify({}),
    })

    setCommunity((prev) => ({
      ...prev,
      myInvitationStatus: "PENDING",
    }))
  } catch (err) {
    alert(err?.error || "Failed to send join request")
  }
}}

    >
      {community?.myInvitationStatus === "PENDING"
        ? "Request sent"
        : "Request to join"}
    </button>
  </div>
)}



      {/* TABS */}
      <div
        style={{
  display: "flex",
  gap: s.sm,
  marginBottom: s.lg,
  borderBottom: `1px solid ${colors.border}`,
  paddingBottom: s.sm,
}}
      >
        {[
  "feed",
  ...(isMember ? ["chat", "members"] : []),
  ...(isAdmin ? ["settings"] : []),
  "wiki",
].map((tab) => (

          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
  padding: "8px 14px",
  borderRadius: theme.radius.pill,
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
  transition: "all 0.15s ease",
}}

          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div
  style={{
    padding: s.lg,
    borderRadius: theme.radius.lg,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    boxShadow: theme.shadow.sm,
    minHeight: 260,
  }}
>
        {activeTab === "settings" && myRole === "ADMIN" && (
  <div
  style={{
    maxWidth: 640,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  }}
>

    <div
  style={{
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 6,
  }}
>
  Community Settings
</div>

<div
  style={{
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 24,
    lineHeight: 1.6,
    maxWidth: 520,
  }}
>
  Manage members, intention and external label imports for this community.
</div>



<div
  style={{
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    padding: 20,
  }}
>
  
  {renderSectionHeader("invite", "Invite user")}

  {openSections.invite && (
  <div
    style={{
      marginTop: 16,
      display: "flex",
      gap: 12,
      alignItems: "center",
    }}
  >
      <input
        placeholder="Enter username"
        value={inviteUsername}
        onChange={(e) => setInviteUsername(e.target.value)}
        style={{
          flex: 1,
          padding: "10px 14px",
          borderRadius: theme.radius.md,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          fontSize: 14,
          outline: "none",
          color: colors.text,
        }}
      />

      <button
        disabled={!inviteUsername || inviting}
        onClick={async () => {
          try {
            setInviting(true)

            await api(`/communities/${id}/invitations`, {
              method: "POST",
              body: JSON.stringify({
                username: inviteUsername.trim(),
              }),
            })

            setInviteUsername("")
          } finally {
            setInviting(false)
          }
        }}
        style={{
          ...primaryButton(theme),
          opacity: !inviteUsername ? 0.6 : 1,
        }}
      >
        Invite
      </button>
    </div>
  )}
</div>

{/* Join requests */}
<div
  style={{
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    padding: 20,
    boxShadow: theme.shadow.sm,
  }}
>


  {renderSectionHeader("requests", "Join requests")}

{openSections.requests && (
  <div
    style={{
      marginTop: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}
  >

      {loadingRequests ? (
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          Loading join requests…
        </p>
      ) : joinRequests.length === 0 ? (
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          No pending requests
        </p>
      ) : (
        joinRequests.map((req) => (
          <div
            key={req.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: s.md,
              borderRadius: theme.radius.lg,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              boxShadow: theme.shadow.sm,
              marginBottom: 8,
              marginTop: s.md,
            }}
          >
            <span
              style={{
                fontSize: t.body.size,
                fontWeight: 500,
              }}
            >
              @{req.invitedUser.username}
            </span>

            <div style={{ display: "flex", gap: s.sm }}>
              <button
                onClick={async () => {
                  await api(
                    `/communities/invitations/${req.id}/accept`,
                    { method: "POST" }
                  )
                  setJoinRequests((prev) =>
                    prev.filter((x) => x.id !== req.id)
                  )
                }}
                style={{
                  ...primaryButton(theme),
                  padding: "6px 14px",
                }}
              >
                Approve
              </button>

              <button
                onClick={async () => {
                  await api(
                    `/communities/invitations/${req.id}/decline`,
                    { method: "POST" }
                  )
                  setJoinRequests((prev) =>
                    prev.filter((x) => x.id !== req.id)
                  )
                }}
                style={{
                  ...dangerButton(theme),
                  padding: "6px 14px",
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
        </div>
)}
</div>


{/* Intention */}
<div
  style={{
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    padding: 20,
    boxShadow: theme.shadow.sm,
  }}
>


  {renderSectionHeader("intention", "Community intention")}

{openSections.intention && (
  <div
    style={{
      marginTop: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}
  >
      {!editingIntention ? (
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.surfaceMuted,
            fontSize: 13,
            lineHeight: 1.6,
            color: colors.text,
            minHeight: 44,
            whiteSpace: "pre-wrap",
            cursor: "pointer",
          }}
          onClick={() => setEditingIntention(true)}
        >
          {community.intention || "Click to add intention"}
        </div>
      ) : (
        <>
          <textarea
            value={intentionDraft}
            onChange={(e) =>
              setIntentionDraft(e.target.value)
            }
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              resize: "none",
              fontSize: 14,
              marginBottom: 8,
              color: colors.text,
              lineHeight: 1.6,
              marginTop: s.md,
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                setEditingIntention(false)
                setIntentionDraft(
                  community.intention || ""
                )
              }}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.surfaceMuted,
                color: colors.textMuted,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              disabled={savingIntention}
              onClick={async () => {
                setSavingIntention(true)
                try {
                  await api(
                    `/communities/${id}/intention`,
                    {
                      method: "PATCH",
                      body: JSON.stringify({
                        intention: intentionDraft,
                      }),
                    }
                  )

                  setCommunity((prev) => ({
                    ...prev,
                    intention: intentionDraft,
                  }))
                  setEditingIntention(false)
                } finally {
                  setSavingIntention(false)
                }
              }}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 10,
                border: "none",
                background: colors.primary,
                fontWeight: 500,
                color: "#fff",
                cursor: "pointer",
                opacity: savingIntention ? 0.6 : 1,
              }}
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  )}
</div>

{/* Label imports */}
<div
  style={{
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    padding: 20,
    boxShadow: theme.shadow.sm,
  }}
>

  {renderSectionHeader("labels", "Label imports")}

{openSections.labels && (
  <div
    style={{
      marginTop: 20,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    <div
  style={{
    fontSize: 13,
    lineHeight: 1.7,
    color: colors.textMuted,
    marginBottom: 8,
    maxWidth: 500,
  }}
>
  Label imports define which external posts may enter this community.
  Internal community posts are never affected.
  Scope rules act as a ceiling, content cannot exceed the community's scope.
</div>
{community.rating === "SAFE" && (
  <div
    style={{
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
    padding: 10,
    borderRadius: 14,
    background: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
    lineHeight: 1.6,
  }}
  >
    This is a SAFE community.
  </div>
)}

      {community.labelImports?.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          No labels imported yet.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {community.labelImports.map((li) => {
  const isSafe = li.importMode === "SAFE_ONLY"
  const isNsfw = li.importMode === "NSFW_ONLY"
  const isBoth = li.importMode === "BOTH"

  return (
    <div
      key={li.categoryKey}
      style={{
  padding: 14,
  borderRadius: 16,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceMuted,
  display: "flex",
  flexDirection: "column",
  gap: 14,
}}
    >
      {/* Label Header */}
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <div
    style={{
      fontSize: 14,
      fontWeight: 500,
      color: colors.text,
    }}
  >
    #{li.categoryKey}
  </div>

  <div
    style={{
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: theme.radius.pill,
      border: `1px solid ${colors.border}`,
      background: colors.surfaceMuted,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    }}
  >
    {
  allCategories.find(
    (c) => c.key === li.categoryKey
  )?.scope || ""
}
  </div>
</div>

{/* Scope Toggle Controls */}
{myRole === "ADMIN" && (
  <div
    style={{
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    }}
  >
    {[
      { key: "global", label: "Global" },
      { key: "country", label: "Country" },
      { key: "local", label: "Local" },
    ].map((scopeOption) => {
      const active = li[scopeOption.key]

      return (
        <button
          key={scopeOption.key}
          onClick={async () => {
            await api(
              `/communities/${community.id}/label-imports`,
              {
                method: "POST",
                body: JSON.stringify({
                  categoryKey: li.categoryKey,
                  importMode: li.importMode,
                  global:
                    scopeOption.key === "global"
                      ? !li.global
                      : li.global,
                  country:
                    scopeOption.key === "country"
                      ? !li.country
                      : li.country,
                  local:
                    scopeOption.key === "local"
                      ? !li.local
                      : li.local,
                }),
              }
            )

            setCommunity((prev) => ({
              ...prev,
              labelImports: prev.labelImports.map((x) =>
                x.categoryKey === li.categoryKey
                  ? {
                      ...x,
                      [scopeOption.key]: !x[scopeOption.key],
                    }
                  : x
              ),
            }))
          }}
          style={{
            padding: "5px 12px",
            borderRadius: theme.radius.pill,
            fontSize: 11,
            fontWeight: 500,
            border: `1px solid ${
              active ? colors.primary : colors.border
            }`,
            background: active
              ? colors.primarySoft
              : colors.surface,
            color: active
              ? colors.primary
              : colors.textMuted,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {scopeOption.label}
        </button>
      )
    })}
  </div>
)}


      {/* Import Mode Segmented Control (NSFW only) */}
{myRole === "ADMIN" && community.rating === "NSFW" && (
  <div
    style={{
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    }}
  >
    {["SAFE_ONLY", "NSFW_ONLY", "BOTH"].map((mode) => {
      const active = li.importMode === mode

      const labelMap = {
        SAFE_ONLY: "Safe",
        NSFW_ONLY: "NSFW",
        BOTH: "Both",
      }

      return (
        <button
          key={mode}
          onClick={async () => {
            await api(
              `/communities/${community.id}/label-imports`,
              {
                method: "POST",
                body: JSON.stringify({
                  categoryKey: li.categoryKey,
                  importMode: mode,
                  global: li.global,
                  country: li.country,
                  local: li.local,
                }),
              }
            )

            setCommunity((prev) => ({
              ...prev,
              labelImports: prev.labelImports.map((x) =>
                x.categoryKey === li.categoryKey
                  ? { ...x, importMode: mode }
                  : x
              ),
            }))
          }}
          style={{
            padding: "6px 14px",
            borderRadius: theme.radius.pill,
            fontSize: 12,
            fontWeight: 500,
            border: `1px solid ${
              active ? colors.primary : colors.border
            }`,
            background: active
              ? colors.primarySoft
              : colors.surface,
            color: active
              ? colors.primary
              : colors.textMuted,
            cursor: "pointer",
          }}
        >
          {labelMap[mode]}
        </button>
      )
    })}
  </div>
)}
{/* Remove label */}
{myRole === "ADMIN" && (
  <div style={{ display: "flex", justifyContent: "flex-end" }}>
    <button
      onClick={async () => {
        await api(
          `/communities/${community.id}/label-imports/${li.categoryKey}`,
          { method: "DELETE" }
        )

        setCommunity((prev) => ({
          ...prev,
          labelImports: prev.labelImports.filter(
            (x) => x.categoryKey !== li.categoryKey
          ),
        }))
      }}
      style={{
        padding: "6px 12px",
        borderRadius: theme.radius.pill,
        fontSize: 11,
        border: "none",
        background: "transparent",
        color: "#dc2626",
        cursor: "pointer",
      }}
    >
      Remove
    </button>
  </div>
)}
{/* Read-only mode display for non-admin */}
{myRole !== "ADMIN" && (
  <div
    style={{
      fontSize: 12,
      fontWeight: 500,
      color: colors.textMuted,
    }}
  >
    Mode: {li.importMode.replace("_", " ").toLowerCase()}
  </div>
)}
    </div>
  )
})}

        </div>
      )}
    </div>
  )}
</div>


{myRole === "ADMIN" && (
  <div style={{ marginTop: 16 }}>
    <button
      onClick={() => setShowAddLabel(true)}
      style={{
        fontSize: 13,
        padding: "6px 12px",
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: colors.surfaceMuted,
color: colors.text,
cursor: "pointer",
fontWeight: 500,
      }}
    >
      + Import another label
    </button>
  </div>
)}
  </div>
)}


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
    paddingBottom: s.lg,
    marginBottom: s.lg,
    borderBottom: `1px solid ${colors.border}`,
  }}
>
      {isMember && (
  <div style={{ marginBottom: 12 }}>

    <PostComposer
      theme={theme}
      feedMode="COMMUNITY"
      activeCommunity={community}
      isMinor={me?.isMinor}
  nsfwEnabled={me?.nsfwEnabled}
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
)}

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
    height: "65vh",
    minHeight: 420,
    borderRadius: theme.radius.lg,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    boxShadow: theme.shadow.sm,
    overflow: "hidden",
  }}
>

    {/* Header */}
    <div
      style={{
        padding: "14px 18px",
        fontSize: t.h4.size,
fontWeight: t.h4.weight,
        borderBottom: `1px solid ${colors.border}`,
        color: colors.text,
        background: colors.surfaceMuted,
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
        padding: s.md,
background: colors.bg,
        boxSizing: "border-box",
      }}
    >
      {isMember ? (
  <CommunityChat communityId={id} isMember={isMember} />
) : (
  <p style={{ opacity: 0.6, fontSize: 13 }}>
    Join this community to participate in chat.
  </p>
)}
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
      display: "flex",
      gap: 16,
      alignItems: "center",
    }}
  >
    <Link
      to={`/profile/${m.id}`}
      style={{
        textDecoration: "none",
        color: colors.text,
        fontWeight: 500,
      }}
    >
      @{m.username}
    </Link>

    <span
  style={{
    color: colors.textMuted,
    fontSize: 11,
    textTransform: "capitalize",
  }}
>
  · {m.role.toLowerCase()}
</span>

  </div>
))
    )}
  </>
)}

{activeTab === "wiki" && (
  <div
    style={{
      maxWidth: 760,
      margin: "0 auto",
      padding: "20px 10px",
      display: "flex",
      flexDirection: "column",
      gap: 36,
      color: colors.text,
    }}
  >
    {/* Title */}
    <div
      style={{
        textAlign: "center",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: colors.textMuted,
          marginBottom: 12,
        }}
      >
        Community Manifesto
      </div>

      <div
        style={{
          fontSize: t.h2.size,
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        Structured belonging in a chaotic world
      </div>
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: colors.border,
        opacity: 0.6,
        margin: "10px 0 0 0",
      }}
    />

    {/* Section 1 */}
    <div style={{ lineHeight: 1.8, fontSize: 16 }}>
      <p>
        Communities exist so that people can gather with intention.
        Not around outrage. Not around algorithms.
        Around shared meaning.
      </p>

      <p>
        Every community is defined by labels chosen deliberately.
        What flows inside is not what performs,
        it is what belongs.
      </p>
    </div>

    {/* Section 2 */}
    <div
      style={{
        borderLeft: `3px solid ${colors.primary}`,
        paddingLeft: 18,
        lineHeight: 1.9,
        fontSize: 16,
      }}
    >
      <p>
        Traditional platforms push content into individuals
        using prediction systems.
      </p>

      <p>
        Communities reverse that direction.
        You choose the space.
        You choose the structure.
        The structure defines the flow.
      </p>

      <p>
        Whether there is one member or one million,
        information is never throttled by popularity.
        If it aligns with the shared labels,
        it moves.
      </p>
    </div>

    {/* Section 3 */}
    <div style={{ lineHeight: 1.8, fontSize: 16 }}>
      <p>
        A community can be a circle of family.
        A group of close friends.
        A local neighborhood.
        Or a global knowledge network.
      </p>

      <p>
        Add the people you trust.
        Follow the topics that matter.
        Stay updated within shared context
        instead of chaotic streams.
      </p>
    </div>

    {/* Section 4 */}
    <div
      style={{
        background: colors.surfaceMuted,
        padding: "20px 24px",
        borderRadius: theme.radius.lg,
        lineHeight: 1.9,
        fontSize: 16,
      }}
    >
      <p>
        Because communities are label-based and not engagement-based,
        they reduce the spread of misinformation,
        emotional manipulation,
        and AI-generated noise.
      </p>

      <p>
        Information moves through intention,
        not outrage.
      </p>
    </div>

    {/* Final Section */}
    <div
      style={{
        textAlign: "center",
        marginTop: 20,
        lineHeight: 1.9,
        fontSize: 17,
        fontWeight: 500,
      }}
    >
      <p>
        Have fun.
        Create.
        Explore.
        Support one another.
      </p>

      <p>
        Join local communities where people are genuinely
        trying to make a difference.
      </p>

      <p>
        Small groups shape neighborhoods.
        Neighborhoods shape nations.
        And nations shape the future of humanity.
      </p>
    </div>
  </div>
)}



{showAddLabel && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
backdropFilter: "blur(2px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
  width: 520,
  padding: 28,
  borderRadius: 24,
  boxShadow: theme.shadow.lg,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  display: "flex",
  flexDirection: "column",
  gap: 18,
}}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
  <div
    style={{
      fontSize: t.h3.size,
      fontWeight: 600,
      lineHeight: 1.2,
    }}
  >
    Import label
  </div>

  <div
    style={{
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 1.6,
      maxWidth: 420,
    }}
  >
    Select a label to allow external posts into this community.
  </div>
</div>


      <input
  placeholder="Search label (e.g. ai, fitness, music)"
  value={labelSearch}
  onChange={(e) => {
    setLabelSearch(e.target.value.toLowerCase())
    setSelectedCategory("")
  }}
  style={{
  width: "100%",
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
  color: colors.text,
}}

/>
<div
  style={{
    maxHeight: 220,
    overflowY: "auto",
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.surfaceMuted,
    padding: 8,
  }}
>
  
  {availableCategories
  .filter((c) => c.key.includes(labelSearch))
  .slice(0, 20)
  .map((c) => (
    <button
      key={c.key}
      onClick={() => setSelectedCategory(c.key)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: "10px 14px",
        borderRadius: 12,
        border: `1px solid ${
          selectedCategory === c.key
            ? colors.primary
            : colors.border
        }`,
        background:
  selectedCategory === c.key
    ? colors.primarySoft
    : "transparent",
        color:
          selectedCategory === c.key
            ? colors.primary
            : colors.text,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        transition: "all 0.15s ease",
      }}
    >
      <span>#{c.key}</span>

      <span
        style={{
          fontSize: 11,
          opacity: 0.6,
          textTransform: "uppercase",
        }}
      >
        {c.scope}
      </span>
    </button>
))}


  {labelSearch &&
  availableCategories.filter((c) =>
    c.key.includes(labelSearch)
  ).length === 0 && (
    <div style={{ fontSize: 12, opacity: 0.6 }}>
      No labels found
    </div>
)}

</div>
{selectedCategory && (
  <div
    style={{
      padding: 12,
      borderRadius: 14,
      border: `1px solid ${colors.primary}`,
      background: colors.primarySoft,
      fontSize: 14,
      fontWeight: 500,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>#{selectedCategory}</span>
    <span style={{ fontSize: 12, opacity: 0.7 }}>
      Ready to import
    </span>
  </div>
)}



      <div
        style={{
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 8,
}}
      >
        <button
          onClick={() => {
            setShowAddLabel(false)
            setSelectedCategory("")
          }}
          style={{
            fontSize: 12,
            background: colors.surface,
border: `1px solid ${colors.border}`,
borderRadius: 10,
padding: "6px 10px",
color: colors.textMuted,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>

        <button
          disabled={!selectedCategory || addingLabel}
          onClick={async () => {
            try {
              setAddingLabel(true)

              await api(`/communities/${community.id}/label-imports`, {
                method: "POST",
                body: JSON.stringify({
                  categoryKey: selectedCategory,
                  importMode:
                    community.rating === "SAFE"
                      ? "SAFE_ONLY"
                      : "BOTH",
                }),
              })

              // optimistic update
              setCommunity((prev) => ({
                ...prev,
                labelImports: [
                  ...prev.labelImports,
                  {
                    categoryKey: selectedCategory,
                    importMode:
                      community.rating === "SAFE"
                        ? "SAFE_ONLY"
                        : "BOTH",
                  },
                ],
              }))

              setShowAddLabel(false)
              setSelectedCategory("")
            } catch (err) {
              alert(err?.error || "Failed to import label")
            } finally {
              setAddingLabel(false)
            }
          }}
          style={{
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 14,
            border: "none",
            background: colors.primary,
            fontWeight: 500,
boxShadow: theme.shadow.xs,
            color: "#fff",
            cursor: "pointer",
            opacity:
              !selectedCategory || addingLabel ? 0.6 : 1,
          }}
        >
          Import
        </button>
        
      </div>
      
    </div>
    
  </div>
)}




      </div>
    </div>
  )
}
