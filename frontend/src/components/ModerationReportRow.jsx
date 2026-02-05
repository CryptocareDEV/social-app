import { api } from "../api/client"

const severityMap = {
  MINOR_SAFETY: "CRITICAL",
  NSFW_EXPOSURE: "CRITICAL",
  HATE: "HIGH",
  VIOLENCE: "HIGH",
  HARASSMENT: "MEDIUM",
  MISINFORMATION: "MEDIUM",
  SPAM: "LOW",
  OTHER: "LOW",
}

export default function ModerationReportRow({ report, onActionComplete }) {
  const severity = severityMap[report.reason] || "LOW"

  const handleAction = async (outcome) => {
    await api("/moderation/actions", {
      method: "POST",
      body: JSON.stringify({
        postId: report.post.id,
        outcome,
        note: `Moderator decision: ${outcome}`,
      }),
    })

    onActionComplete()
  }

  return (
    <div
      style={{
        padding: 16,
        marginTop: 12,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    >
      <div style={{ fontSize: 14, marginBottom: 6 }}>
        <strong>@{report.reporter.username}</strong> reported:
      </div>

      <div style={{ fontSize: 13, opacity: 0.8 }}>
        {report.post.caption || "No caption"}
      </div>

      <div style={{ marginTop: 8, fontSize: 12 }}>
        Severity: <strong>{severity}</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => handleAction("NO_ACTION")}>
          No action
        </button>
        <button onClick={() => handleAction("LIMITED")}>
          Limit
        </button>
        <button onClick={() => handleAction("REMOVED")}>
          Remove
        </button>
        <button onClick={() => handleAction("ESCALATED")}>
          Escalate
        </button>
      </div>
    </div>
  )
}

