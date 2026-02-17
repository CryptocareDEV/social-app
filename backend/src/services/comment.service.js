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
      parentCommentId: null, // only top-level
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
      _count: {
        select: { replies: true },
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
  parentCommentId = null,
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

      ...(parentCommentId && {
        parent: {
          connect: { id: parentCommentId },
        },
      }),
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



export async function getRepliesForComment({
  parentCommentId,
  limit = 10,
  cursor,
}) {
  const replies = await prisma.comment.findMany({
    where: {
      parentCommentId,
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
      _count: {
        select: { replies: true },
      },
    },
  })

  let nextCursor = null
  if (replies.length > limit) {
    const next = replies.pop()
    nextCursor = next.id
  }

  return {
    items: replies,
    nextCursor,
  }
}
