import { useState, useEffect } from "react"

import { api } from "../api/client"
import {
  primaryButton,
  secondaryButton,
} from "../ui/buttonStyles"
import { getThemeColors } from "../ui/theme"

export default function CreateCommunityModal({
  onClose,
  onCreated,
  setCooldownInfo,
  theme,
}) {
  const c = getThemeColors(theme)

  const [name, setName] = useState("")
  const [intention, setIntention] = useState("")
  const [scope, setScope] = useState("GLOBAL")
  const [labels, setLabels] = useState([])
  const [labelInput, setLabelInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rating, setRating] = useState("SAFE")
  const [visibility, setVisibility] = useState("PUBLIC")
  const [isMinor, setIsMinor] = useState(false)
useEffect(() => {
  api("/users/me")
    .then((me) => {
      setIsMinor(me?.isMinor === true)
    })
    .catch(() => {})
}, [])


  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: theme.radius.md,
    border: `1px solid ${c.border}`,
    background: c.surfaceMuted,
    color: c.text,
    fontSize: theme.typography.body.size,
    lineHeight: theme.typography.body.lineHeight,
    outline: "none",
  }

  const submit = async () => {
    if (loading) return
    if (!name.trim()) return setError("Community name is required")
    if (labels.length === 0)
      return setError("Add at least one label")

    setLoading(true)
    setError("")

    try {
      const community = await api("/communities", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          intention: intention.trim(),
          scope,
          categories: labels,
          rating: isMinor ? "SAFE" : rating,
  visibility,
        }),
      })

      onCreated(community)
      onClose()
    } catch (err) {
      if (err?.cooldownUntil) {
        setCooldownInfo(err)
      } else {
        setError(err?.error || "Failed to create community")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        style={{
          background: c.surface,
          color: c.text,
          width: 460,
          maxWidth: "100%",
          borderRadius: theme.radius.lg,
          border: `1px solid ${c.border}`,
          boxShadow: theme.shadow.md,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.lg,
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              fontSize: theme.typography.h3.size,
              fontWeight: theme.typography.h3.weight,
              lineHeight: theme.typography.h3.lineHeight,
              marginBottom: 4,
            }}
          >
            Create a community
          </div>

          <div
            style={{
              fontSize: theme.typography.small.size,
              color: c.textMuted,
            }}
          >
            Define its intention and labels clearly.
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 10,
              borderRadius: theme.radius.md,
              background: c.primarySoft,
              color: c.danger,
              fontSize: theme.typography.small.size,
            }}
          >
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <input
            placeholder="Community name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Intention */}
        <div>
          <textarea
            placeholder="Why does this community exist?"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: 90,
              resize: "vertical",
            }}
          />
        </div>

        {/* Labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Add label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              style={secondaryButton(theme)}
              onClick={() => {
                const key = labelInput.trim().toLowerCase()
                if (key && !labels.includes(key)) {
                  setLabels((p) => [...p, key])
                }
                setLabelInput("")
              }}
            >
              Add
            </button>
          </div>

          {labels.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {labels.map((l) => (
                <span
                  key={l}
                  onClick={() =>
                    setLabels((p) => p.filter((x) => x !== l))
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: theme.radius.pill,
                    background: c.primarySoft,
                    color: c.primary,
                    fontSize: theme.typography.small.size,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  #{l}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scope */}
        <div>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="GLOBAL">🌍 Global</option>
            <option value="COUNTRY">🏳️ Country</option>
            <option value="LOCAL">📍 Local</option>
          </select>
        </div>

        {/* Rating */}
<div>
  <div
    style={{
      fontSize: theme.typography.small.size,
      color: c.textMuted,
      marginBottom: 6,
    }}
  >
    Community rating
  </div>

  <div style={{ display: "flex", gap: 8 }}>
    <button
      type="button"
      onClick={() => setRating("SAFE")}
      style={{
        padding: "6px 14px",
        borderRadius: theme.radius.pill,
        fontSize: 13,
        border:
          rating === "SAFE"
            ? `1px solid ${c.primary}`
            : `1px solid ${c.border}`,
        background:
          rating === "SAFE"
            ? c.primarySoft
            : c.surface,
        color:
          rating === "SAFE"
            ? c.primary
            : c.textMuted,
        cursor: "pointer",
      }}
    >
      SAFE
    </button>

    {!isMinor && (
      <button
        type="button"
        onClick={() => setRating("NSFW")}
        style={{
          padding: "6px 14px",
          borderRadius: theme.radius.pill,
          fontSize: 13,
          border:
            rating === "NSFW"
              ? `1px solid ${c.primary}`
              : `1px solid ${c.border}`,
          background:
            rating === "NSFW"
              ? c.primarySoft
              : c.surface,
          color:
            rating === "NSFW"
              ? c.primary
              : c.textMuted,
          cursor: "pointer",
        }}
      >
        NSFW
      </button>
    )}
  </div>
</div>


{/* Visibility */}
<div>
  <div
    style={{
      fontSize: theme.typography.small.size,
      color: c.textMuted,
      marginBottom: 6,
    }}
  >
    Privacy
  </div>

  <div style={{ display: "flex", gap: 8 }}>
    {["PUBLIC", "PRIVATE"].map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => setVisibility(v)}
        style={{
          padding: "6px 14px",
          borderRadius: theme.radius.pill,
          fontSize: 13,
          border:
            visibility === v
              ? `1px solid ${c.primary}`
              : `1px solid ${c.border}`,
          background:
            visibility === v
              ? c.primarySoft
              : c.surface,
          color:
            visibility === v
              ? c.primary
              : c.textMuted,
          cursor: "pointer",
        }}
      >
        {v}
      </button>
    ))}
  </div>
</div>


        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: theme.spacing.md,
          }}
        >
          <button
            onClick={onClose}
            style={secondaryButton(theme)}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              ...primaryButton(theme),
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            {loading ? "Creating…" : "Create community"}
          </button>
        </div>
      </div>
    </div>
  )
}
