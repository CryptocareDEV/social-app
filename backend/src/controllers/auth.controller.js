import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

export const signup = async (req, res) => {
  try {
    const { email, username, password } = req.body

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

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    return res.json(user)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch user" })
  }
}
