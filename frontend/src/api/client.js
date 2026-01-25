const API_URL = "http://localhost:4000"

export const api = async (path, options = {}) => {
  const token = localStorage.getItem("token")

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.json()
    throw err
  }

  return res.json()
}

