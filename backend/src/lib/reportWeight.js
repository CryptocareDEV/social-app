export const getReportWeight = (user) => {
  // Minors always count fully
  if (user.isMinor) return 1.0

  // Default safety
  if (user.reportAccuracy == null) return 1.0

  return Math.max(0.2, Math.min(user.reportAccuracy, 1.5))
}

