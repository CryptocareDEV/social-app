import { useState } from "react"
import { api } from "../api/client"
import { useNavigate, Link } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { theme as baseTheme } from "../ui/theme"
import { primaryButton } from "../ui/buttonStyles"

export default function Signup() {
  const theme = baseTheme
  const colors = getThemeColors(theme)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return

    setError("")
    setLoading(true)

    try {
      await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          password,
          dateOfBirth,
        }),
      })

      // ✅ Signup successful → go to login with message
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Your account has been created. Please log in to continue.",
        },
      })
    } catch (err) {
      const message = err?.error || err?.message || ""

      // 🟡 Existing user → same destination, calmer tone
      if (message.toLowerCase().includes("exist")) {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "An account already exists. Please log in.",
          },
        })
        return
      }

      // 🔴 Genuine failure
      setError(message || "Signup failed")
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
  }

  const featureTitleStyle = {
    fontSize: theme.typography.body.size,
    fontWeight: 600,
    letterSpacing: "0.01em",
    color: colors.text,
    marginBottom: 4,
  }

  const featureBodyStyle = {
    fontSize: theme.typography.body.size,
    lineHeight: theme.typography.body.lineHeight,
    color: colors.textMuted,
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 48,
        paddingBottom: 48,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 48,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          <div
            style={{
              fontSize: theme.typography.h1.size,
              fontWeight: 600,
              lineHeight: theme.typography.h1.lineHeight,
              marginBottom: 16,
              color: colors.text,
            }}
          >
            🌱 A calmer way to see the world
          </div>

          <p
            style={{
              fontSize: theme.typography.body.size,
              lineHeight: theme.typography.body.lineHeight,
              color: colors.textMuted,
              marginBottom: 32,
            }}
          >
            This is a place for intentional communities and thoughtful
            conversations, not engagement farming.
          </p>

          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <div style={featureTitleStyle}>
                Multiple perspectives
              </div>
              <div style={featureBodyStyle}>
                Create different feed profiles and experience the same
                world through different lenses.
              </div>
            </div>

            <div>
              <div style={featureTitleStyle}>
                Labels over algorithms
              </div>
              <div style={featureBodyStyle}>
                Choose topics and communities deliberately, no opaque
                ranking tricks.
              </div>
            </div>

            <div>
              <div style={featureTitleStyle}>
                Governed, not chaotic
              </div>
              <div style={featureBodyStyle}>
                Communities have rules, roles, and accountability built
                in.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div
          style={{
            background: colors.surface,
            padding: 24,
            borderRadius: theme.radius.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: theme.shadow.md,
          }}
        >
          <div
            style={{
              fontSize: theme.typography.h2.size,
              fontWeight: 600,
              marginBottom: 20,
              color: colors.text,
            }}
          >
            Create your account
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 10,
                borderRadius: 10,
                background: "#fef2f2",
                color: colors.danger,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{
                  ...inputStyle,
                  colorScheme: theme.mode,
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <div
            style={{
              marginTop: 16,
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: colors.primary }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
