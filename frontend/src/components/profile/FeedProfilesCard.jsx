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

  // Active profile should appear first
const sortedProfiles = [...profiles].sort((a, b) => {
  if (a.id === activeProfileId) return -1
  if (b.id === activeProfileId) return 1
  return 0
})


  if (profiles.length === 0) return null

  const renderScopeLabels = (scopeLabels = []) => {
    if (!scopeLabels.length) {
      return (
        <span style={{ opacity: 0.5 }}>
          All content
        </span>
      )
    }

    return scopeLabels.map((l) => `#${l}`).join(", ")
  }


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Quick Switcher */}
<div
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 24,
  }}
>
  {sortedProfiles.map((p) => {
    const isActive = p.id === activeProfileId

    return (
      <button
        key={p.id}
        onClick={() => onChange(p.id)}
        style={{
          padding: "6px 16px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 500,
          border: `1px solid ${
            isActive ? colors.primary : colors.border
          }`,
          background: isActive
  ? colors.primarySoft
  : colors.surfaceMuted,
          color: isActive
            ? colors.primary
            : colors.textMuted,
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 180,
        }}
        title={p.name}
      >
        {p.name}
      </button>
    )
  })}
</div>

      
      {sortedProfiles.map((p) => {
        const isActive = p.id === activeProfileId
        const isDefault = p.name === "Default"

        const labels = p.preferences?.labels || {
          GLOBAL: [],
          COUNTRY: [],
          LOCAL: [],
        }

        return (
          <div
            key={p.id}
            style={{
              padding: 20,
              borderRadius: 18,
              background: colors.surface,
              border: `1px solid ${
                isActive ? colors.primary : colors.border
              }`,
              boxShadow: isActive
                ? `0 0 0 1px ${colors.primarySoft}`
                : "none",
              transform: isActive ? "scale(1.01)" : "scale(1)",
              transition: "border 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {p.name}
              </div>

              {isActive && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: colors.primarySoft,
                    color: colors.primary,
                  }}
                >
                  Active
                </div>
              )}
            </div>

            {/* Scope Breakdown */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 16,
                color: colors.textMuted,
              }}
            >
              <div>
                🌍 Global:{" "}
                <strong style={{ color: colors.text }}>
                  {renderScopeLabels(labels.GLOBAL)}
                </strong>
              </div>

              <div>
                🏳️ Country:{" "}
                <strong style={{ color: colors.text }}>
                  {renderScopeLabels(labels.COUNTRY)}
                </strong>
              </div>

              <div>
                📍 Local:{" "}
                <strong style={{ color: colors.text }}>
                  {renderScopeLabels(labels.LOCAL)}
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {!isActive && (
                <button
                  onClick={() => onChange(p.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    background: colors.primary,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Activate
                </button>
              )}

              {!isDefault && (
                <button
                  onClick={() => onEdit?.(p)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.text,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              )}

              {!isDefault && (
  <button
    onClick={() =>
      onEdit?.({
        ...p,
        id: null, // force create mode
        name: `${p.name} Copy`,
      })
    }
    style={{
      padding: "6px 14px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 500,
      border: `1px solid ${colors.border}`,
      background: colors.surfaceMuted,
      color: colors.text,
      cursor: "pointer",
    }}
  >
    Duplicate
  </button>
)}


              {!isDefault && (
                <button
                  onClick={() => onDelete?.(p)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    background: "transparent",
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
