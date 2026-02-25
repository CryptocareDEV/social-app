import React from "react"
import PostCard from "./PostCard"
import { getThemeColors } from "../ui/theme"

function Feed({
  posts,
  onLike,
  onMeme,
  onLabelClick,
  theme,
  reportCooldownUntil,
  refreshUserState,
  isMobile,
}) {

  const colors = getThemeColors(theme)

  // ⏳ Loading state
  if (!Array.isArray(posts)) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: `${theme.spacing.xxl}px 0`,
          color: colors.textMuted,
          fontSize: theme.typography.body.size,
          lineHeight: theme.typography.body.lineHeight,
        }}
      >
        Loading feed…
      </div>
    )
  }

  // 🌱 Empty state
  if (posts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: `${theme.spacing.xxl}px 0`,
          color: colors.textMuted,
          fontSize: theme.typography.body.size,
          lineHeight: theme.typography.body.lineHeight,
        }}
      >
        Nothing here yet.
      </div>
    )
  }

  // 📰 Feed
  return (
    <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? 4 : theme.spacing.lg,
  }}
>
      {posts.map((post) => (
        <PostCard
  key={post.id}
  post={post}
  onLike={onLike}
  onMeme={onMeme}
  onLabelClick={onLabelClick}
  theme={theme}
  reportCooldownUntil={reportCooldownUntil}
  refreshUserState={refreshUserState}
/>

      ))}
    </div>
  )
}
export default React.memo(Feed)
