import prisma from "../lib/prisma.js"

export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    // Must be invited user
    if (invitation.invitedUserId !== userId) {
      return res.status(403).json({ error: "Not authorized to accept this invite" })
    }

    // Must be pending
    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation is no longer valid" })
    }

    // Must not be expired
    if (invitation.expiresAt < new Date()) {
      await prisma.communityInvitation.update({
        where: { id },
        data: { status: "EXPIRED" },
      })

      return res.status(400).json({ error: "Invitation has expired" })
    }

    // Create membership (idempotent safety)
    await prisma.communityMember.create({
      data: {
        communityId: invitation.communityId,
        userId,
        role: "MEMBER",
      },
    })

    // Mark invitation accepted
    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to accept invitation" })
  }
}

export const revokeInvitation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const invitation = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" })
    }

    // Only inviter can revoke
    if (invitation.invitedById !== userId) {
      return res.status(403).json({ error: "Not authorized to revoke this invite" })
    }

    // Only pending invites can be revoked
    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation cannot be revoked" })
    }

    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "REVOKED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to revoke invitation" })
  }
}


