import jwt from "jsonwebtoken"

export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" })
    }

    const token = header.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" })
  }
}

