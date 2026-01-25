import prisma from "../lib/prisma.js"

export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId

    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      })
      return res.json({ liked: false })
    }

    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    })

    return res.json({ liked: true })
  } catch (err) {
    console.error("LIKE ERROR:", err)
    return res.status(500).json({ error: err.message })
  }
}
