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
    
    typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

    // Base text (feeds, descriptions, posts)
    body: {
      size: 17,               
      lineHeight: 1.65,
      weight: 400,
    },

    // Secondary / helper text
    small: {
      size: 14,
      lineHeight: 1.55,
      weight: 400,
    },

    // Headings — hierarchy by size, not weight
    h1: {
      size: 34,               // page titles
      lineHeight: 1.2,
      weight: 600,
    },
    h2: {
      size: 28,               // section titles
      lineHeight: 1.25,
      weight: 600,
    },
    h3: {
      size: 22,               // subsection
      lineHeight: 1.35,
      weight: 600,
    },
    h4: {
      size: 18,               // labels / cards
      lineHeight: 1.45,
      weight: 600,
    },
  },


      spacing: {
    xs: 4,
    sm: 8,
    md: 16,     // 👈 was 12, now matches body rhythm
    lg: 24,     // 👈 clearer section separation
    xl: 32,
    xxl: 56,    // 👈 page-level breathing
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
export const getThemeColors = (theme) => {
  const base = theme.colors[theme.mode]

  const accents = {
  REDDIT: theme.mode === "light" ? "#ff4500" : "#ff6a2a",

  SUN_ORANGE:
    theme.mode === "light" ? "#d97745" : "#f4a261",

  SKY_BLUE:
    theme.mode === "light" ? "#4ea8de" : "#72c3f0",

  TURQUOISE:
    theme.mode === "light" ? "#2a9d8f" : "#52bdb1",

  SOFT_GREEN:
    theme.mode === "light" ? "#6a994e" : "#8ecf6c",
}


  const primary = accents[theme.accent] || accents.REDDIT

  return {
    ...base,
    primary,
    primarySoft:
      theme.mode === "light"
        ? "rgba(0,0,0,0.04)"
        : "rgba(255,255,255,0.06)",
  }
}
