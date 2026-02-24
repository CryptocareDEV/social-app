import { useState } from "react"
import { api } from "../api/client"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setMessage("Please enter your email.")
      return
    }

    try {
      setLoading(true)
      setMessage("")

      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })

      setMessage("If an account exists, a reset link has been sent.")
    } catch (err) {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>Forgot Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
          }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
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
