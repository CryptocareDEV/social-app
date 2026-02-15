import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/client"
import { theme, getThemeColors } from "../ui/theme"
import {
  secondaryButton,
  dangerButton,
  ghostButton,
} from "../ui/buttonStyles"


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


const ACTIONS = ["NO_ACTION", "LIMITED", "REMOVED"]

export default function ModerationDashboard() {
  const [activeReports, setActiveReports] = useState([])
const [resolvedReports, setResolvedReports] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actingOn, setActingOn] = useState(null)
  const [me, setMe] = useState(null)
  const [view, setView] = useState("ACTIVE")


  const colors = getThemeColors(theme)
  const textStyle = {
  fontSize: theme.typography.body.size,
  lineHeight: theme.typography.body.lineHeight,
  color: colors.text,
}

const mutedTextStyle = {
  fontSize: theme.typography.small.size,
  color: colors.textMuted,
}


const priorityLabels = {
  CRITICAL: "Priority 1",
  HIGH: "Priority 2",
  MEDIUM: "Priority 3",
  LOW: "Priority 4",
}




const applyAction = async (report, outcome) => {
  const confirmed = window.confirm(
    `Apply ${outcome} to this post?\n\nThis will affect the author and reporters.`
  )

  if (!confirmed) return

  try {
    setActingOn(report.id)

    // 1️⃣ Execute moderation
    await api("/moderation/actions", {
      method: "POST",
      body: JSON.stringify({
        postId: report.post.id,
        outcome,
        note: report.reason,
      }),
    })

    // 2️⃣ Reload reports
    const fresh = await api("/moderation/reports")

    if (fresh && typeof fresh === "object") {
      setActiveReports(Array.isArray(fresh.active) ? fresh.active : [])
      setResolvedReports(Array.isArray(fresh.resolved) ? fresh.resolved : [])
    }

  } catch (err) {
    console.error("Moderation action failed:", err)
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
        const meData = await api("/users/me")
if (mounted) setMe(meData)
        const data = await api("/moderation/reports")
        

        if (!mounted) return

        setActiveReports(Array.isArray(data.active) ? data.active : [])
setResolvedReports(Array.isArray(data.resolved) ? data.resolved : [])
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
    <div
  style={{
    maxWidth: 900,
    margin: "0 auto",
    padding: theme.spacing.lg,
    background: colors.bg,
    minHeight: "100vh",
  }}
>
      <div style={{ marginBottom: theme.spacing.lg }}>

  {/* Top Row: Profile Link */}
  {me?.id && (
    <div style={{ marginBottom: theme.spacing.sm }}>
      <Link
        to={`/profile/${me.id}`}
        style={{
          textDecoration: "none",
          color: colors.primary,
          fontWeight: 500,
          fontSize: theme.typography.small.size,
        }}
      >
        ← Back to Profile
      </Link>
    </div>
  )}

  {/* Page Title */}
  <h2
    style={{
      fontSize: theme.typography.h2.size,
      fontWeight: theme.typography.h2.weight,
      marginBottom: theme.spacing.sm,
      color: colors.text,
    }}
  >
    Moderation Dashboard
  </h2>

  {/* Priority Guide */}
  <div
    style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.small.size,
      color: colors.text,
    }}
  >
    <strong>Priority Guide</strong>
    <div style={{ marginTop: theme.spacing.xs }}>
      Priority 1 – Immediate review required.
    </div>
    <div>Priority 2 – Significant policy concern.</div>
    <div>Priority 3 – Moderate issue.</div>
    <div>Priority 4 – Low impact report.</div>
  </div>
</div>

{/* View Switcher */}
<div
  style={{
    display: "flex",
    gap: 12,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  }}
>
  <button
    onClick={() => setView("ACTIVE")}
    style={{
      padding: "6px 14px",
      borderRadius: theme.radius.pill,
      border: `1px solid ${colors.border}`,
      background:
        view === "ACTIVE" ? colors.primary : colors.surface,
      color:
        view === "ACTIVE" ? "#fff" : colors.text,
      cursor: "pointer",
    }}
  >
    Active ({activeReports.length})
  </button>

  <button
    onClick={() => setView("RESOLVED")}
    style={{
      padding: "6px 14px",
      borderRadius: theme.radius.pill,
      border: `1px solid ${colors.border}`,
      background:
        view === "RESOLVED" ? colors.primary : colors.surface,
      color:
        view === "RESOLVED" ? "#fff" : colors.text,
      cursor: "pointer",
    }}
  >
    Resolved ({resolvedReports.length})
  </button>
</div>


{view === "ACTIVE" && (
  <>
    {activeReports.length === 0 && (
      <p style={{ opacity: 0.7 }}>
        No active reports. The system is quiet — that’s good.
      </p>
    )}

    {activeReports.map((r) => {
      const severity = getSeverity(r)
      const priorityLabel = priorityLabels[severity]
      const alreadyRemoved = r.post?.isRemoved

      return (
        <div
          key={r.id}
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            boxShadow: theme.shadow.sm,
          }}
        >
          <div
            style={{
              display: "inline-block",
              marginBottom: theme.spacing.sm,
              padding: "4px 10px",
              borderRadius: theme.radius.pill,
              fontSize: theme.typography.small.size,
              fontWeight: 500,
              background: colors.surfaceMuted,
              color: colors.textMuted,
              border: `1px solid ${colors.border}`,
            }}
          >
            {priorityLabel}
          </div>

          <div style={{ ...textStyle, marginBottom: theme.spacing.xs }}>
            <strong>Reason:</strong> {r.reason}
          </div>

          <div style={{ ...textStyle, marginBottom: theme.spacing.xs }}>
            <strong>Post:</strong>{" "}
            {r.post?.caption || <em>(no caption)</em>}
          </div>

          <div style={{ ...textStyle, marginBottom: theme.spacing.xs }}>
            <strong>Reporter:</strong> @{r.reporter?.username}
          </div>

          <div style={{ ...mutedTextStyle, marginTop: theme.spacing.sm }}>
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
                style={
                  action === "REMOVED"
                    ? dangerButton(theme)
                    : secondaryButton(theme)
                }
              >
                {action === "LIMITED"
                  ? "Restrict Reach"
                  : action === "REMOVED"
                  ? "Remove Content"
                  : "No Action"}
              </button>
            ))}
          </div>
        </div>
      )
    })}
  </>
)}


      {view === "RESOLVED" && (
  <>
    {resolvedReports.length === 0 && (
      <p style={{ opacity: 0.7 }}>
        No resolved reports yet.
      </p>
    )}

    {resolvedReports.map((r) => (
      <div
        key={r.id}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
          boxShadow: theme.shadow.sm,
        }}
      >
        <div style={{ ...textStyle, marginBottom: 6 }}>
          <strong>Post:</strong>{" "}
          {r.post?.caption || "(no caption)"}
        </div>

        <div style={{ ...textStyle, marginBottom: 6 }}>
          <strong>Final Outcome:</strong>{" "}
          {r.post?.moderationActions?.[0]?.outcome}
        </div>

        <div style={mutedTextStyle}>
          Reporter: @{r.reporter?.username}
        </div>
      </div>
    ))}
  </>
)}


    </div>

    
  )
}
