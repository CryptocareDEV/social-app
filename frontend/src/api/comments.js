import { api } from "./client"

/**
 * Fetch comments for a post
 */
export function fetchComments({ postId, cursor }) {
  const params = new URLSearchParams({ postId })
  if (cursor) params.set("cursor", cursor)

  return api(`/comments?${params.toString()}`)
}

/**
 * Create a new comment
 */
export function createComment({ postId, body, mediaUrl, mediaType }) {
  return api("/comments", {
    method: "POST",
    body: JSON.stringify({
      postId,
      body,
      mediaUrl,
      mediaType,
    }),
  })
}

