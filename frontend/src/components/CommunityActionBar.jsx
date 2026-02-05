import { Link } from "react-router-dom"
import {
  primaryButton,
  secondaryButton,
  ghostButton,
  dangerButton,
} from "../ui/buttonStyles"

export default function CommunityActionBar({
  theme,
  colors,
  community,
  isAdmin,
  isModerator,
  memberCount,
  onInvite,
  onLeave,
  onDelete,
}) {
  if (!community) return null

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        marginBottom: 16,
        borderRadius: 14,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* LEFT: Primary actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {isAdmin && (
          <button
            onClick={onInvite}
            style={primaryButton(theme)}
          >
            + Invite
          </button>
        )}

        {(isAdmin || isModerator) && (
          <Link
            to={`/communities/${community.id}/moderation`}
            style={{
              ...secondaryButton(theme),
              textDecoration: "none",
            }}
          >
            🛡 Moderate
          </Link>
        )}
      </div>

      {/* RIGHT: Exit / danger */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* ADMIN: only member → delete */}
        {isAdmin && memberCount === 1 && (
          <button
            onClick={onDelete}
            style={dangerButton(theme)}
          >
            Delete
          </button>
        )}

        {/* Everyone else → leave */}
        {!isAdmin && (
          <button
            onClick={onLeave}
            style={ghostButton(theme)}
          >
            Leave
          </button>
        )}

        {/* ADMIN with others */}
        {isAdmin && memberCount > 1 && (
          <div
            style={{
              fontSize: 12,
              color: colors.textMuted,
              maxWidth: 160,
              textAlign: "right",
            }}
          >
            Assign another admin before leaving
          </div>
        )}
      </div>
    </div>
  )
}

