export const enforceReportCooldown = (req, res, next) => {
  const { reportCooldownUntil, isSuperuser } = req.user

  if (isSuperuser) {
    return next()
  }

  if (
    reportCooldownUntil &&
    new Date(reportCooldownUntil) > new Date()
  ) {
    return res.status(403).json({
      error: "You are temporarily restricted from reporting",
      reportCooldownUntil,
    })
  }

  next()
}

