export const requireSuperuserRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const { isRoot, isSuperuser, superuserRole } = req.user || {}

    // 👑 Root overrides everything
    if (isRoot) {
      return next()
    }

    // 🚫 Must be a superuser
    if (!isSuperuser) {
      return res.status(403).json({
        error: "Superuser access required",
      })
    }

    // 🚫 Role not permitted
    if (!allowedRoles.includes(superuserRole)) {
      return res.status(403).json({
        error: "Insufficient superuser permissions",
      })
    }

    next()
  }
}

