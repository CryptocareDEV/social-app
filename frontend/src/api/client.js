// frontend/src/api/client.js

const API_URL = "http://localhost:4000/api/v1"

export const api = async (path, options = {}) => {
  const token = localStorage.getItem("token")

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  // 🔐 Central auth handling
  if (res.status === 401) {
    localStorage.removeItem("token")
    throw { error: "Unauthorized" }
  }

  // ⛔ Other errors
  if (!res.ok) {
    let error
    try {
      error = await res.json()
    } catch {
      error = { error: "Request failed" }
    }
    throw error
  }

  // ✅ Safe JSON handling
  if (res.status === 204) return null

  const contentType = res.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return await res.json()
  }

  return null
}
