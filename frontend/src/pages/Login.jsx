import { useState } from "react"
import { api } from "../api/client"
import { useLocation, useNavigate } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { theme as baseTheme } from "../ui/theme"
import { primaryButton } from "../ui/buttonStyles"

export default function Login({ onLogin }) {
  const theme = baseTheme
  const colors = getThemeColors(theme)
  const location = useLocation()
  const navigate = useNavigate()

  // 👇 message passed from signup redirect (e.g. user already exists)
  const infoMessage = location.state?.message

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      // backend contract: { token, user }
      if (!res?.token || !res?.user) {
        throw { error: "Invalid login response" }
      }

      localStorage.setItem("token", res.token)
      onLogin(res.user)

      // ✅ THIS WAS MISSING
      navigate("/", { replace: true })
    } catch (err) {
      setError(
        err?.error ||
        err?.message ||
        "Login failed"
      )
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: theme.radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: theme.typography.body.size,
    lineHeight: theme.typography.body.lineHeight,
    marginBottom: 12,
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          padding: 24,
          borderRadius: theme.radius.lg,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: theme.shadow.md,
        }}
      >
        <div
          style={{
            fontSize: theme.typography.h2.size,
            fontWeight: 600,
            marginBottom: 12,
            textAlign: "center",
            color: colors.text,
          }}
        >
          Welcome back
        </div>

        {/* 🟡 Informational message from signup */}
        {infoMessage && (
          <div
            style={{
              marginBottom: 12,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#ecfeff",
              color: "#0f172a",
              fontSize: 14,
              textAlign: "center",
              border: "1px solid #67e8f9",
            }}
          >
            {infoMessage}
          </div>
        )}

        {/* 🔴 Error message */}
        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fef2f2",
              color: colors.danger,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

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
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  )
}
