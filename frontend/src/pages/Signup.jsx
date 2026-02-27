import { useState } from "react"
import { api } from "../api/client"
import { useNavigate, Link } from "react-router-dom"
import { getThemeColors } from "../ui/theme"
import { theme as baseTheme } from "../ui/theme"
import { primaryButton } from "../ui/buttonStyles"
import { GoogleLogin } from "@react-oauth/google"

export default function Signup() {
  const theme = baseTheme
  const colors = getThemeColors(theme)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const isMobile = window.innerWidth < 768

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
    padding: isMobile ? "14px 16px" : "12px 14px",
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
        paddingTop: isMobile ? 24 : 48,
paddingBottom: isMobile ? 24 : 48,
paddingLeft: isMobile ? 16 : 0,
paddingRight: isMobile ? 16 : 0,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          width: "100%",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
gap: isMobile ? 24 : 48,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        {!isMobile && (
<div
  style={{
    background: colors.surface,
    padding: 36,
    borderRadius: theme.radius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: theme.shadow.md,
    minHeight: 500,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}
>
  {/* Small Label */}
  
  <div
    style={{
      fontSize: 11,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginBottom: 20,
    }}
  >
    Platform Philosophy
  </div>

  {/* Headline Block with subtle gold accent */}
  <div
    style={{
      borderLeft: "3px solid #C6A75E",
      paddingLeft: 16,
      marginBottom: 30,
    }}
  >
    <div
      style={{
        fontSize: 26,
        fontWeight: 600,
        fontFamily: "Georgia, serif",
        color: colors.text,
      }}
    >
      This platform
    </div>

    <div
      style={{
        marginTop: 6,
        fontSize: 14,
        color: colors.textMuted,
      }}
    >
      is structured by intention, not influence.
    </div>
  </div>

  {/* Sections */}
  <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 24,
    fontSize: 15,
    lineHeight: 1.6,
  }}
>
  <div
    style={{
      fontSize: 24,
      fontWeight: 500,
      color: colors.text,
    }}
  >
    A calmer way to discuss.
  </div>

  <div style={{ color: colors.textMuted }}>
    Civic is built for thoughtful conversation.  
    No performance metrics. No artificial reach.
  </div>

  <div style={{ color: colors.textMuted }}>
    You choose what you follow.  
    You decide what matters.
  </div>

  <div
    style={{
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 8,
    }}
  >
    Structured. Transparent. Intentional.
  </div>
</div>

</div>
)}    





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
            Join Civic
          </div>
          <div style={{
  fontSize: 14,
  color: colors.textMuted,
  marginBottom: 20,
}}>
  Structured discussion. No manipulation. No noise.
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
              
              {/* Date of Birth */}
<div style={{ marginBottom: 16 }}>
  <div
    style={{
      fontSize: 13,
      marginBottom: 6,
      color: colors.textMuted,
    }}
  >
    Date of Birth
  </div>

  <input
    type="date"
    value={dateOfBirth}
    onChange={(e) => setDateOfBirth(e.target.value)}
    max={new Date().toISOString().split("T")[0]}
    min="1930-01-01"
    style={{
      ...inputStyle,
      height: 44,
      appearance: "none",
      WebkitAppearance: "none",
    }}
    required
  />
</div>


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
              {loading ? "Creating account…" : "Create account"}
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
