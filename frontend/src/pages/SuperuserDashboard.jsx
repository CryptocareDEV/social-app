import { useEffect, useState } from "react"
import { api } from "../api/client"
import { theme, getThemeColors } from "../ui/theme"

export default function SuperuserDashboard() {
  const [superusers, setSuperusers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [me, setMe] = useState(null)
  const [lookupEmail, setLookupEmail] = useState("")
const [lookupResult, setLookupResult] = useState(null)
const [selectedRole, setSelectedRole] = useState("MODERATOR")
const [systemHealth, setSystemHealth] = useState(null)
const colors = getThemeColors(theme)
const [enforcementType, setEnforcementType] = useState("STRIKES")
const [enforcementUsers, setEnforcementUsers] = useState([])
const [enforcementTotal, setEnforcementTotal] = useState(0)
const [enforcementPage, setEnforcementPage] = useState(1)
const [enforcementPageSize] = useState(10)
const [enforcementLoading, setEnforcementLoading] = useState(false)



const lookupUser = async () => {
  if (!lookupEmail.trim()) return

  try {
    const user = await api(`/users/lookup/${lookupEmail.trim()}`)
    setLookupResult(user)
  } catch (err) {
    alert(err?.error || "User not found")
    setLookupResult(null)
  }
}

const promoteUser = async () => {
  if (!lookupResult) return

  try {
    await api("/superusers/promote", {
      method: "POST",
      body: JSON.stringify({
        userId: lookupResult.id,
        role: selectedRole,
      }),
    })

    setLookupEmail("")
    setLookupResult(null)
    loadSuperusers()
  } catch (err) {
    alert(err?.error || "Promotion failed")
  }
}


  const loadSuperusers = async () => {
  try {
    const meData = await api("/users/me")
    setMe(meData)

    const [superusersData, healthData] = await Promise.all([
      api("/superusers"),
      api("/superusers/system-health"),
    ])

    setSuperusers(superusersData)
    setSystemHealth(healthData)

  } catch (err) {
    setError(err?.error || "Failed to load superusers")
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    loadSuperusers()
  }, [])

  const changeRole = async (userId, role) => {
    try {
      await api(`/superusers/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      })
      loadSuperusers()
    } catch (err) {
      alert(err?.error || "Role change failed")
    }
  }

  const demote = async (userId) => {
    if (userId === me?.id) {
      alert("You cannot demote yourself.")
      return
    }

    const confirmed = window.confirm("Demote this superuser?")
    if (!confirmed) return

    try {
      await api(`/superusers/${userId}`, {
        method: "DELETE",
      })
      loadSuperusers()
    } catch (err) {
      alert(err?.error || "Demotion failed")
    }
  }

  const resetUserEnforcement = async (userId) => {
  const confirmed = window.confirm(
    "Reset cooldown, strikes, report accuracy and ban state?"
  )
  if (!confirmed) return

  try {
    await api(`/superusers/user/${userId}/reset`, {
      method: "POST",
    })
await loadEnforcementUsers(enforcementPage, enforcementType)
    alert("User enforcement reset.")
  } catch (err) {
    alert(err?.error || "Reset failed")
  }
}

const loadEnforcementUsers = async (page = 1, type = enforcementType) => {
  try {
    setEnforcementLoading(true)

    const data = await api(
      `/superusers/enforcement-users?type=${type}&page=${page}&pageSize=${enforcementPageSize}`
    )

    setEnforcementUsers(data.users)
    setEnforcementTotal(data.total)
    setEnforcementPage(data.page)
  } catch (err) {
    alert(err?.error || "Failed to load enforcement users")
  } finally {
    setEnforcementLoading(false)
  }
}
useEffect(() => {
  loadEnforcementUsers(1, enforcementType)
}, [enforcementType])



  if (loading) return <p style={{ padding: 20 }}>Loading...</p>
  if (error) return <p style={{ padding: 20 }}>{error}</p>

  const isRoot = me?.isRoot === true

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2>Superuser Management</h2>

      {systemHealth && (
  <div
    style={{
      marginBottom: 30,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      color: colors.text,
      boxShadow: theme.shadow.sm,
    }}
  >
    <h3
      style={{
        marginTop: 0,
        marginBottom: theme.spacing.sm,
        fontSize: theme.typography.h3.size,
        fontWeight: theme.typography.h3.weight,
      }}
    >
      Platform Enforcement Overview
    </h3>

    {/* BANNED USERS */}
    <div style={{ marginBottom: 12 }}>
      ⛔ <strong>Banned:</strong> {systemHealth.bannedUsers}
      {systemHealth.bannedList.length > 0 &&
        systemHealth.bannedList.map(u => (
          <div key={u.id} style={{ fontSize: 13, marginLeft: 10 }}>
            • {u.username} ({u.email})
          </div>
        ))}
    </div>

    {/* STRIKES */}
    <div style={{ marginBottom: 12 }}>
      ⚠️ <strong>Users With Strikes:</strong> {systemHealth.usersWithStrikes}
      {systemHealth.strikeList.length > 0 &&
        systemHealth.strikeList.map(u => (
          <div key={u.id} style={{ fontSize: 13, marginLeft: 10 }}>
            • {u.username} — {u.nsfwStrikes} strikes
          </div>
        ))}
    </div>

    {/* POST COOLDOWN */}
    <div style={{ marginBottom: 12 }}>
      🔥 <strong>Post Cooldowns:</strong> {systemHealth.activePostCooldown}
      {systemHealth.postCooldownList.length > 0 &&
        systemHealth.postCooldownList.map(u => (
          <div key={u.id} style={{ fontSize: 13, marginLeft: 10 }}>
            • {u.username} until{" "}
            {new Date(u.cooldownUntil).toLocaleString()}
          </div>
        ))}
    </div>

    {/* REPORT COOLDOWN */}
    <div style={{ marginBottom: 12 }}>
      🧊 <strong>Report Cooldowns:</strong> {systemHealth.activeReportCooldown}
      {systemHealth.reportCooldownList.length > 0 &&
        systemHealth.reportCooldownList.map(u => (
          <div key={u.id} style={{ fontSize: 13, marginLeft: 10 }}>
            • {u.username} until{" "}
            {new Date(u.reportCooldownUntil).toLocaleString()}
          </div>
        ))}
    </div>

    <div>
      📊 <strong>Avg Report Accuracy:</strong>{" "}
      {(systemHealth.avgReportAccuracy * 100).toFixed(1)}%
    </div>

    <div
  style={{
    marginBottom: 30,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    boxShadow: theme.shadow.sm,
  }}
>
  <h3
    style={{
      marginTop: 0,
      marginBottom: theme.spacing.sm,
      fontSize: theme.typography.h3.size,
      fontWeight: theme.typography.h3.weight,
    }}
  >
    Enforcement Explorer
  </h3>

  {/* Filter */}
  <div style={{ marginBottom: 12 }}>
    <select
      value={enforcementType}
      onChange={(e) => setEnforcementType(e.target.value)}
      style={{ padding: 8 }}
    >
      <option value="STRIKES">Users With Strikes</option>
      <option value="BANNED">Banned Users</option>
      <option value="POST_COOLDOWN">Post Cooldown</option>
      <option value="REPORT_COOLDOWN">Report Cooldown</option>
    </select>
  </div>

  {/* List */}
  {enforcementLoading ? (
    <div>Loading...</div>
  ) : (
    <>
      {enforcementUsers.map((u) => (
        <div
          key={u.id}
          style={{
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: colors.surfaceMuted,
          }}
        >
          <div>
            <strong>{u.username}</strong> ({u.email})
          </div>

          {u.isBanned && <div>⛔ Banned</div>}
          {u.nsfwStrikes > 0 && (
            <div>⚠️ Strikes: {u.nsfwStrikes}</div>
          )}
          {u.cooldownUntil && (
            <div>
              🧊 Post cooldown until{" "}
              {new Date(u.cooldownUntil).toLocaleString()}
            </div>
          )}
          {u.reportCooldownUntil && (
            <div>
              📛 Report cooldown until{" "}
              {new Date(u.reportCooldownUntil).toLocaleString()}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => resetUserEnforcement(u.id)}
              style={{
                padding: "6px 10px",
                background: colors.primary,
                color: "#fff",
                border: "none",
                borderRadius: 6,
              }}
            >
              Reset Enforcement
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div style={{ marginTop: 12 }}>
        Page {enforcementPage} of{" "}
        {Math.ceil(enforcementTotal / enforcementPageSize)}

        <div style={{ marginTop: 8 }}>
          <button
            disabled={enforcementPage === 1}
            onClick={() =>
              loadEnforcementUsers(enforcementPage - 1)
            }
          >
            Prev
          </button>

          <button
            disabled={
              enforcementPage >=
              Math.ceil(enforcementTotal / enforcementPageSize)
            }
            onClick={() =>
              loadEnforcementUsers(enforcementPage + 1)
            }
            style={{ marginLeft: 8 }}
          >
            Next
          </button>
        </div>
      </div>
    </>
  )}
</div>

  </div>
)}




      {isRoot && (
  <div
    style={{
      marginBottom: 30,
      padding: 16,
      border: "1px solid #ddd",
      borderRadius: 8,
    }}
  >
    <h3>Promote User</h3>

    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
      <input
        type="email"
        placeholder="Enter user email"
        value={lookupEmail}
        onChange={(e) => setLookupEmail(e.target.value)}
        style={{ padding: 8, flex: 1 }}
      />

      <button onClick={lookupUser}>
        Lookup
      </button>
    </div>

    {lookupResult && (
      <div style={{ marginTop: 10 }}>
        <div>
          <strong>{lookupResult.username}</strong>
        </div>
        <div>{lookupResult.email}</div>

        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="MODERATOR">MODERATOR</option>
            <option value="LEGAL">LEGAL</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button onClick={promoteUser}>
            Promote
          </button>
        </div>
      </div>
    )}
  </div>
)}


      {superusers.length === 0 && (
        <p>No superusers found.</p>
      )}

      {superusers.map((s) => (
        <div
          key={s.userId}
          style={{
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div>
            <strong>{s.user.username}</strong>
          </div>

          <div>{s.user.email}</div>
          <div>Role: {s.role}</div>

          {(isRoot || me?.superuserRole === "ADMIN" || me?.superuserRole === "LEGAL") && (
  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>

    {isRoot && (
      <>
        <button onClick={() => changeRole(s.userId, "MODERATOR")}>
          Make MODERATOR
        </button>

        <button onClick={() => changeRole(s.userId, "LEGAL")}>
          Make LEGAL
        </button>

        <button onClick={() => changeRole(s.userId, "ADMIN")}>
          Make ADMIN
        </button>

        <button onClick={() => demote(s.userId)}>
          Demote
        </button>
      </>
    )}

    <button
      style={{ background: "#facc15" }}
      onClick={() => resetUserEnforcement(s.userId)}
    >
      Reset Enforcement
    </button>

  </div>
)}

        </div>
      ))}
    </div>
  )
}
