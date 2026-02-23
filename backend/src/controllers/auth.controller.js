import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

/* =========================
   SIGNUP
========================= */
export const signup = async (req, res) => {
  try {
    let { email, username, password, dateOfBirth } = req.body
email = email?.toLowerCase().trim()
username = username?.trim()
    // 🌍 Detect client IP
    const forwarded = req.headers["x-forwarded-for"]
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress

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
    if (password.length < 8) {
  return res.status(400).json({
    error: "Password must be at least 8 characters",
  })
}
    const passwordHash = await bcrypt.hash(password, 10)
    // 🌍 Geo detection (non-blocking fallback)
    // 🌍 Geo detection (with dev fallback)
    let countryCode = null
    let regionCode = null

    try {
      const forwarded = req.headers["x-forwarded-for"]
      const rawIp = forwarded
        ? forwarded.split(",")[0].trim()
        : req.socket.remoteAddress

      // 🧪 If local development IP, fallback to public IP lookup
      const ipToUse =
        rawIp === "::1" ||
        rawIp === "127.0.0.1" ||
        rawIp?.includes("192.168")
          ? ""
          : rawIp

      const geoRes = await fetch(
        ipToUse
          ? `https://ipapi.co/${ipToUse}/json/`
          : `https://ipapi.co/json/`
      )

      const geoData = await geoRes.json()

      if (geoData?.country_code) {
        countryCode = geoData.country_code
      }

      if (geoData?.region) {
        regionCode = geoData.region
      }
    } catch (geoErr) {
      console.warn("Geo detection failed:", geoErr.message)
    }

    const user = await prisma.user.create({
  data: {
    email,
    username,
    passwordHash,
    dateOfBirth: dob,
    countryCode,
    regionCode,
    locationUpdatedAt: new Date(),
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
    // 🌍 Detect IP for possible location update
const forwarded = req.headers["x-forwarded-for"]
const rawIp = forwarded
  ? forwarded.split(",")[0].trim()
  : req.socket.remoteAddress


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

// 🌍 Geo re-check on login (IP-based)
try {
  const ipToUse =
    rawIp === "::1" ||
    rawIp === "127.0.0.1" ||
    rawIp?.includes("192.168")
      ? ""
      : rawIp

  const currentIp = ipToUse || "LOCAL_DEV"

  // Only check geo if IP changed
  if (currentIp !== user.lastKnownIp) {
    console.log("🌍 IP changed. Checking geo...")

    const geoRes = await fetch(
      ipToUse
        ? `https://ipapi.co/${ipToUse}/json/`
        : `https://ipapi.co/json/`
    )

    let geoData = await geoRes.json()

    // Dev fallback (remove or guard in production)
    if (geoData?.error && process.env.NODE_ENV !== "production") {
      console.warn("Geo API rate limited — using dev fallback")
      geoData = {
        country_code: "NP",
        region: "Lumbini Province",
      }
    }

    const newCountry = geoData?.country_code || null
    const newRegion = geoData?.region || null

    await prisma.user.update({
      where: { id: user.id },
      data: {
        countryCode: newCountry,
        regionCode: newRegion,
        locationUpdatedAt: new Date(),
        lastKnownIp: currentIp,
      },
    })

    console.log("🌍 User location + IP updated")
  }
} catch (geoErr) {
  console.warn("Geo update on login failed:", geoErr.message)
}


    const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
    algorithm: "HS256",
  }
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

