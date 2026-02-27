import React, { useEffect, useState } from "react"
import { api } from "../api/client"
import { getThemeColors } from "../ui/theme"

function RootDashboard({ theme }) {
  const colors = getThemeColors(theme)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [userLoading, setUserLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

const loadUserDetails = async (userId) => {
  setUserLoading(true)
  setSelectedUser(userId)

  try {
    const res = await api(`/root/analytics/user/${userId}`)
    setUserDetails(res)
  } catch (err) {
    setUserDetails(null)
  } finally {
    setUserLoading(false)
  }
}

const loadAllUsers = async () => {
  try {
    setUsersLoading(true)
    const res = await api("/root/users")
    setAllUsers(res)
  } catch (err) {
    alert("Failed to load users")
  } finally {
    setUsersLoading(false)
  }
}

useEffect(() => {
  let cancelled = false
  let intervalId

  const loadAnalytics = async () => {
    try {
      const res = await api("/root/analytics/overview")

      if (!cancelled) {
        setData(res)
        setError(null)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (!cancelled) {
        if (err?.error === "Root access only") {
          window.location.href = "/"
          return
        }

        setError(err?.error || "Failed to load analytics")
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  loadAnalytics()

  // 🔁 Refresh every 15 seconds
  intervalId = setInterval(loadAnalytics, 15000)

  return () => {
    cancelled = true
    clearInterval(intervalId)
  }
}, [])

  if (loading) {
    return <div style={{ padding: 24 }}>Loading analytics…</div>
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: colors.danger }}>
        {error}
      </div>
    )
  }

  if (!data) return null

  // ===== Activity Trend Calculation =====
const hourlyCounts = data.hourlyBuckets?.map(b => Number(b.count)) || []

let momentum = "stable"

if (hourlyCounts.length >= 2) {
  const last = hourlyCounts[hourlyCounts.length - 1]
  const prev = hourlyCounts[hourlyCounts.length - 2]

  if (last > prev * 1.5 && last >= 5) momentum = "rising"
  else if (last < prev * 0.6) momentum = "falling"
}

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 20,
  }

  return (
  <div
    style={{
      padding: 24,
      minHeight: "100vh",
      background: colors.bg,
    }}
  >
      <h2 style={{ marginBottom: 20 }}>Root Analytics</h2>

      <button
  onClick={loadAllUsers}
  style={{
    marginBottom: 16,
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    cursor: "pointer",
  }}
>
  Load All Users
</button>
      <div
  style={{
    marginBottom: 24,
    padding: 18,
    borderRadius: 14,
    border: data.spikeSignals.velocitySpike
      ? "1px solid #dc2626"
      : `1px solid ${colors.border}`,
    background: data.spikeSignals.velocitySpike
      ? "rgba(220,38,38,0.08)"
      : colors.surfaceMuted,
    transition: "all 0.3s ease",
  }}
>

    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  }}
>
  <strong>System Signals</strong>

  {data.spikeSignals.velocitySpike && (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#dc2626",
      }}
    >
      ALERT
    </span>
  )}
</div>

    {data.spikeSignals.velocitySpike && (
      <div style={{ color: "#b91c1c", marginTop: 6 }}>
        🚨 Activity spike detected ({data.spikeSignals.spikeRatio.toFixed(2)}x normal)
      </div>
    )}

    {data.spikeSignals.aggressiveUser && (
      <div style={{ color: "#92400e", marginTop: 6 }}>
        🔥 Aggressive user detected ({data.spikeSignals.aggressiveUser.actions} actions)
      </div>
    )}

    {data.spikeSignals.dominantAction && (
      <div style={{ color: "#7c2d12", marginTop: 6 }}>
        🧨 Dominant action spike: {data.spikeSignals.dominantAction.action}
      </div>
    )}

    {!data.spikeSignals.velocitySpike &&
      !data.spikeSignals.aggressiveUser &&
      !data.spikeSignals.dominantAction && (
        <div style={{ color: colors.textMuted, marginTop: 6 }}>
          No abnormal activity detected.
        </div>
      )}
  </div>
      {lastUpdated && (
  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
    Last updated: {lastUpdated.toLocaleTimeString()}
  </div>



)}
<button
  onClick={() => window.location.reload()}
  style={{
    marginBottom: 16,
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    cursor: "pointer",
  }}
>
  Refresh Now
</button>
{/* KPI SUMMARY ROW */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    marginBottom: 28,
  }}
>
  <KPICard
    title="Users"
    value={data.users.total}
    colors={colors}
  />

  <KPICard
    title="Active (24h)"
    value={data.users.activeLast24h}
    colors={colors}
  />

  <KPICard
    title="Actions (24h)"
    value={data.actions.lastDay}
    colors={colors}
  />

  <KPICard
  title={`Last Hour ${
    momentum === "rising"
      ? "↑"
      : momentum === "falling"
      ? "↓"
      : "•"
  }`}
  value={data.actions.lastHour}
  colors={colors}
/>
</div>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 24,
  }}
>
      {/* USERS */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h4>Users</h4>
        <div>Total: {data.users.total}</div>
        <div>Active (24h): {data.users.activeLast24h}</div>
        <div>Cooldowns (24h): {data.users.cooldownsLast24h}</div>
      </div>

      {/* ACTIONS */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h4>Actions</h4>
        <div>Total: {data.actions.total}</div>
        <div>Last Hour: {data.actions.lastHour}</div>
        <div>Last 24h: {data.actions.lastDay}</div>
      </div>

      {/* TOP ACTIONS */}
<div style={{ ...cardStyle, marginBottom: 16 }}>
  <h4>Top Actions (24h)</h4>

  {data.topActionsLast24h?.length === 0 && (
    <div style={{ color: colors.textMuted }}>
      No activity yet.
    </div>
  )}

  {(() => {
    const maxCount = Math.max(
  ...data.topActionsLast24h.map((a) => a._count.action),
  1
)

    return data.topActionsLast24h.map((item) => {
      const widthPercent = (item._count.action / maxCount) * 100

      return (
        <div
          key={item.action}
          style={{ marginBottom: 10 }}
        >
          <div
            style={{
              fontSize: 12,
              marginBottom: 4,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{item.action}</span>
            <span>{item._count.action}</span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: colors.surfaceMuted,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${widthPercent}%`,
                height: "100%",
                background: colors.primary,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )
    })
  })()}
</div>
</div>


{/* ANALYTICS BODY GRID */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 24,
    alignItems: "start",
  }}
>
{/* HOURLY ACTIVITY */}
<div
  style={{
    ...cardStyle,
    marginBottom: 24,
  }}
>
  <h4>Hourly Activity (24h)</h4>

  {data.hourlyBuckets?.length > 0 && (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginTop: 12,
      }}
    >
      {(() => {
        const max = Math.max(
          ...data.hourlyBuckets.map((b) => Number(b.count)),
          1
        )

        return data.hourlyBuckets.map((bucket, i) => {
          const intensity =
            Number(bucket.count) / max

          return (
            <div
              key={i}
              title={`${bucket.hour} — ${bucket.count}`}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 4,
                background: `rgba(59,130,246,${intensity})`,
                transition: "all 0.3s ease",
              }}
            />
          )
        })
      })()}
    </div>
  )}
</div>

{/* IP CONCENTRATION */}
<div style={{ ...cardStyle, marginBottom: 24 }}>
  <h4>Top IPs (24h)</h4>

  {data.topIPs?.map((ip) => (
    <div key={ip.ipAddress}>
      {ip.ipAddress || "Unknown"} — {ip._count.ipAddress}
    </div>
  ))}
</div>
</div>
      {/* TOP USERS */}
      <div style={cardStyle}>
        <h4>Most Active Users (24h)</h4>
        {data.topUsersLast24h?.length === 0 && (
          <div style={{ color: colors.textMuted }}>
            No active users yet.
          </div>
        )}
        {data.topUsersLast24h.map((user) => (
  <div key={user.userId} style={{ marginBottom: 8 }}>
    <div
      onClick={() =>
        selectedUser === user.userId
          ? setSelectedUser(null)
          : loadUserDetails(user.userId)
      }
      style={{
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      {user.userId} — {user._count.userId}
    </div>

    {selectedUser === user.userId && (
      <div
        style={{
          marginTop: 8,
          padding: 12,
          borderRadius: 8,
          background: colors.surfaceMuted,
          fontSize: 12,
        }}
      >
        {userLoading && <div>Loading user details…</div>}

        {userDetails && (
          <>
          <button
  onClick={async () => {
    try {
      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:4000/api/v1/root/analytics/user/${selectedUser}/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `user-${selectedUser}-activity.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      alert("Failed to export CSV")
    }
  }}
  style={{
    marginBottom: 8,
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    cursor: "pointer",
  }}
>
  Export CSV
</button>
            <div>Total (24h): {userDetails.totalActions}</div>

            <div style={{ marginTop: 8 }}>
              <strong>Action Breakdown:</strong>
              {userDetails.actionBreakdown?.map((a) => (
                <div key={a.action}>
                  {a.action} — {a._count.action}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Recent Activity:</strong>
              {userDetails.recentActivity.map((r, i) => (
                <div key={i}>
                  {r.action} —{" "}
                  {new Date(r.createdAt).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )}
  </div>
))}
      </div>

{usersLoading && <div>Loading users...</div>}

{!usersLoading && allUsers.length > 0 && (
  <div
    style={{
      marginTop: 40,
      padding: 20,
      background: colors.surface,
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
    }}
  >
    <h4>All Registered Users</h4>

    {usersLoading && <div>Loading users...</div>}

    <div style={{ marginTop: 16 }}>
      {allUsers.map((u) => (
        <div
          key={u.id}
          style={{
            padding: "8px 0",
            borderBottom: `1px solid ${colors.border}`,
            fontSize: 13,
          }}
        >
          <strong>{u.username}</strong>  
          <div>Email: {u.email}</div>
          <div>ID: {u.id}</div>
          <div>Joined: {new Date(u.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  </div>
)}
      
    </div>
  )
}



function KPICard({ title, value, colors, trend }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: 20,
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.6,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  )
}


export default RootDashboard
