// frontend/src/ui/buttonStyles.js
import { getThemeColors } from "./theme"

export const buttonBase = (theme) => {
  const c = getThemeColors(theme)

  return {
    padding: "10px 18px",              // more breathing room
    borderRadius: theme.radius.pill,
    fontSize: 15,                      // readable baseline
    fontWeight: 500,
    lineHeight: 1.4,
    cursor: "pointer",
    transition:
      "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
    outline: "none",
    whiteSpace: "nowrap",
  }
}

export const primaryButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    ...buttonBase(theme),
    background: c.primary,
    color: "#ffffff",
    border: "none",
  }
}

export const secondaryButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    ...buttonBase(theme),
    background: c.surface,
    color: c.text,
    border: `1px solid ${c.border}`,
  }
}

export const ghostButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    ...buttonBase(theme),
    background: "transparent",
    color: c.text,                     // was too faint before
    border: "none",
  }
}

export const dangerButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    ...buttonBase(theme),
    background: c.danger,
    color: "#ffffff",
    border: "none",
  }
}

/* =========================
   Header-specific buttons
   ========================= */

export const headerSelect = (theme) => {
  const c = getThemeColors(theme)

  return {
    padding: "8px 32px 8px 14px",       // larger click target
    borderRadius: theme.radius.pill,
    fontSize: 14,
    lineHeight: 1.4,
    background: c.surface,
    color: c.text,
    border: `1px solid ${c.border}`,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  }
}

export const headerPrimaryButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    padding: "8px 14px",
    borderRadius: theme.radius.pill,
    fontSize: 14,
    fontWeight: 500,
    background: c.primary,
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
  }
}

export const headerGhostButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    padding: "8px 12px",
    borderRadius: theme.radius.pill,
    fontSize: 14,
    background: "transparent",
    color: c.textMuted,
    border: "none",
    cursor: "pointer",
  }
}
