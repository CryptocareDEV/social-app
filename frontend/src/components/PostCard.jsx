import React, { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { api } from "../api/client"
import { fetchComments, createComment, fetchReplies } from "../api/comments"


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
    marginLeft: depth * 16,
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



const [commentsLoading, setCommentsLoading] = useState(false)
const [commentsError, setCommentsError] = useState(null)
const [commentBody, setCommentBody] = useState("")
const [collapsed, setCollapsed] = useState(false)
const [commentSubmitting, setCommentSubmitting] = useState(false)
const [commentSubmitError, setCommentSubmitError] = useState(null)
const [commentsCursor, setCommentsCursor] = useState(null)
const [hasMoreComments, setHasMoreComments] = useState(false)
const [loadingMore, setLoadingMore] = useState(false)
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
    if (post.reason?.autoLimited) return "MEDIUM"
    if (post.reason?.moderationOutcome === "REMOVED") return "HIGH"
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
    setCommentSubmitError("Failed to post comment")
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
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: theme.radius.pill,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.textMuted,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
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
  } catch {
    alert("Failed to reply")
  } finally {
    setReplySubmitting((prev) => ({ ...prev, [parentId]: false }))
  }
}

  return (

    <article
      style={{
        background: colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl + 4,
        border: `1px solid ${colors.border}`,
        boxShadow: theme.shadow.sm,
        transition: "box-shadow 0.15s ease",
      }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = theme.shadow.md
    e.currentTarget.style.transform = "translateY(-1px)"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = theme.shadow.sm
    e.currentTarget.style.transform = "translateY(0)"
  }}
>
      {/* HEADER */}
      <header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    fontSize: 13,
  }}
>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <Link
      to={`/profile/${post.user.id}`}
      style={{
  color: colors.text,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
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
    fontSize: 12,
    padding: "4px 8px",
    opacity: 0.6,
  }}
>
  {collapsed ? "▸ Expand" : "▾ Collapse"}
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
  borderStyle: "dashed",
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
      marginTop: theme.spacing.md,
      borderRadius: theme.radius.md,
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
      background: colors.surfaceMuted,
      position: "relative",
    }}
  >
    {post.type === "VIDEO" ? (
  <video
    src={imageSrc}
    controls
    preload="metadata"
    style={{
      width: "100%",
      display: "block",
      maxHeight: 520,
      background: colors.bg,
      borderRadius: theme.radius.md,
    }}
  />
) : (
  <img
    src={imageSrc}
    alt={post.type === "MEME" ? "Meme image" : "Post media"}
    loading="lazy"
    style={{
      width: "100%",
      display: "block",
      maxHeight: 520,
      objectFit: "contain",
      background: colors.bg,
    }}
  />
)}

    {/* 📝 MEME TEXT OVERLAY */}
    {post.type === "MEME" && post.memeMeta && (
  <>
    {/* TOP TEXT */}
    {post.memeMeta.topText && (
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "90%",
          padding: "6px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          textAlign: "center",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {post.memeMeta.topText}
      </div>
    )}

    {/* BOTTOM TEXT */}
    {post.memeMeta.bottomText && (
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "90%",
          padding: "6px 12px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          textAlign: "center",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {post.memeMeta.bottomText}
      </div>
    )}
  </>
)}


  </div>
)}





      {/* WHY AM I SEEING THIS */}
      {post.reason && (
        <div style={{ marginTop: 6 }}>
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
            {showReason ? "Hide why" : "Why am I seeing this?"}
          </button>

          {showReason && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                background: colors.surfaceMuted,
                borderRadius: theme.radius.sm,
                fontSize: 12,
                color: colors.textMuted,
                border: `1px solid ${colors.border}`,
              }}
            >
              {post.reason.matchedCategories?.length > 0 && (
                <div>
                  <strong>Matched labels:</strong>{" "}
                  {post.reason.matchedCategories.join(", ")}
                </div>
              )}

              {post.reason.scopeCeiling && (
                <div>
                  <strong>Community scope:</strong>{" "}
                  {post.reason.scopeCeiling}
                </div>
              )}

              {"likes" in post.reason && (
                <div>
                  <strong>Engagement:</strong>{" "}
                  {post.reason.likes} likes
                </div>
              )}
            </div>
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
          {post.categories.map((c) => (
            <span
              key={c.category.key}
              onClick={() => onLabelClick(c.category.key)}
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
              #{c.category.key}
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
          marginTop: theme.spacing.lg,
          display: "flex",
          gap: 12,
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
  }}
>
  💬{" "}
{showComments
  ? "Hide"
  : displayCommentCount > 0
  ? `${displayCommentCount} ${
      displayCommentCount === 1 ? "Comment" : "Comments"
    }`
  : "Comments"}

</button>


{/* MEME (image-only) */}
  {["IMAGE", "MEME"].includes(post.type) && imageSrc && (
  <button
    onClick={() => onMeme(post)}
    style={{
      fontSize: 12,
      padding: "6px 10px",
      borderRadius: theme.radius.pill,
      border: `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.textMuted,
      opacity: 0.75,
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
    🖼️ Meme this post
  </button>
)}


        
      </footer>
      {showComments && (
  <div
    style={{
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      background: colors.surfaceMuted,
      border: `1px solid ${colors.border}`,
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
    gap: 8,
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
      padding: "10px 12px",
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
