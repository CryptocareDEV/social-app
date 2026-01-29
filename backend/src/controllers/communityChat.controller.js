import prisma from "../lib/prisma.js"

export const getCommunityChat = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId

  const member = await prisma.communityMember.findFirst({
    where: { communityId: id, userId },
  })

  if (!member) {
    return res.status(403).json({ error: "Not a member" })
  }

  const messages = await prisma.communityChat.findMany({
    where: { communityId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { username: true },
      },
    },
  })

  res.json(messages)
}

export const postCommunityMessage = async (req, res) => {
  const { id } = req.params
  const { text } = req.body
  const userId = req.user.userId

  if (!text?.trim()) {
    return res.status(400).json({ error: "Empty message" })
  }

  const member = await prisma.communityMember.findFirst({
    where: { communityId: id, userId },
  })

  if (!member) {
    return res.status(403).json({ error: "Not a member" })
  }

  const msg = await prisma.communityChat.create({
    data: {
      communityId: id,
      userId,
      text,
    },
    include: {
      user: { select: { username: true } },
    },
  })

  res.status(201).json(msg)
}
