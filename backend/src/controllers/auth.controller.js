import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

/* =========================
   SIGNUP
========================= */
export const signup = async (req, res) => {
  try {
    const { email, username, password, dateOfBirth } = req.body

    if (!dateOfBirth) {
      return res.status(400).json({
        error: "dateOfBirth is required",
      })
    }

    const dob = new Date(dateOfBirth)
    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        error: "Invalid dateOfBirth",
      })
    }

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        dateOfBirth: dob,
      },
    })

    // profile
    await prisma.userProfile.create({
      data: { userId: user.id },
    })

    // default feed profile
    await prisma.feedProfile.create({
      data: {
        userId: user.id,
        name: "Default",
        isActive: true,
        preferences: {
          labels: {
            GLOBAL: [],
            COUNTRY: [],
            LOCAL: [],
          },
          nsfw: {
            posts: "HIDE",
            communities: {
              inFeeds: false,
              onProfile: false,
            },
          },
          ordering: "RECENT",
        },
      },
    })

    return res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Something went wrong" })
  }
}

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Login failed" })
  }
}

/* =========================
   AUTH ME  ✅ FIXED
========================= */
export const me = async (req, res) => {
  try {
    // ✅ Trust auth middleware as single source of truth
    return res.json({
      id: req.user.userId,
      email: req.user.email,
      username: req.user.username,

      // safety flags
      isMinor: req.user.isMinor,
      isSuperuser: req.user.isSuperuser,

      // enforcement state (READ-ONLY for UI)
      cooldownUntil: req.user.cooldownUntil ?? null,
      reportCooldownUntil: req.user.reportCooldownUntil ?? null,
      nsfwStrikes: req.user.nsfwStrikes ?? 0,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch user" })
  }
}

