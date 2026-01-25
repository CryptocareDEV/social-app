import prisma from "../lib/prisma.js"

export const acceptInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    if (invitation.invitedUserId !== userId) {
      return res.status(403).json({ error: "Not your invitation" })
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation already handled" })
    }

    await prisma.$transaction(async (tx) => {
      await tx.communityMember.create({
        data: {
          communityId: invitation.communityId,
          userId,
          role: "MEMBER",
        },
      })

      await tx.communityInvitation.update({
        where: { id: invitationId },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      })
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to accept invitation" })
  }
}

export const declineInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    if (invitation.invitedUserId !== userId) {
      return res.status(403).json({ error: "Not your invitation" })
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation already handled" })
    }

    await prisma.communityInvitation.update({
      where: { id: invitationId },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
      },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to decline invitation" })
  }
}
