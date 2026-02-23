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
  // 1️⃣ Create comment
  const comment = await prisma.comment.create({
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



// A) Top-level comment → notify post owner
if (!parentCommentId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  })

  if (post && post.userId !== userId) {
    await prisma.notification.create({
      data: {
        recipientId: post.userId,
        actorId: userId,
        postId: postId,
        commentId: comment.id,
        type: "COMMENT_POST",
      },
    })
  }
}

// B) Reply → notify parent comment owner
if (parentCommentId) {
  const parentComment = await prisma.comment.findUnique({
    where: { id: parentCommentId },
    select: { userId: true, postId: true },
  })

  if (parentComment && parentComment.userId !== userId) {
    await prisma.notification.create({
      data: {
        recipientId: parentComment.userId,
        actorId: userId,
        postId: parentComment.postId,
        commentId: parentCommentId,
        type: "REPLY_COMMENT",
      },
    })
  }
}

  return comment
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
