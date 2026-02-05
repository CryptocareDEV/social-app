import { useEffect, useState } from "react"
import { api } from "../api/client"

/* ================================
   Severity helpers (TOP LEVEL)
================================ */

const getSeverity = (report) => {
  if (report.reason === "MINOR_SAFETY") return "CRITICAL"
  if (report.reason === "NSFW_EXPOSURE") return "HIGH"

  const outcome =
    report.post?.moderationActions?.[0]?.outcome

  if (outcome === "REMOVED" || outcome === "ESCALATED")
    return "HIGH"

  if (outcome === "LIMITED") return "MEDIUM"

  return "LOW"
}

const outcomeExplanation = {
  NO_ACTION:
    "Report did not meet enforcement threshold. Reporter accuracy may be adjusted.",
  LIMITED:
    "Content remains visible but reach is restricted due to confirmed issues.",
  REMOVED:
    "Content violated platform rules and has been removed permanently.",
}


const severityStyles = {
  CRITICAL: {
    bg: "#fee2e2",
    color: "#7f1d1d",
    label: "CRITICAL",
  },
  HIGH: {
    bg: "#ffedd5",
    color: "#7c2d12",
    label: "HIGH",
  },
  MEDIUM: {
    bg: "#fef3c7",
    color: "#92400e",
    label: "MEDIUM",
  },
  LOW: {
    bg: "#f1f5f9",
    color: "#334155",
    label: "LOW",
  },
}
const ACTIONS = ["NO_ACTION", "LIMITED", "REMOVED"]

export default function ModerationDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actingOn, setActingOn] = useState(null)

const applyAction = async (report, outcome) => {
  const confirmed = window.confirm(
    `Apply ${outcome} to this post?\n\nThis will affect the author and reporters.`
  )

  if (!confirmed) return

  try {
    setActingOn(report.id)

    await api("/moderation/actions", {
      method: "POST",
      body: JSON.stringify({
        postId: report.post.id,
        outcome,
        note: report.reason,
      }),
    })

    // 🔁 Reload reports (source of truth)
    const fresh = await api("/moderation/reports")
    setReports(Array.isArray(fresh) ? fresh : [])
  } catch (err) {
    alert(err?.error || "Failed to apply moderation action")
  } finally {
    setActingOn(null)
  }
}



  /* ================================
     Load reports
  ================================= */
  useEffect(() => {
    let mounted = true

    const loadReports = async () => {
      try {
        const data = await api("/moderation/reports")
        console.log("MODERATION REPORTS RESPONSE:", data)

        if (!mounted) return

        setReports(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load moderation reports:", err)
        if (!mounted) return
        setError(err?.error || "Failed to load moderation reports")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadReports()
    return () => {
      mounted = false
    }
  }, [])

  /* ================================
     States
  ================================= */
  if (loading) {
    return <p style={{ padding: 20 }}>Loading moderation reports…</p>
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: "#7f1d1d" }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  /* ================================
     Render
  ================================= */
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>🛡 Moderation Dashboard</h2>

      {reports.length === 0 && (
        <p style={{ opacity: 0.7 }}>
  No active reports. The system is quiet — that’s good.
</p>
      )}

      {reports.map((r) => {
        const severity = getSeverity(r)
        const s = severityStyles[severity]
        const alreadyRemoved = r.post?.isRemoved


        return (
          <div
            key={r.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            {/* Severity badge */}
            <div
              style={{
                display: "inline-block",
                marginBottom: 8,
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: s.bg,
                color: s.color,
              }}
            >
              {s.label}
            </div>

            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>Reason:</strong> {r.reason}
            </div>

            <div style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>Post:</strong>{" "}
              {r.post?.caption || <em>(no caption)</em>}
            </div>

            <div style={{ fontSize: 13 }}>
              <strong>Reporter:</strong> @{r.reporter?.username}
            </div>
            <div style={{ fontSize: 12, marginTop: 6, color: "#475569" }}>
  <strong>Reporter trust:</strong>{" "}
  {(r.reporter.reportAccuracy * 100).toFixed(0)}%
  {" · "}
  {r.reporter.reportsConfirmed}✔️ / {r.reporter.reportsRejected}❌
  {" · "}
  {r.reporter.reportsSubmitted} total
</div>
{r.reporter.reportCooldownUntil &&
  new Date(r.reporter.reportCooldownUntil) > new Date() && (
    <div
      style={{
        marginTop: 4,
        fontSize: 12,
        color: "#92400e",
      }}
    >
      ⚠️ Reporter on cooldown until{" "}
      {new Date(
        r.reporter.reportCooldownUntil
      ).toLocaleString()}
    </div>
  )}

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
  {ACTIONS.map((action) => (
    <button
      key={action}
      title={outcomeExplanation[action]}
      disabled={alreadyRemoved || actingOn === r.id}
      onClick={() => applyAction(r, action)}
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 6,
        border: "1px solid #e5e7eb",
        background:
          action === "REMOVED"
            ? "#fee2e2"
            : action === "LIMITED"
            ? "#fef3c7"
            : "#f1f5f9",
        cursor: actingOn === r.id ? "not-allowed" : "pointer",
      }}
    >
      {action}
    </button>
  ))}
</div>
          </div>
        )
      })}
    </div>
  )
}
