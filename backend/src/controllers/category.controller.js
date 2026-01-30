import prisma from "../lib/prisma.js"

/**
 * GET /api/v1/categories
 * Returns all categories
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { key: "asc" },
    })

    res.json(categories)
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err)
    res.status(500).json({ error: "Failed to fetch categories" })
  }
}

/**
 * POST /api/v1/categories
 * Create a new category (label)
 */
export const createCategory = async (req, res) => {
  try {
    const { key, scope = "GLOBAL", countryCode = null } = req.body

    if (!key || key.length < 3) {
      return res.status(400).json({
        error: "Category must be at least 3 characters",
      })
    }

    if (!["GLOBAL", "COUNTRY", "LOCAL"].includes(scope)) {
      return res.status(400).json({
        error: "Invalid category scope",
      })
    }

    if (scope === "COUNTRY" && !countryCode) {
      return res.status(400).json({
        error: "countryCode is required for COUNTRY scope",
      })
    }

    const normalized = key.toLowerCase().trim()

    const existing = await prisma.category.findUnique({
      where: { key: normalized },
    })

    if (existing) {
      return res.status(409).json({
        error: "Category already exists",
      })
    }

    const category = await prisma.category.create({
      data: {
        key: normalized,
        scope,
        countryCode,
      },
    })

    res.status(201).json(category)
  } catch (err) {
    console.error("CREATE CATEGORY ERROR:", err)
    res.status(500).json({ error: "Failed to create category" })
  }
}
