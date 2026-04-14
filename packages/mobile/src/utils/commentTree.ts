import type { NestComment } from '@nestly/shared';

export function organizeComments(flat: NestComment[]): NestComment[] {
  const commentMap = new Map<string, NestComment>();
  const rootComments: NestComment[] = [];

  flat.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  flat.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!;
    if (comment.replyTo) {
      const parentComment = commentMap.get(comment.replyTo);
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}
