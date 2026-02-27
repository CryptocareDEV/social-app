import { useState } from "react"
import { api } from "../api/client"
import { useLocation, useNavigate } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { theme as baseTheme } from "../ui/theme"
import { primaryButton } from "../ui/buttonStyles"
import { GoogleLogin } from "@react-oauth/google"

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
  padding: "14px 16px",
  borderRadius: theme.radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.text,
  fontSize: theme.typography.body.size,
  lineHeight: theme.typography.body.lineHeight,
  marginBottom: 14,
  outline: "none",
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
          maxWidth: 420,
          width: "100%",
          padding: 32,
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
    marginBottom: 6,
    textAlign: "center",
    color: colors.text,
  }}
>
  Welcome back
</div>

<div style={{ marginBottom: 16 }}>
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      try {
        setError("")
        setLoading(true)

        const res = await api("/auth/google", {
          method: "POST",
          body: JSON.stringify({
            idToken: credentialResponse.credential,
          }),
        })

        localStorage.setItem("token", res.token)
        onLogin(res.user)

        if (res.user.needsDobCompletion) {
          navigate("/complete-profile", { replace: true })
        } else {
          navigate("/", { replace: true })
        }
      } catch (err) {
        setError(err?.error || "Google login failed")
      } finally {
        setLoading(false)
      }
    }}
    onError={() => {
      setError("Google login failed")
    }}
    useOneTap={false}
  />
</div>

<div
  style={{
    textAlign: "center",
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  }}
>
  — or —
</div>

<div
  style={{
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 18,
    textAlign: "center",
  }}
>
  Sign in to continue your conversations.
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
      marginBottom: 14,
      padding: "12px 14px",
      borderRadius: theme.radius.md,
      background: colors.danger + "10",
      color: colors.danger,
      fontSize: 14,
      textAlign: "center",
      border: `1px solid ${colors.danger}40`,
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

          <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 18,
  }}
>
  <button
    type="button"
    onClick={() => navigate("/forgot-password")}
    style={{
      background: "transparent",
      border: "none",
      padding: 0,
      fontSize: 13,
      color: colors.primary,
      cursor: "pointer",
    }}
  >
    Forgot password?
  </button>
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
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
        <div
  style={{
    marginTop: 20,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  }}
>
  New here?{" "}
  <span
    onClick={() => navigate("/signup")}
    style={{
      color: colors.primary,
      cursor: "pointer",
      fontWeight: 500,
    }}
  >
    Create an account
  </span>
</div>
      </div>
    </div>
  )
}
