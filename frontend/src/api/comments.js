import { api } from "./client"

/**
 * Fetch top-level comments for a post
 */
export function fetchComments({ postId, cursor }) {
  const params = new URLSearchParams({ postId })
  if (cursor) params.set("cursor", cursor)

  return api(`/comments?${params.toString()}`)
}

/**
 * Fetch replies for a comment
 */
export function fetchReplies({ parentCommentId, cursor }) {
  const params = new URLSearchParams({ parentCommentId })
  if (cursor) params.set("cursor", cursor)

  return api(`/comments/replies?${params.toString()}`)
}

/**
 * Create a new comment or reply
 */
export function createComment({
  postId,
  body,
  mediaUrl,
  mediaType,
  parentCommentId = null,
}) {
  return api("/comments", {
    method: "POST",
    body: JSON.stringify({
      postId,
      body,
      mediaUrl,
      mediaType,
      parentCommentId,
    }),
  })
}
