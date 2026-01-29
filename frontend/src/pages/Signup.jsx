import { useState } from "react"
import { api } from "../api/client"
import { useNavigate, Link } from "react-router-dom"
import { theme } from "../styles/theme"

export default function Signup({ onAuth }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })

      localStorage.setItem("token", res.token)
      onAuth(res.user)
      navigate("/")
    } catch (err) {
      setError(err?.error || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 12,
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    fontSize: 14,
    boxSizing: "border-box",
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "120px auto",
        padding: 24,
        borderRadius: theme.radius.lg,
        background: theme.colors.card,
        boxShadow: theme.shadow.md,
      }}
    >
      <h2
        style={{
          marginBottom: 16,
          textAlign: "center",
          color: theme.colors.text,
        }}
      >
        Create your account
      </h2>

      {error && (
        <p
          style={{
            marginBottom: 12,
            color: theme.colors.danger,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          required
        />

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
            width: "100%",
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            background: theme.colors.primary,
            color: "#fff",
            fontWeight: 500,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p
        style={{
          marginTop: 14,
          textAlign: "center",
          fontSize: 14,
        }}
      >
        Already have an account?{" "}
        <Link to="/login" style={{ color: theme.colors.primary }}>
          Login
        </Link>
      </p>
    </div>
  )
}
