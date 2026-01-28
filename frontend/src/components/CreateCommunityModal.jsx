import { useState } from "react"
import { api } from "../api/client"

export default function CreateCommunityModal({ onClose, onCreated }) {
  const [name, setName] = useState("")
  const [intention, setIntention] = useState("")
  const [scope, setScope] = useState("GLOBAL")

  const [labels, setLabels] = useState([])
  const [labelInput, setLabelInput] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    console.log("SUBMIT CREATE COMMUNITY", {
    name,
    intention,
    scope,
    labels,
  })

    if (!name.trim()) {
      setError("Community name is required")
      return
    }

    if (labels.length === 0) {
      setError("Please add at least one label for the community")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("SENDING CREATE COMMUNITY REQUEST")
      const community = await api("/communities", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          intention: intention.trim(),
          scope,
          categories: labels, // ✅ THIS WAS MISSING
        }),
      })

      onCreated(community)
      onClose()
    } catch (err) {
      setError(err?.error || "Failed to create community")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          width: 420,
          borderRadius: 16,
        }}
      >
        <h3>Create community</h3>

        {error && (
          <p style={{ color: "red", fontSize: 13 }}>{error}</p>
        )}

        <input
          placeholder="Community name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Intention (why does this exist?)"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        {/* 🔑 COMMUNITY LABELS */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
  <input
    placeholder="Add a label"
    value={labelInput}
    onChange={(e) => setLabelInput(e.target.value)}
    style={{ flex: 1 }}
  />
  <button
    type="button"
    onClick={() => {
      if (!labelInput.trim()) return
      const key = labelInput.trim().toLowerCase()
      if (!labels.includes(key)) {
        setLabels((prev) => [...prev, key])
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
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {labels.map((l) => (
              <span
                key={l}
                style={{
                  padding: "4px 8px",
                  background: "#e0f2fe",
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setLabels((prev) => prev.filter((x) => x !== l))
                }
                title="Click to remove"
              >
                #{l}
              </span>
            ))}
          </div>
        )}

        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <option value="GLOBAL">🌍 Global</option>
          <option value="COUNTRY">🏳️ Country</option>
          <option value="LOCAL">📍 Local</option>
        </select>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose}>
  Cancel
</button>

<button
  type="button"
  onClick={submit}
  disabled={loading}
>
  {loading ? "Creating…" : "Create"}
</button>
        </div>
      </div>
    </div>
  )
}
