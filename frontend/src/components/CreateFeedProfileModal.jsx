import { useState } from "react"
import { useEffect } from "react"

import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"
import {
  primaryButton,
  secondaryButton,
} from "../ui/buttonStyles"

export default function CreateFeedProfileModal({
  theme,
  onClose,
  onCreated,
  editingProfile = null,
}) {
  const colors = getThemeColors(theme)

  const [name, setName] = useState("")
  const [allowNSFW, setAllowNSFW] = useState(false)

  const [labels, setLabels] = useState({
    GLOBAL: [],
    COUNTRY: [],
    LOCAL: [],
  })
  const [labelSearch, setLabelSearch] = useState("")


  const [categories, setCategories] = useState([])
  const [scope, setScope] = useState("GLOBAL")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  
useEffect(() => {
  if (!editingProfile) return

  setName(editingProfile.name)
  setAllowNSFW(
    editingProfile.preferences?.nsfw?.posts === "SHOW"
  )
  setLabels(editingProfile.preferences?.labels || {
    GLOBAL: [],
    COUNTRY: [],
    LOCAL: [],
  })
}, [editingProfile])


useEffect(() => {
  api("/categories")
    .then((cats) => {
      setCategories(cats || [])
    })
    .catch(() => {
      setCategories([])
    })
}, [])

  const hasAnyLabels = Object.values(labels).some(
  (arr) => arr.length > 0
)

  const createProfile = async () => {
  if (!name.trim()) {
    setError("Profile name is required")
    return
  }

  try {
    setSaving(true)
    setError("")


    // 1️⃣ Create profile
    console.log("🧪 LABEL STATE BEFORE SEND:", labels)

if (labels[scope].length > 5) {
  setError("Please select up to 5 labels only")
  return
}


const labelPreferences = Object.entries(labels)
  .filter(([, labelList]) => labelList.length > 0)
  .map(([labelScope, labelList]) => ({
    scope: labelScope,
    labels: labelList,
  }))
  console.log("🧪 LABEL PREFS SENT:", labelPreferences)



    const endpoint = editingProfile
  ? `/me/feed-profiles/${editingProfile.id}`
  : "/me/feed-profiles"

const method = editingProfile ? "PATCH" : "POST"

const profile = await api(endpoint, {
  method,
  body: JSON.stringify({
    name: name.trim(),
    allowNSFW,
    labelPreferences,
  }),
})


    // 2️⃣ ACTIVATE IT (THIS WAS MISSING)
    await api(`/me/feed-profiles/${profile.id}/activate`, {
      method: "POST",
    })

    onCreated?.(profile)
    onClose()
  } catch (err) {
    setError(err?.error || "Failed to create feed profile")
  } finally {
    setSaving(false)
  }
}




  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: colors.surface,
          borderRadius: 20,
          padding: 20,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h3 style={{ marginBottom: 12 }}>
          Create feed profile
        </h3>

        {/* Name */}
        <input
          placeholder="Profile name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            marginBottom: 12,
          }}
        />

        {/* NSFW */}
        <label style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={allowNSFW}
            onChange={(e) => setAllowNSFW(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Allow NSFW content
        </label>

        {/* Scope selector */}
        <div style={{ marginTop: 16 }}>
          <strong style={{ fontSize: 13 }}>
            Label preferences
          </strong>

          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {["GLOBAL", "COUNTRY", "LOCAL"].map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${
                    scope === s
                      ? colors.primary
                      : colors.border
                  }`,
                  background:
                    scope === s
                      ? colors.primarySoft
                      : colors.surface,
                  fontSize: 12,
                }}
              >
                {s}
              </button>
            ))}
            <div
  style={{
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 10,
    maxHeight: 120,
    overflowY: "auto",
    padding: 8,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.surfaceMuted,
  }}
>

<input
  placeholder="Search labels…"
  value={labelSearch}
  onChange={(e) => setLabelSearch(e.target.value)}
  style={{
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    fontSize: 13,
    marginTop: 10,
  }}
/>


  {categories
  .filter((c) =>
    c.key.includes(labelSearch.toLowerCase())
  )
  .slice(0, 20) // 👈 HARD LIMIT (important)
  .map((c) => {
      const selected = labels[scope].includes(c.key)
{labels[scope].length > 0 && (
  <div
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  }}
>

    Selected: {labels[scope].map((l) => `#${l}`).join(", ")}
  </div>
)}
      return (
        <button
          key={c.key}
          onClick={() =>
            setLabels((prev) => ({
              ...prev,
              [scope]: selected
                ? prev[scope].filter((x) => x !== c.key)
                : [...prev[scope], c.key],
            }))
          }
          style={{
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",

  background: selected
    ? colors.primarySoft
    : colors.surface,

  border: selected
    ? `1px solid ${colors.primary}`
    : `1px solid ${colors.border}`,

  color: selected
    ? colors.primary
    : colors.textMuted,
}}
        >
          #{c.key}
        </button>
      )
    })}
    {labels[scope].length > 0 && (
  <div
    style={{
      marginTop: 10,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 1.4,
    }}
  >
    Selected:{" "}
    <strong>
      {labels[scope].map((l) => `#${l}`).join(", ")}
    </strong>
  </div>
)}

</div>
          </div>

          
        </div>

        {error && (
          <p style={{ color: "red", marginTop: 8 }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            onClick={onClose}
            style={secondaryButton(theme)}
          >
            Cancel
          </button>
          <button
            onClick={createProfile}
            disabled={saving}
            style={primaryButton(theme)}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}

