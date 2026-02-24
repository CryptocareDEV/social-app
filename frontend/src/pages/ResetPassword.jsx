import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { api } from "../api/client"
import { theme, getThemeColors } from "../ui/theme"
import { primaryButton } from "../ui/buttonStyles"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password) {
      setMessage("Enter a new password.")
      return
    }

    try {
      setLoading(true)
      setMessage("")

      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      setMessage("Password updated. Redirecting...")
      setTimeout(() => navigate("/login"), 1500)
    } catch (err) {
      setMessage(err?.error || "Reset failed")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <div>Invalid reset link.</div>
  }
const c = getThemeColors(theme)
  return (
  <div
    style={{
      background: c.bg,
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        background: c.surface,
        borderRadius: theme.radius.lg,
        border: `1px solid ${c.border}`,
        padding: theme.spacing.xl,
        boxShadow: theme.shadow.sm,
      }}
    >
      <div style={{ marginBottom: theme.spacing.lg }}>
        <h1
          style={{
            fontSize: theme.typography.h2.size,
            fontWeight: theme.typography.h2.weight,
            color: c.text,
            marginBottom: theme.spacing.sm,
          }}
        >
          Reset Password
        </h1>

        <p
          style={{
            fontSize: theme.typography.body.size,
            lineHeight: theme.typography.body.lineHeight,
            color: c.textMuted,
          }}
        >
          Enter your new password below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.md,
        }}
      >
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: theme.radius.md,
            border: `1px solid ${c.border}`,
            fontSize: theme.typography.body.size,
            fontFamily: theme.typography.fontFamily,
            background: c.surface,
            color: c.text,
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...primaryButton(theme),
            width: "100%",
          }}
        >
          {loading ? "Updating…" : "Reset Password"}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.small.size,
            color: c.textMuted,
          }}
        >
          {message}
        </div>
      )}
    </div>
  </div>
)
}
