import { useState } from "react"
import { getThemeColors } from "../ui/theme"

export default function FeedProfileSwitcher({ theme }) {
  const colors = getThemeColors(theme)

  // 🔮 MOCK DATA (temporary)
  const [profiles, setProfiles] = useState([
    { id: "default", name: "Default", isActive: true },
    { id: "serious", name: "Serious", isActive: false },
    { id: "chaos", name: "Chaos", isActive: false },
  ])

  const activate = (id) => {
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      }))
    )
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => activate(p.id)}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${
              p.isActive ? colors.primary : colors.border
            }`,
            background: p.isActive
              ? colors.primarySoft
              : colors.surface,
            color: p.isActive
              ? colors.primary
              : colors.textMuted,
            cursor: "pointer",
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}

