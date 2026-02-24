import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"
import crypto from "crypto"
import { sendEmail } from "../lib/email.js"

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
try {
    await sendEmail({
  to: user.email,
  subject: "Welcome to CivicHalls",
  html: `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f8fafc; padding:40px 20px;">
    <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
      
      <h2 style="margin:0 0 12px 0;font-size:22px;color:#111827;">
        Welcome to CivicHalls
      </h2>

      <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">
        You now have access to a label-driven civic platform built for structured discussion.
      </p>

      <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:18px;">
        <li>🌍 Explore Global, Country, and Local feeds</li>
        <li>🏷️ Filter discussions by categories</li>
        <li>🏛️ Join or create communities</li>
        <li>🧠 Shape your feed using Feed Profiles</li>
        <li>📊 Participate in moderated civic conversations</li>
      </ul>

      <div style="text-align:center;margin:28px 0;">
        <a href="${process.env.FRONTEND_URL}"
           style="display:inline-block;padding:12px 20px;background:#ff4500;color:white;
           border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
          Start Exploring
        </a>
      </div>

      <p style="font-size:12px;color:#94a3b8;">
        Build discussions and real connections. We truly hope you have fun here.
      </p>

    </div>
  </div>
  `,
})
} catch (emailErr) {
  console.error("WELCOME EMAIL FAILED:", emailErr)
}

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

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // 🔐 Always return success (avoid user enumeration)
    if (!user) {
      return res.json({ success: true })
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex")

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex")

    const expiresAt = new Date(Date.now() + 1000 * 60 * 20) // 20 minutes

    // Delete previous tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Store new token (hashed)
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`

    await sendEmail({
      to: user.email,
      subject: "Reset your CivicHalls password",
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f8fafc; padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
    
    <h2 style="margin:0 0 12px 0;font-size:22px;color:#111827;">
      Reset your password
    </h2>

    <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">
      We received a request to reset your CivicHalls password.
      This link will expire in 20 minutes.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${resetLink}"
         style="display:inline-block;padding:12px 20px;background:#ff4500;color:white;
         border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
        Reset Password
      </a>
    </div>

    <p style="font-size:13px;color:#64748b;line-height:1.5;">
      If you did not request this, you can safely ignore this email.
      Your account remains secure.
    </p>

    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />

    <p style="font-size:12px;color:#94a3b8;word-break:break-all;">
      If the button doesn’t work, copy and paste this link into your browser:<br/>
      ${resetLink}
    </p>

  </div>
</div>
`,
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("REQUEST RESET ERROR:", err)
    return res.status(500).json({ error: "Reset failed" })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password are required",
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      })
    }

    // Hash incoming raw token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({
        error: "Invalid or expired token",
      })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    })

    // Delete token after use
    await prisma.passwordResetToken.delete({
      where: { id: resetRecord.id },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err)
    return res.status(500).json({
      error: "Failed to reset password",
    })
  }
}