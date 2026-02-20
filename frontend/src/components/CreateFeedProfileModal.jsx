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
  isMinor = false,
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



    const isEditMode = Boolean(editingProfile?.id)

const endpoint = isEditMode
  ? `/me/feed-profiles/${editingProfile.id}`
  : "/me/feed-profiles"

const method = isEditMode ? "PATCH" : "POST"


const profile = await api(endpoint, {
  method,
  body: JSON.stringify({
  name: name.trim(),
  allowNSFW: isMinor ? false : allowNSFW,
  labelPreferences,
}),
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
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(6px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  }}
>

      <div
  style={{
    width: "100%",
    maxWidth: 520,
    background: colors.surface,
    borderRadius: 22,
    padding: 32,
    border: `1px solid ${colors.border}`,
    boxShadow: theme.shadow.lg,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  }}
>

        <div>
  <div
    style={{
      fontSize: 20,
      fontWeight: 600,
      marginBottom: 6,
    }}
  >
    {editingProfile ? "Edit Feed Profile" : "Create Feed Profile"}
  </div>

  <div
    style={{
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 1.6,
    }}
  >
    Define what subjects shape your feed across global,
    country, and local scopes.
  </div>
</div>



        {/* Name */}
        <input
          placeholder="Profile name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
  width: "100%",
  padding: "12px 14px",
  borderRadius: theme.radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceMuted,
  color: colors.text,
  fontSize: 15,
  boxSizing: "border-box",
}}
        />

        {/* NSFW */}
{!isMinor && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
    }}
  >
    <input
      type="checkbox"
      checked={allowNSFW}
      onChange={(e) => setAllowNSFW(e.target.checked)}
    />
    <span>Allow NSFW content</span>
  </div>
)}


        {/* Scope selector */}
        <div style={{ marginTop: 16 }}>
  <div
    style={{
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 4,
    }}
  >
    Labels per scope
  </div>

  <div
    style={{
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 12,
      lineHeight: 1.5,
    }}
  >
    Choose which topics appear in each geographic layer of your feed.
  </div>


          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
  {["GLOBAL", "COUNTRY", "LOCAL"].map((s) => {
  const descriptions = {
    GLOBAL: "🌍 Worldwide posts",
    COUNTRY: "🏳️ Your country",
    LOCAL: "📍 Your region",
  }

  return (
    <button
      key={s}
      onClick={() => setScope(s)}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        cursor: "pointer",
        border: `1px solid ${
          scope === s ? colors.primary : colors.border
        }`,
        background:
          scope === s
            ? colors.primarySoft
            : colors.surface,
        color:
          scope === s
            ? colors.primary
            : colors.textMuted,
      }}
    >
      {descriptions[s]}
    </button>
  )
})}

</div>

{/* Label search */}
<input
  placeholder="Search labels…"
  value={labelSearch}
  onChange={(e) => setLabelSearch(e.target.value)}
  style={{
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: 13,
    marginTop: 12,
    boxSizing: "border-box",
  }}
/>

{/* Label grid */}
<div
  style={{
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginTop: 10,
  maxHeight: 120,
  overflowY: "auto",
  padding: 10,
  borderRadius: theme.radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceMuted,
  scrollbarWidth: "thin",
transition: "background 0.2s ease",
}}
>
  {categories
    .filter((c) =>
      c.key.includes(labelSearch.toLowerCase())
    )
    .slice(0, 20)
    .map((c) => {
      const selected = labels[scope].includes(c.key)

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
</div>

{/* Selected labels */}
{labels[scope].length > 0 && (
  <div
    style={{
      marginTop: 10,
      fontSize: 12,
      color: colors.textMuted,
    }}
  >
    Selected:{" "}
    <strong>
      {labels[scope].map((l) => `#${l}`).join(", ")}
    </strong>
  </div>
)}
{labels[scope].length > 0 && (
  <button
    onClick={() => {
      setLabels({
        GLOBAL: labels[scope],
        COUNTRY: labels[scope],
        LOCAL: labels[scope],
      })
    }}
    style={{
      marginTop: 8,
      fontSize: 12,
      background: "transparent",
      border: "none",
      color: colors.primary,
      cursor: "pointer",
    }}
  >
    Apply these labels to all scopes
  </button>
)}


          
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

