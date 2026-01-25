import { useState } from "react"
import { api } from "../api/client"

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem("token", res.token)
      onLogin(res.user)
    } catch (err) {
      setError(err.error || "Login failed")
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: "80px auto" }}>
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={submit}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />

        <button style={{ width: "100%" }}>Login</button>
      </form>
    </div>
  )
}

