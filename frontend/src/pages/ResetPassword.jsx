import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { api } from "../api/client"

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

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>Reset Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
          }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>

      {message && (
        <div style={{ marginTop: 16 }}>
          {message}
        </div>
      )}
    </div>
  )
}
