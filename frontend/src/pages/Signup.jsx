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
      gap: 28,
      fontSize: 15,
      lineHeight: 1.6,
    }}
  >
    {/* WHAT YOU CAN DO */}
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 12,
          color: colors.primary,
        }}
      >
        What you can do
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          "Choose what you see through labels",
          "Build real communities with shared intention",
          "Stay aligned with topics that matter",
          "Experience equal information flow",
        ].map((text, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              transition: "transform 0.15s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateX(4px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateX(0px)")
            }
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                marginTop: 6,
                background: colors.primary,
                flexShrink: 0,
              }}
            />
            <div>{text}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: colors.border,
        opacity: 0.6,
      }}
    />

    {/* WHAT YOU WON'T FIND */}
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 12,
          color: colors.textMuted,
        }}
      >
        What you won’t find
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          "Follower counts or influence hierarchies",
          "Engagement manipulation",
          "Hidden ranking systems",
          "Advertisements shaping perception",
        ].map((text, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              transition: "transform 0.15s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateX(4px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateX(0px)")
            }
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                marginTop: 6,
                background: colors.textMuted,
                flexShrink: 0,
              }}
            />
            <div>{text}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Closing line */}
    <div
      style={{
        marginTop: 10,
        fontSize: 14,
        fontStyle: "italic",
        color: colors.textMuted,
      }}
    >
      Information is structured & unrestricted.
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
