import { getThemeColors } from "../../ui/theme"

export default function FeedProfilesCard({
  theme,
  profiles = [],
  activeProfileId,
  onChange,
  onEdit,
  onDelete,
}) {
  const colors = getThemeColors(theme)

  if (profiles.length === 0) return null

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 14,
        borderRadius: 16,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        🧠 Feed profiles
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId

          return (
            <div
  key={p.id}
  style={{
    padding: 12,
    borderRadius: 14,
    background: isActive
      ? colors.primarySoft
      : colors.surface,
    border: `1px solid ${
      isActive ? colors.primary : colors.border
    }`,
  }}
>
  <div style={{ fontSize: 14, fontWeight: 600 }}>
    {p.name} {isActive && "✓"}
  </div>

  <div
    style={{
      marginTop: 6,
      display: "flex",
      gap: 8,
    }}
  >
    {!isActive && (
      <button onClick={() => onChange(p.id)}>
        Activate
      </button>
    )}

    <button onClick={() => onEdit?.(p)}>
      Edit
    </button>

    <button onClick={() => onDelete?.(p)}>
      Delete
    </button>
  </div>
</div>
          )
        })}
      </div>
    </div>
  )
}
