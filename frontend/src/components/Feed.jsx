import PostCard from "./PostCard"
import { getThemeColors } from "../ui/theme"

export default function Feed({
  posts,
  onLike,
  onMeme,
  likingIds,
  onLabelClick,
  theme,
}) {
  const colors = getThemeColors(theme)

  // ⏳ Loading state
  if (!Array.isArray(posts)) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 0",
          color: colors.textMuted,
          fontSize: 14,
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
          padding: "40px 0",
          color: colors.textMuted,
          fontSize: 14,
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
        gap: 12, // consistent vertical rhythm
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
        />
      ))}
    </div>
  )
}
