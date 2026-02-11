import prisma from "../lib/prisma.js"




export async function getCommentsForPost({
  postId,
  limit = 20,
  cursor,
}) {
  const comments = await prisma.comment.findMany({
    where: {
      postId,
      isRemoved: false,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  })

  let nextCursor = null
  if (comments.length > limit) {
    const next = comments.pop()
    nextCursor = next.id
  }

  return {
    items: comments,
    nextCursor,
  }
}

export async function createComment({
  postId,
  userId,
  body,
  mediaUrl,
  mediaType,
}) {
  return prisma.comment.create({
    data: {
      body,
      mediaUrl,
      mediaType,

      post: {
        connect: { id: postId },
      },

      user: {
        connect: { id: userId },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  })
}