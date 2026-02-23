import prisma from "../lib/prisma.js"

// ============================================
// GET /notifications
// ============================================
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const cursor = req.query.cursor

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            type: true,
            caption: true,
            mediaUrl: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    let nextCursor = null
    if (notifications.length > limit) {
      const next = notifications.pop()
      nextCursor = next.id
    }

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    })

    return res.json({
      items: notifications,
      nextCursor,
      unreadCount,
    })
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err)
    return res.status(500).json({
      error: "Failed to fetch notifications",
    })
  }
}

// ============================================
// PATCH /notifications/:id/read
// ============================================
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { recipientId: true },
    })

    if (!notification || notification.recipientId !== userId) {
      return res.status(404).json({
        error: "Notification not found",
      })
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("MARK READ ERROR:", err)
    return res.status(500).json({
      error: "Failed to mark notification as read",
    })
  }
}

// ============================================
// PATCH /notifications/read-all
// ============================================
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    return res.json({ success: true })
  } catch (err) {
    console.error("MARK ALL READ ERROR:", err)
    return res.status(500).json({
      error: "Failed to mark all as read",
    })
  }
}
