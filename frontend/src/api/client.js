const API_URL = "http://localhost:4000/api/v1"

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
  let error
  try {
    error = await res.json()
  } catch {
    error = { error: "Something went wrong" }
  }

  throw error
}


  const text = await res.text()
  return text ? JSON.parse(text) : null
}
