// frontend/src/ui/theme.js

export const theme = {
  mode: "light",

  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 999,
  },

  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 6px 20px rgba(0,0,0,0.08)",
  },

  colors: {
  light: {
    bg: "#f9fafb",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    border: "#e5e7eb",
    text: "#0f172a",
    textMuted: "#475569",

    primary: "#2563eb",
    primarySoft: "#e0e7ff",

    success: "#16a34a",
    danger: "#dc2626",
  },
  dark: {
    bg: "#020617",
    surface: "#020617",
    surfaceMuted: "#020617",
    border: "#1e293b",
    text: "#e5e7eb",
    textMuted: "#94a3b8",

    primary: "#3b82f6",
    primarySoft: "#1e3a8a",

    success: "#22c55e",
    danger: "#ef4444",
  },
}
}

export const getThemeColors = (theme) => {
  return theme.colors[theme.mode]
}
