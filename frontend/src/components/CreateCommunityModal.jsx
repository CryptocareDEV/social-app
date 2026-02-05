import { useState } from "react"
import { api } from "../api/client"
import { primaryButton, secondaryButton } from "../ui/buttonStyles"
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

  const submit = async () => {
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
          categories: labels, // ✅ CRITICAL FIX
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
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: c.surface,
          color: c.text,
          padding: 20,
          width: 420,
          borderRadius: 16,
          boxShadow: theme.shadow.md,
        }}
      >
        <h3 style={{ marginBottom: 12 }}>Create community</h3>

        {error && (
          <p style={{ color: c.danger, fontSize: 13 }}>{error}</p>
        )}

        <input
          placeholder="Community name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Why does this community exist?"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input
            placeholder="Add label"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {labels.map((l) => (
              <span
                key={l}
                onClick={() =>
                  setLabels((p) => p.filter((x) => x !== l))
                }
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: c.primarySoft,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                #{l}
              </span>
            ))}
          </div>
        )}

        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          style={{ width: "100%", marginTop: 10 }}
        >
          <option value="GLOBAL">🌍 Global</option>
          <option value="COUNTRY">🏳️ Country</option>
          <option value="LOCAL">📍 Local</option>
        </select>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button onClick={onClose} style={secondaryButton(theme)}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={primaryButton(theme)}
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}
