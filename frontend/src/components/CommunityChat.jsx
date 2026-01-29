import { useEffect, useState, useRef } from "react"
import { api } from "../api/client"

export default function CommunityChat({ communityId, isMember = true }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef(null)

  // Load messages
  useEffect(() => {
    if (!communityId) return

    api(`/communities/${communityId}/chat`)
      .then((res) => setMessages(res || []))
      .catch(() => setMessages([]))
  }, [communityId])

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || loading || !isMember) return
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

        {/* 👇 auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isMember
              ? "Say something…"
              : "Join the community to chat"
          }
          disabled={!isMember}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            opacity: isMember ? 1 : 0.6,
            cursor: isMember ? "text" : "not-allowed",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !isMember}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#0284c7",
            color: "#fff",
            cursor:
              loading || !isMember
                ? "not-allowed"
                : "pointer",
            opacity: loading || !isMember ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
