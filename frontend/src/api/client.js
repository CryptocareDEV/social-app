// frontend/src/api/client.js

const API_URL =
  import.meta.env.VITE_API_URL || "/api/v1"

export const api = async (path, options = {}) => {
  const token = localStorage.getItem("token")

  const isFormData = options.body instanceof FormData

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  // Only set JSON header if NOT FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
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

  if (res.status === 429 && error.cooldownUntil) {
    error.isRateLimited = true
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
