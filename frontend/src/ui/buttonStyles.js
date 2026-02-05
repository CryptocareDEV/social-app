// frontend/src/ui/buttonStyles.js
import { getThemeColors } from "./theme"

export const buttonBase = (theme) => {
  const c = getThemeColors(theme)

  return {
    padding: "8px 16px",
    borderRadius: theme.radius.pill,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
    outline: "none",
  }
}


export const primaryButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    ...buttonBase(theme),
    background: c.primary,
    color: "#fff",
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
    color: c.textMuted,
    border: "none",
  }
}

export const dangerButton = (theme) => {
  const c = getThemeColors(theme)

  return {
    ...buttonBase(theme),
    background: c.danger,
    color: "#fff",
    border: "none",
  }
}

export const headerSelect = (theme) => {
  const c = theme.colors[theme.mode]

  return {
    padding: "6px 28px 6px 12px",
    borderRadius: theme.radius.pill,
    fontSize: 13,
    background: c.surface,
    color: c.text,
    border: `1px solid ${c.border}`,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  }
}

export const headerPrimaryButton = (theme) => ({
  padding: "6px 12px",
  borderRadius: theme.radius.pill,
  fontSize: 13,
  fontWeight: 500,
  background: theme.colors[theme.mode].primary,
  color: "#fff",
  border: "none",
  cursor: "pointer",
})

export const headerGhostButton = (theme) => ({
  padding: "6px 10px",
  borderRadius: theme.radius.pill,
  fontSize: 13,
  background: "transparent",
  color: theme.colors[theme.mode].textMuted,
  border: "none",
  cursor: "pointer",
})

