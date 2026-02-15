import PostCard from "./PostCard"
import { getThemeColors } from "../ui/theme"

export default function Feed({
  posts,
  onLike,
  onMeme,
  likingIds,
  onLabelClick,
  theme,
  reportCooldownUntil,
  refreshUserState,
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
        gap: theme.spacing.lg,
      }}
    >
      {posts.map((post) => (
        <PostCard
  key={post.id}
  post={post}
  onLike={onLike}
  onMeme={onMeme}
  isLiking={likingIds?.has?.(post.id) ?? false}
  onLabelClick={onLabelClick}
  theme={theme}
  reportCooldownUntil={reportCooldownUntil}
  refreshUserState={refreshUserState}
/>
      ))}
    </div>
  )
}
