// frontend/src/ui/theme.js

export const theme = {
  mode: "light",

  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 999,
  },


  spacing: {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
},


  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.04)",
    md: "0 8px 24px rgba(0,0,0,0.06)",
  },

  colors: {
    light: {
  // Backgrounds (slightly warm, breathable)
  bg: "#fdfefe",
  surface: "#ffffff",
  surfaceMuted: "#f3f5f8",

  // Borders (still subtle, but clearer)
  border: "#dde1e7",

  // Text hierarchy (crisper + more contrast)
  text: "#0b1220",
  textMuted: "#556070",

  // Accents (unchanged, already good)
  primary: "#2563eb",
  primarySoft: "#e6ecff",

  success: "#16a34a",
  danger: "#dc2626",
},

    dark: {
      // Backgrounds (deep, not pitch black)
      bg: "#020617",
      surface: "#04091a",
      surfaceMuted: "#070d22",

      // Borders (barely visible)
      border: "#1c2540",

      // Text hierarchy
      text: "#e6e8ee",        // soft off-white (never pure white)
      textMuted: "#9aa4b2",   // fades earlier than primary

      // Accents
      primary: "#4f8cff",
      primarySoft: "#1e2a52",

      success: "#22c55e",
      danger: "#ef4444",
    },
  },
}

export const getThemeColors = (theme) => {
  return theme.colors[theme.mode]
}
