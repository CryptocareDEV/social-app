import React, { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { api } from "../api/client"
import { fetchComments, createComment, fetchReplies } from "../api/comments"
let activeVideo = null

function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 10) return "just now"
  if (diffSec < 60) return `${diffSec}s ago`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return "yesterday"

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function CommentNode({
  comment,
  depth,
  repliesMap,
  setRepliesMap, 
  activeReplyBox,
  setActiveReplyBox,
  replyBodies,
  setReplyBodies,
  handleReplySubmit,
  loadReplies,
  theme,
  colors,
  isMobile,
})
 {

  const maxDepth = 3
  const canReply = depth < maxDepth

  const replies = repliesMap[comment.id] || []

  return (
    <div
  style={{
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTop: `1px solid ${colors.border}`,
    marginLeft: isMobile ? depth * 10 : depth * 16,
    maxWidth: "100%",
    boxSizing: "border-box",
  }}
>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          marginBottom: 2,
        }}
      >
        <span style={{ fontWeight: 600, color: colors.text }}>
          @{comment.user.username}
        </span>

        <span style={{ color: colors.textMuted, fontSize: 11 }}>
          · {formatTimeAgo(comment.createdAt)}
        </span>
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: colors.text,
          marginTop: 2,
        }}
      >
        {comment.body}
      </div>

      {comment._count?.replies > 0 && (
  <button
    type="button"
    onClick={() => {
      if (repliesMap[comment.id]) {
        // Hide replies
        setRepliesMap((prev) => {
          const copy = { ...prev }
          delete copy[comment.id]
          return copy
        })
      } else {
        // Load replies
        loadReplies(comment.id)
      }
    }}
    style={{
      marginTop: 4,
      fontSize: 12,
      background: "none",
      border: "none",
      color: colors.textMuted,
      cursor: "pointer",
    }}
  >
    {repliesMap[comment.id]
      ? "Hide replies"
      : `View replies (${comment._count.replies})`}
  </button>
)}


{canReply && (
  <button
    type="button"
    onClick={() =>
      setActiveReplyBox(
        activeReplyBox === comment.id ? null : comment.id
      )
    }
    style={{
      marginTop: 4,
      marginLeft: 8,
      fontSize: 12,
      background: "none",
      border: "none",
      color: colors.textMuted,
      cursor: "pointer",
    }}
  >
    Reply
  </button>
)}


      {activeReplyBox === comment.id && (
        <div style={{ marginTop: 6 }}>
          <input
  type="text"
  value={replyBodies[comment.id] || ""}
  onClick={(e) => e.stopPropagation()}
  onChange={(e) =>
    setReplyBodies((prev) => ({
      ...prev,
      [comment.id]: e.target.value,
    }))
  }
  onKeyDown={(e) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      e.preventDefault()
      handleReplySubmit(comment.id)
    }
  }}
  placeholder="Write a reply…"
  style={{
  width: "100%",
  padding: "6px 10px",
  borderRadius: theme.radius.md,
  border: `1px solid ${colors.border}`,
  fontSize: 13,
  boxSizing: "border-box",
  maxWidth: "100%",
}}
/>

        </div>
      )}

      {replies.map((reply) => (
        <CommentNode
  key={reply.id}
  comment={reply}
  depth={depth + 1}
  repliesMap={repliesMap}
  setRepliesMap={setRepliesMap}  
  activeReplyBox={activeReplyBox}
  setActiveReplyBox={setActiveReplyBox}
  replyBodies={replyBodies}
  setReplyBodies={setReplyBodies}
  handleReplySubmit={handleReplySubmit}
  loadReplies={loadReplies}
  theme={theme}
  colors={colors}
  isMobile={isMobile}
/>
      ))}
    </div>
  )
}

function PostCard({
  post,
  onLike,
  onMeme,
  onLabelClick,
  theme,
  reportCooldownUntil,
  refreshUserState,
  isMobile,
}) {
  
  if (post.isRemoved) return null

  const [showReason, setShowReason] = useState(false)
  const [showComments, setShowComments] = useState(false)
const [comments, setComments] = useState([])
const [activeReplyBox, setActiveReplyBox] = useState(null)
const [replyBodies, setReplyBodies] = useState({})
const [replySubmitting, setReplySubmitting] = useState({})
const [repliesMap, setRepliesMap] = useState({})
const [replyCursors, setReplyCursors] = useState({})
const [hasMoreReplies, setHasMoreReplies] = useState({})
const reason = post.reason || null


const [commentsLoading, setCommentsLoading] = useState(false)
const [commentsError, setCommentsError] = useState(null)
const [commentBody, setCommentBody] = useState("")
const [collapsed, setCollapsed] = useState(false)
const [commentSubmitting, setCommentSubmitting] = useState(false)
const [commentSubmitError, setCommentSubmitError] = useState(null)
const [commentsCursor, setCommentsCursor] = useState(null)
const [hasMoreComments, setHasMoreComments] = useState(false)
const [loadingMore, setLoadingMore] = useState(false)
const videoRef = useRef(null)
const commentInputRef = useRef(null)
const commentsEndRef = useRef(null)
const [optimisticCountDelta, setOptimisticCountDelta] = useState(0)

  const [hasReported, setHasReported] = useState(false)


  const colors = getThemeColors(theme)
  const imageSrc = post.mediaUrl || null

  const severityCopy = {
    LOW: { tone: "#64748b", text: "Content may be low quality or off-topic" },
    MEDIUM: { tone: "#92400e", text: "Content visibility is limited due to reports" },
    HIGH: { tone: "#7c2d12", text: "Content removed for policy violations" },
    CRITICAL: { tone: "#7f1d1d", text: "Sensitive content restricted for safety" },
  }

  const severity = (() => {
    if (!post?.rating) return null
    if (post.rating === "NSFW") return "CRITICAL"
    if (reason?.autoLimited) return "MEDIUM"
    if (reason?.moderationOutcome === "REMOVED") return "HIGH"
    return null
  })()

  const baseCommentCount =
  typeof post._count?.comments === "number"
    ? post._count.comments
    : 0

  const displayCommentCount = baseCommentCount + optimisticCountDelta




  useEffect(() => {
  if (!showComments) {
    // reset comment UI state when closing
    setComments([])
    setCommentsCursor(null)
    setHasMoreComments(false)
    setCommentsLoading(false)
    setCommentsError(null)
    setCommentBody("")
    setCommentSubmitError(null)
    return
  }


  let cancelled = false
  setCommentsLoading(true)
  setCommentsError(null)

  fetchComments({ postId: post.id })
    .then((res) => {
      if (!cancelled) {
        setComments(res.items || [])
        setCommentsCursor(res.nextCursor)
        setHasMoreComments(!!res.nextCursor)
      }
    })
    .catch(() => {
      if (!cancelled) {
        setCommentsError("Failed to load comments")
      }
    })
    .finally(() => {
      if (!cancelled) {
        setCommentsLoading(false)
      }
    })

  return () => {
    cancelled = true
  }
}, [showComments, post.id])

  useEffect(() => {
  if (showComments && commentInputRef.current) {
    commentInputRef.current.focus()
  }
}, [showComments])




  const isOnReportCooldown =
    reportCooldownUntil && new Date(reportCooldownUntil) > new Date()

  const handleReport = async () => {
  if (isOnReportCooldown || hasReported) return

  try {
    await api("/reports", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, reason: "OTHER" }),
    })

    setHasReported(true)

    // 🔁 Always refresh user state after report
    await refreshUserState?.()

    alert("Report submitted. Thank you for helping keep the community safe.")
  } catch (err) {
    // If backend sets cooldown immediately
    if (err?.reportCooldownUntil) {
      await refreshUserState?.()
    }

    alert(err?.error || "Failed to report post")
  }
}

  
  const handleSubmitComment = async () => {
  if (!commentBody.trim() || commentSubmitting) return

  setCommentSubmitting(true)
  setCommentSubmitError(null)

  try {
    const newComment = await createComment({
      postId: post.id,
      body: commentBody.trim(),
    })

    // optimistic append (safe)
    setComments((prev) => [...prev, newComment])
    setOptimisticCountDelta((d) => d + 1)
    setCommentBody("")
    requestAnimationFrame(() => {
  commentsEndRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "end",
  })
  commentInputRef.current?.focus()
})

  } catch (err) {
  if (err?.cooldownUntil) {
    await refreshUserState?.()
    setCommentSubmitError("You’ve reached your comment limit. Please slow down.")
  } else if (err?.error) {
    setCommentSubmitError(err.error)
  } else {
    setCommentSubmitError("Failed to post comment")
  }
} finally {
    setCommentSubmitting(false)
  }
}
  
  const handleLoadMoreComments = async () => {
  if (!commentsCursor || loadingMore) return

  setLoadingMore(true)

  try {
    const res = await fetchComments({
      postId: post.id,
      cursor: commentsCursor,
    })

    setComments((prev) => [...prev, ...res.items])
    setCommentsCursor(res.nextCursor)
    setHasMoreComments(!!res.nextCursor)
  } finally {
    setLoadingMore(false)
  }
}



  const actionButtonStyle = {
  fontSize: 12,
  padding: isMobile ? "2px 0" : "6px 12px",
  minHeight: isMobile ? 24 : "auto",
  borderRadius: theme.radius.pill,

  borderWidth: isMobile ? 0 : 1,
  borderStyle: "solid",
  borderColor: colors.border,

  background: "transparent",
  color: colors.textMuted,
  cursor: "pointer",
  transition: "opacity 0.15s ease",
}

  const loadReplies = async (commentId) => {
  if (repliesMap[commentId]) return

  const res = await fetchReplies({ parentCommentId: commentId })

  setRepliesMap((prev) => ({
    ...prev,
    [commentId]: res.items || [],
  }))

  setReplyCursors((prev) => ({
    ...prev,
    [commentId]: res.nextCursor,
  }))

  setHasMoreReplies((prev) => ({
    ...prev,
    [commentId]: !!res.nextCursor,
  }))
}

const handleReplySubmit = async (parentId) => {
  const body = replyBodies[parentId]?.trim()
  if (!body || replySubmitting[parentId]) return

  setReplySubmitting((prev) => ({ ...prev, [parentId]: true }))

  try {
    const newReply = await createComment({
      postId: post.id,
      body,
      parentCommentId: parentId,
    })

    setRepliesMap((prev) => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), newReply],
    }))

    setReplyBodies((prev) => ({ ...prev, [parentId]: "" }))
  } catch (err) {
  if (err?.cooldownUntil) {
    await refreshUserState?.()
    alert("You’ve reached your reply limit. Please slow down.")
  } else {
    alert(err?.error || "Failed to reply")
  }
} finally {
    setReplySubmitting((prev) => ({ ...prev, [parentId]: false }))
  }
}

  return (

    <article
      id={`post-${post.id}`}
      style={{
  background: colors.surface,
  borderRadius: isMobile ? 0 : theme.radius.lg,
  padding: isMobile ? "8px 12px" : theme.spacing.xl + 4,
  boxShadow: isMobile ? "none" : theme.shadow.sm,

  borderTop: isMobile ? "none" : `1px solid ${colors.border}`,
  borderLeft: isMobile ? "none" : `1px solid ${colors.border}`,
  borderRight: isMobile ? "none" : `1px solid ${colors.border}`,
  borderBottom: `1px solid ${colors.border}`,
}}
>
      {/* HEADER */}
      <header
  style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: isMobile ? 2 : 12,
  fontSize: 13,
}}
>
        <div
  style={{
    display: "flex",
    gap: 8,
    alignItems: "center",
    minWidth: 0,
    flex: 1,
  }}
>
    <Link
      to={`/profile/${post.user.id}`}
      style={{
  color: colors.text,
  fontWeight: 600,
fontSize: 14,
textDecoration: "none",
whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis",
maxWidth: isMobile ? "60vw" : 220,
display: "block",
}}
    >
      @{post.user.username}
    </Link>

    <span
  style={{
    fontSize: 11,
    color: colors.textMuted,
    opacity: 0.70,
  }}
>
  {post.scope}
</span>
  </div>

<div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
<button
  onClick={() => setCollapsed((c) => !c)}
  style={{
    ...actionButtonStyle,
    fontSize: isMobile ? 13 : 12,
padding: isMobile ? "6px 10px" : "4px 8px",
    opacity: 0.6,
  }}
>
  {collapsed ? "▸" : "▾"}
</button>


  <span
  title={
  hasReported
    ? "You’ve already reported this post"
    : isOnReportCooldown
    ? "Reporting paused due to repeated inaccurate reports"
    : severity === "CRITICAL"
    ? "Use for serious safety concerns only"
    : "Report content that violates rules"
}

  
>
  <button
  onClick={handleReport}
  disabled={isOnReportCooldown}
  style={{
  ...actionButtonStyle,
  color: isOnReportCooldown ? "#94a3b8" : "#64748b",
  borderStyle: isMobile ? "none" : "dashed",
  opacity: 0.75,
  cursor: isOnReportCooldown ? "not-allowed" : "pointer",
}}
onMouseEnter={(e) => {
  if (!isOnReportCooldown) e.currentTarget.style.opacity = 1
}}
onMouseLeave={(e) => {
  e.currentTarget.style.opacity = 0.75
}}

>
  {isOnReportCooldown
    ? "Reporting paused"
    : severity === "CRITICAL"
    ? "Report (safety)"
    : "Report"}


</button>

</span>
</div>
</header>

      {/* CAPTION */}
      {!collapsed && post.caption && (
        <p
          style={{
  color: colors.text,
  lineHeight: theme.typography.body.lineHeight,
  fontSize: theme.typography.body.size,
  marginBottom: theme.spacing.md,
  whiteSpace: "pre-wrap",
}}
        >
          {post.caption}
        </p>
      )}

{/* IMAGE / MEME */}
{!collapsed && imageSrc && (
  <div
    style={{
      marginTop: isMobile ? 6 : theme.spacing.md,
borderRadius: isMobile ? 0 : theme.radius.md,
overflow: "hidden",
border: isMobile ? "none" : `1px solid ${colors.border}`,
background: isMobile ? "transparent" : colors.surfaceMuted,
position: "relative",
    }}
  >
    {post.type === "VIDEO" ? (
 <video
  ref={videoRef}
  src={imageSrc}
  controls
  preload="metadata"
  onPlay={() => {
    if (activeVideo && activeVideo !== videoRef.current) {
      activeVideo.pause()
    }
    activeVideo = videoRef.current
  }}
  style={{
    width: "100%",
    height: "auto",
    display: "block",
    maxHeight: isMobile ? "75vh" : 420,
    background: colors.bg,
    borderRadius: isMobile ? 0 : theme.radius.md,
    objectFit: "contain",
  }}
/>
) : (
  <img
    src={imageSrc}
    alt={post.type === "MEME" ? "Meme image" : "Post media"}
    loading="lazy"
    style={{
  width: "100%",
  height: "auto",
  display: "block",
  borderRadius: isMobile ? 0 : theme.radius.md,
}}
  />
)}



  </div>
)}

      {/* LABELS */}
      {post.categories?.length > 0 && (
  <div
    style={{
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 8,
    }}
  >
    {post.categories.map((key) => (
      <span
        key={key}
        onClick={() => onLabelClick(key)}
        style={{
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: theme.radius.pill,
          background:
            theme.mode === "dark"
              ? "rgba(59,130,246,0.15)"
              : "rgba(37,99,235,0.08)",
          color:
            theme.mode === "dark"
              ? "#bfdbfe"
              : "#1e3a8a",
          border: `1px solid ${colors.border}`,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        #{key}
      </span>
    ))}
  </div>
)}
{severity && severityCopy[severity] && (
  <div
    style={{
      marginTop: 10,
      padding: "8px 10px",
      borderRadius: 8,
      fontSize: 12,
      background: "#fff7ed",
      color: severityCopy[severity].tone,
      border: "1px solid #fed7aa",
    }}
  >
    ⚠️ {severityCopy[severity].text}
  </div>
)}

  {/* FOOTER */}
      <footer
        style={{
  marginTop: 10,
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  alignItems: isMobile ? "flex-start" : "center",
  gap: isMobile ? 6 : 0,
  justifyContent: "space-between",
}}
      >
        <div
  style={{
    display: "flex",
    gap: isMobile ? 18 : 12,
    alignItems: "center",
  }}
>
        <button
  disabled={false}
  onClick={() => onLike(post.id)}
  style={{
    ...actionButtonStyle,
    fontWeight: 500,
    color: post.likedByMe ? colors.primary : colors.textMuted,
    borderColor: post.likedByMe ? colors.primarySoft : colors.border,
    borderWidth: isMobile ? 0 : 1,
borderStyle: "solid",
borderColor: post.likedByMe
  ? colors.primarySoft
  : colors.border,
  background: isMobile ? "transparent" : "transparent",
  padding: isMobile ? "8px 8px" : actionButtonStyle.padding,
  }}
>
  {post.likedByMe ? "💙" : "🤍"} {post._count.likes}
</button>

<button
  type="button"
  onClick={() => setShowComments((v) => !v)}
  style={{
    ...actionButtonStyle,
    fontWeight: 500,
    borderWidth: isMobile ? 0 : 1,
borderStyle: "solid",
borderColor: post.likedByMe
  ? colors.primarySoft
  : colors.border,
  background: isMobile ? "transparent" : "transparent",
  padding: isMobile ? "6px 4px" : actionButtonStyle.padding,
  }}
>
  💬 {displayCommentCount}

</button>

{/* MEME (image-only) */}
  {["IMAGE", "MEME"].includes(post.type) && imageSrc && (
  <button
    onClick={() => onMeme(post)}
    style={{
      fontSize: isMobile ? 12 : 12,
padding: isMobile ? "4px 2px" : "6px 10px",
      borderRadius: theme.radius.pill,
      border: isMobile ? "none" : `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.textMuted,
      opacity: isMobile ? 0.7 : 0.75,
      cursor: "pointer",
      transition: "opacity 0.15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = 1
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = 0.75
    }}
  >
    🖼️ Meme It
  </button>
)}
</div>


{reason && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    }}
  >
    <button
      type="button"
      onClick={() => setShowReason((s) => !s)}
      style={{
        fontSize: 12,
        color: colors.textMuted,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      {showReason ? "Hide Why" : "Why?"}
    </button>

    {showReason && (
  <div
    style={{
      marginTop: 8,
      padding: "8px 10px",
      fontSize: 12,
      color: colors.textMuted,
      maxWidth: 280,
      lineHeight: 1.5,
      textAlign: "right",
      borderTop: `1px solid ${colors.border}`,
paddingTop: 6,
    }}
  >
        {/* 🔎 Feed profile explanation */}
{reason?.scope && (
  <div style={{ marginBottom: 6 }}>
    {reason.isDefaultProfile ? (
      <div>
        Viewing <strong>{reason.scope.toLowerCase()}</strong> feed ·
<strong>Default</strong> profile.
      </div>
    ) : (
      <div>
        Matched your <strong>{reason.profileName}</strong> profile ·
<strong>{reason.scope.toLowerCase()}</strong> scope.
      </div>
    )}
  </div>
)}

        {reason.type === "INTERNAL" && (
          <div>This post was created inside this community.</div>
        )}

        {reason.type === "EXTERNAL" && (
          <>
            <div>
              Imported via label: <strong>#{reason.label}</strong>
            </div>
            <div>Mode: {reason.importMode}</div>
          </>
        )}

        {reason.matchedCategories?.length > 0 && (
          <div>
            <span style={{ opacity: 0.8 }}>
  Labels: {reason.matchedCategories.join(", ")}
</span>
          </div>
        )}

        {reason.scopeCeiling && (
          <div>
            <strong>Community scope:</strong>{" "}
            {reason.scopeCeiling}
          </div>
        )}

        {"likes" in reason && (
          <div>
            <span style={{ opacity: 0.7 }}>
  {reason.likes} likes
</span>
          </div>
        )}
      </div>
    )}
  </div>
)}


 </footer>
      {showComments && (
  <div
    style={{
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      background: "transparent",
border: "none",
padding: isMobile ? 8 : theme.spacing.md,
    }}
  >
    {commentsLoading && (
      <div style={{ fontSize: 13, color: colors.textMuted }}>
        Loading responses…
      </div>
    )}

    {commentsError && (
      <div style={{ fontSize: 13, color: colors.danger }}>
        {commentsError}
      </div>
    )}

    {!commentsLoading && comments.length === 0 && (
      <div style={{ fontSize: 13, color: colors.textMuted }}>
        No responses yet.
      </div>
    )}
    {comments.map((comment) => (
  <CommentNode
  key={comment.id}
  comment={comment}
  depth={0}
  repliesMap={repliesMap}
  setRepliesMap={setRepliesMap} 
  activeReplyBox={activeReplyBox}
  setActiveReplyBox={setActiveReplyBox}
  replyBodies={replyBodies}
  setReplyBodies={setReplyBodies}
  handleReplySubmit={handleReplySubmit}
  loadReplies={loadReplies}
  theme={theme}
  colors={colors}
  isMobile={isMobile}
/>

))}


    

    


<div ref={commentsEndRef} />
{hasMoreComments && (
  <button
    onClick={handleLoadMoreComments}
    disabled={loadingMore}
    style={{
      marginTop: 8,
      fontSize: 12,
      background: "none",
      border: "none",
      color: colors.textMuted,
      cursor: "pointer",
    }}
  >
    {loadingMore ? "Loading…" : "Load more responses"}
  </button>
)}

    {/* ✍️ Comment composer */}
<div
  style={{
    marginTop: theme.spacing.md,
    display: "flex",
    gap: isMobile ? 10 : 8,
  }}
>
  <input
    ref={commentInputRef}
    value={commentBody}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => {
      setCommentBody(e.target.value)
      if (commentSubmitError) setCommentSubmitError(null)
    }}
    onKeyDown={(e) => {
      e.stopPropagation()
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmitComment()
      }
    }}
    placeholder="Add a thoughtful response…"
    style={{
      flex: 1,
      padding: isMobile ? "12px 14px" : "10px 12px",
      borderRadius: theme.radius.md,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      fontSize: 13,
      color: colors.text,
    }}
    disabled={commentSubmitting}
  />

  <button
    onClick={handleSubmitComment}
    disabled={commentSubmitting || !commentBody.trim()}
    style={{
      fontSize: 12,
      padding: "6px 12px",
      borderRadius: theme.radius.pill,
      border: `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.textMuted,
      cursor: commentSubmitting ? "not-allowed" : "pointer",
      opacity: commentSubmitting ? 0.6 : 1,
    }}
  >
    {commentSubmitting ? "Posting…" : "Post"}
  </button>
</div>


{commentSubmitError && (
  <div
    style={{
      marginTop: 6,
      fontSize: 12,
      color: colors.danger,
    }}
  >
    {commentSubmitError}
  </div>
)}

  </div>
)}

    </article>
  )
}
export default React.memo(PostCard)
