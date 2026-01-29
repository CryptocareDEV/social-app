// frontend/src/ui/theme.js

export const theme = {
  mode: "light", // switch to "dark" later

  colors: {
    light: {
      bg: "#f8fafc",          // slate-50
      surface: "#ffffff",     // cards
      surfaceMuted: "#f1f5f9",// subtle sections
      border: "#e2e8f0",      // slate-200

      text: "#0f172a",        // slate-900
      textMuted: "#64748b",   // slate-500

      primary: "#2563eb",     // blue-600 (Twitter discipline)
      primarySoft: "#dbeafe", // blue-100

      success: "#16a34a",
      danger: "#dc2626",
    },

    dark: {
      bg: "#0b1220",          // deep slate blue
      surface: "#111827",     // cards
      surfaceMuted: "#1f2933",
      border: "#1f2937",

      text: "#e5e7eb",        // slate-200
      textMuted: "#9ca3af",   // slate-400

      primary: "#60a5fa",     // blue-400 (softer in dark)
      primarySoft: "#1e3a8a",

      success: "#22c55e",
      danger: "#f87171",
    },
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 999,
  },

  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 12px rgba(0,0,0,0.08)",
  },
}

// helper
export const getThemeColors = (theme) =>
  theme.colors[theme.mode]

