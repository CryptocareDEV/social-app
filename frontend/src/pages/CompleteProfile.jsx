import { useState } from "react"
import { api } from "../api/client"
import { useNavigate } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { theme as baseTheme } from "../ui/theme"
import { primaryButton } from "../ui/buttonStyles"

export default function CompleteProfile() {
  const theme = baseTheme
  const colors = getThemeColors(theme)
  const navigate = useNavigate()

  const [dateOfBirth, setDateOfBirth] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isMobile = window.innerWidth < 768

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return

    setError("")
    setLoading(true)

    if (!dateOfBirth) {
      setError("Please select your date of birth")
      setLoading(false)
      return
    }

    try {
      await api("/auth/complete-profile", {
        method: "PATCH",
        body: JSON.stringify({ dateOfBirth }),
      })

      navigate("/", { replace: true })
    } catch (err) {
      setError(err?.error || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: isMobile ? "14px 16px" : "12px 14px",
    borderRadius: theme.radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: theme.typography.body.size,
    lineHeight: theme.typography.body.lineHeight,
    height: 44,
    appearance: "none",
    WebkitAppearance: "none",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 20 : 40,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: colors.surface,
          padding: isMobile ? 20 : 32,
          borderRadius: theme.radius.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: theme.shadow.md,
        }}
      >
        <div
          style={{
            fontSize: theme.typography.h2.size,
            fontWeight: 600,
            marginBottom: 6,
            color: colors.text,
            textAlign: "center",
          }}
        >
          Complete your profile
        </div>

        <div
          style={{
            fontSize: 14,
            color: colors.textMuted,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          We require your date of birth to enforce safety standards.
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: theme.radius.md,
              background: colors.dangerSoft || "#fef2f2",
              color: colors.danger,
              fontSize: 14,
              border: `1px solid ${colors.danger}30`,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 13,
                marginBottom: 6,
                display: "block",
                color: colors.textMuted,
              }}
            >
              Date of Birth
            </label>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min="1930-01-01"
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryButton(theme),
              width: "100%",
              justifyContent: "center",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}