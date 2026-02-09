import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"
import Feed from "../components/Feed"
import PostComposer from "../components/PostComposer"
import CommunityChat from "../components/CommunityChat"
import { Link } from "react-router-dom"


export default function CommunityPage({ theme }) {
  const { id } = useParams()
  const colors = getThemeColors(theme)

  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [joinRequests, setJoinRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)


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

  const [editingIntention, setEditingIntention] = useState(false)
  const [intentionDraft, setIntentionDraft] = useState("")
  const [savingIntention, setSavingIntention] = useState(false)
  const isMember = !!myRole
  const isAdmin = myRole === "ADMIN"


  

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
      setMyRole(data.myRole || null)
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
  }, [activeTab, id])

useEffect(() => {
  if (!showAddLabel || !community) return

  api("/categories")
    .then((cats) => {
      const importedKeys = new Set(
        (community.labelImports || []).map((l) => l.categoryKey)
      )

      setAvailableCategories(
        (cats || []).filter((c) => !importedKeys.has(c.key))
      )
    })
    .catch(() => {
      setAvailableCategories([])
    })
}, [showAddLabel, community])

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
        maxWidth: 880,
        margin: "0 auto",
        padding: 24,
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
    display: "flex",
    gap: 6,
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
        padding: "10px 16px",
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background:
          community?.myInvitationStatus === "PENDING"
            ? colors.surfaceMuted
            : colors.surface,
        cursor:
          community?.myInvitationStatus === "PENDING"
            ? "not-allowed"
            : "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: colors.text,
        opacity:
          community?.myInvitationStatus === "PENDING" ? 0.6 : 1,
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
          gap: 16,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: 6,
          fontSize: 13,
        }}
      >
        {[
  "feed",
  ...(isMember ? ["chat", "members"] : []),
  ...(isAdmin ? ["settings"] : []),
].map((tab) => (
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
        {activeTab === "settings" && myRole === "ADMIN" && (
  <div style={{ maxWidth: 520 }}>
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 12,
      }}
    >
      Community settings
    </div>

{/* Join requests */}
<div style={{ marginTop: 20 }}>
  <div
    style={{
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 8,
    }}
  >
    Join requests
  </div>

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
          padding: "8px 10px",
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13 }}>
          @{req.invitedUser.username}
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              await api(`/communities/invitations/${req.id}/accept`, {
                method: "POST",
              })
              setJoinRequests((prev) =>
                prev.filter((x) => x.id !== req.id)
              )
            }}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 8,
              border: "none",
              background: colors.primary,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Approve
          </button>

          <button
            onClick={async () => {
              await api(`/communities/invitations/${req.id}/decline`, {
                method: "POST",
              })
              setJoinRequests((prev) =>
                prev.filter((x) => x.id !== req.id)
              )
            }}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      </div>
    ))
  )}
</div>



    {/* Intention */}
<div style={{ marginBottom: 16 }}>
  <label
    style={{
      fontSize: 12,
      color: colors.textMuted,
      display: "block",
      marginBottom: 6,
    }}
  >
    Community intention
  </label>

  {!editingIntention ? (
    <div
      style={{
        padding: 10,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: colors.surfaceMuted,
        fontSize: 14,
        lineHeight: 1.5,
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
        onChange={(e) => setIntentionDraft(e.target.value)}
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
            setIntentionDraft(community.intention || "")
          }}
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
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
              await api(`/communities/${id}/intention`, {
  method: "PATCH",
  body: JSON.stringify({
    intention: intentionDraft,
  }),
})


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


{/* Label imports (read-only) */}
<div style={{ marginTop: 20 }}>
  <div
    style={{
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 8,
    }}
  >
    Label imports
  </div>

  {community.labelImports?.length === 0 ? (
    <p style={{ fontSize: 13, color: colors.textMuted }}>
      No labels imported yet.
    </p>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {community.labelImports.map((li) => (
        <div
          key={li.categoryKey}
          style={{
            fontSize: 13,
            padding: "6px 10px",
            borderRadius: 10,
            background: colors.surfaceMuted,
            border: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>#{li.categoryKey}</span>
          {myRole === "ADMIN" ? (
          <select
  value={li.importMode}
  onChange={async (e) => {
    const newMode = e.target.value

    try {
      await api(`/communities/${community.id}/label-imports`, {
        method: "POST",
        body: JSON.stringify({
          categoryKey: li.categoryKey,
          importMode: newMode,
        }),
      })

      // update local state (no refetch)
      setCommunity((prev) => ({
        ...prev,
        labelImports: prev.labelImports.map((x) =>
          x.categoryKey === li.categoryKey
            ? { ...x, importMode: newMode }
            : x
        ),
      }))
    } catch (err) {
      alert(err?.error || "Failed to update label import")
    }
  }}
  style={{
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
  }}
>
  <option value="SAFE_ONLY">safe only</option>
  <option value="NSFW_ONLY">nsfw only</option>
  <option value="BOTH">both</option>
</select>
) : (
  <span style={{ color: colors.textMuted }}>
    {li.importMode.toLowerCase()}
  </span>
)}
        </div>
      ))}
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
        background: colors.surface,
        cursor: "pointer",
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
        paddingBottom: 16,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {isMember && (
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
      {isMember ? (
  <CommunityChat communityId={id} isMember />
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
      gap: 6,
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

    <span style={{ color: colors.textMuted }}>
      · {m.role.toLowerCase()}
    </span>
  </div>
))
    )}
  </>
)}

{showAddLabel && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: 420,
        padding: 20,
        borderRadius: 16,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h4 style={{ marginBottom: 12 }}>
        Import label into community
      </h4>

      <input
  placeholder="Search label (e.g. ai, fitness, music)"
  value={labelSearch}
  onChange={(e) => {
    setLabelSearch(e.target.value.toLowerCase())
    setSelectedCategory("")
  }}
  style={{
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  marginBottom: 10,
  fontSize: 13,
  boxSizing: "border-box",   // ✅ fixes overflow
}}

/>
<div
  style={{
    maxHeight: 160,
    overflowY: "auto",
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.surfaceMuted,
    padding: 8,
  }}
>
  
  {availableCategories
    .filter((c) =>
      c.key.includes(labelSearch)
    )
    .slice(0, 20)
    .map((c) => (
      <button
        key={c.key}
        onClick={() => setSelectedCategory(c.key)}
        style={{
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background:
    selectedCategory === c.key
      ? colors.primarySoft
      : colors.surface,
  color:
    selectedCategory === c.key
      ? colors.primary
      : colors.text,
  cursor: "pointer",
  fontSize: 13,
  marginBottom: 6,
}}
      >
        #{c.key}
      </button>
    ))}

  {labelSearch && availableCategories.length === 0 && (
    <div style={{ fontSize: 12, opacity: 0.6 }}>
      No labels found
    </div>
  )}
</div>
{selectedCategory && (
  <div
    style={{
      marginTop: 10,
      fontSize: 12,
      color: colors.textMuted,
    }}
  >
    Selected: <strong>#{selectedCategory}</strong>
  </div>
)}


      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          onClick={() => {
            setShowAddLabel(false)
            setSelectedCategory("")
          }}
          style={{
            fontSize: 12,
            background: "transparent",
            border: "none",
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
            padding: "6px 12px",
            borderRadius: 10,
            border: "none",
            background: colors.primary,
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
