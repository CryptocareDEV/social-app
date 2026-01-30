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

// 🔎 Load community for safety checks
const community = await prisma.community.findUnique({
  where: { id: invitation.communityId },
})

if (!community) {
  return res.status(404).json({ error: "Community not found" })
}

// 🔞 Minor safety: block NSFW community invitations
if (req.user.isMinor && community.rating === "NSFW") {
  return res.status(403).json({
    error: "Minors cannot accept invitations to NSFW communities",
  })
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

export const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.userId

    const invitations = await prisma.communityInvitation.findMany({
      where: {
        invitedUserId: userId,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            scope: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return res.json(invitations)
  } catch (err) {
    console.error("GET MY INVITATIONS ERROR:", err)
    return res
      .status(500)
      .json({ error: "Failed to load invitations" })
  }
}

export const declineInvitation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const invite = await prisma.communityInvitation.findUnique({
      where: { id },
    })

    if (!invite || invite.invitedUserId !== userId) {
      return res
        .status(404)
        .json({ error: "Invitation not found" })
    }

    if (invite.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Invitation is no longer valid" })
    }

    await prisma.communityInvitation.update({
      where: { id },
      data: { status: "DECLINED" },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("DECLINE INVITATION ERROR:", err)
    return res
      .status(500)
      .json({ error: "Failed to decline invitation" })
  }
}

