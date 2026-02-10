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
      const msg = await api(`/communities/${communityId}/chat`, {
        method: "POST",
        body: JSON.stringify({ text }),
      })

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
        padding: 14,
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#0f172a",
          marginBottom: 10,
        }}
      >
        Community chat
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          maxHeight: 220,
          overflowY: "auto",
          fontSize: 13,
          paddingRight: 4,
        }}
      >
        {messages.length === 0 && (
          <p style={{ opacity: 0.6 }}>No messages yet</p>
        )}

        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#475569",
                marginBottom: 2,
              }}
            >
              @{m.user.username}
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: "#f1f5f9",
                color: "#0f172a",
                lineHeight: 1.45,
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #e5e7eb",
        }}
      >
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
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 13,
            color: "#0f172a",
            background: "#ffffff",
            opacity: isMember ? 1 : 0.6,
            cursor: isMember ? "text" : "not-allowed",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !isMember}
          style={{
            padding: "6px 14px",
            borderRadius: 10,
            border: "none",
            background: "#0284c7",
            color: "#ffffff",
            fontSize: 13,
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
