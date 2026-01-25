const rateStore = new Map()

export const rateLimit = ({ windowMs, max }) => {
  return (req, res, next) => {
    const key = `${req.user?.userId || req.ip}:${req.originalUrl}`
    const now = Date.now()

    const entry = rateStore.get(key) || { count: 0, start: now }

    if (now - entry.start > windowMs) {
      entry.count = 0
      entry.start = now
    }

    entry.count += 1
    rateStore.set(key, entry)

    if (entry.count > max) {
      return res.status(429).json({
        error: "Too many requests, slow down",
      })
    }

    next()
  }
}

