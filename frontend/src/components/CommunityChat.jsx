import { useEffect, useState } from "react"
import { api } from "../api/client"

export default function CommunityChat({ communityId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const loadChat = async () => {
    const data = await api(`/communities/${communityId}/chat`)
    setMessages(data || [])
  }

  // Load messages
  useEffect(() => {
    if (!communityId) return

    api(`/communities/${communityId}/chat`)
      .then((res) => setMessages(res || []))
      .catch(() => setMessages([]))
  }, [communityId])

  const sendMessage = async () => {
    if (!text.trim()) return
    setLoading(true)

    try {
      const msg = await api(
        `/communities/${communityId}/chat`,
        {
          method: "POST",
          body: JSON.stringify({ text }),
        }
      )

      setMessages((prev) => [...prev, msg])
      setText("")
    } catch (err) {
      console.error("Chat send failed", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <strong style={{ fontSize: 14 }}>Community chat</strong>

      <div
        style={{
          marginTop: 8,
          maxHeight: 220,
          overflowY: "auto",
          fontSize: 13,
        }}
      >
        {messages.length === 0 && (
          <p style={{ opacity: 0.6 }}>No messages yet</p>
        )}

        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 6 }}>
            <strong>@{m.user.username}</strong>: {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}