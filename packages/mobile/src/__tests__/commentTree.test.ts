// Pure-function tests for organizeComments (#266).
//
// Exercises the two-pass comment tree logic without requiring a running device,
// Firestore connection, or React Native renderer.

import type { NestComment } from '@nestly/shared';
import { organizeComments } from '../utils/commentTree';

function makeComment(overrides: Partial<NestComment> & { id: string }): NestComment {
  return {
    postId: 'post-1',
    authorUid: 'user-1',
    authorName: 'Test User',
    content: 'Hello',
    likedBy: [],
    likeCount: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('#266 organizeComments', () => {
  test('empty input returns empty array', () => {
    expect(organizeComments([])).toHaveLength(0);
  });

  test('flat list with no replyTo returns all as roots', () => {
    const comments = [
      makeComment({ id: 'a' }),
      makeComment({ id: 'b' }),
      makeComment({ id: 'c' }),
    ];
    const result = organizeComments(comments);
    expect(result).toHaveLength(3);
    result.forEach((c) => expect(c.replies).toHaveLength(0));
  });

  test('single reply attaches to correct parent', () => {
    const comments = [
      makeComment({ id: 'a' }),
      makeComment({ id: 'b', replyTo: 'a' }),
    ];
    const result = organizeComments(comments);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies![0].id).toBe('b');
  });

  test('reply with missing parent is promoted to root', () => {
    const comments = [
      makeComment({ id: 'a' }),
      makeComment({ id: 'b', replyTo: 'missing-parent' }),
    ];
    const result = organizeComments(comments);
    expect(result).toHaveLength(2);
    const ids = result.map((c) => c.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  test('two replies to same parent both appear', () => {
    const comments = [
      makeComment({ id: 'a' }),
      makeComment({ id: 'b', replyTo: 'a' }),
      makeComment({ id: 'c', replyTo: 'a' }),
    ];
    const result = organizeComments(comments);
    expect(result).toHaveLength(1);
    expect(result[0].replies).toHaveLength(2);
    const replyIds = result[0].replies!.map((r) => r.id);
    expect(replyIds).toContain('b');
    expect(replyIds).toContain('c');
  });

  test('reply order is preserved (insertion order)', () => {
    const comments = [
      makeComment({ id: 'a' }),
      makeComment({ id: 'b', replyTo: 'a' }),
      makeComment({ id: 'c', replyTo: 'a' }),
      makeComment({ id: 'd', replyTo: 'a' }),
    ];
    const result = organizeComments(comments);
    const replyIds = result[0].replies!.map((r) => r.id);
    expect(replyIds).toEqual(['b', 'c', 'd']);
  });

  test('mixed roots and replies are correctly separated', () => {
    const comments = [
      makeComment({ id: 'root-1' }),
      makeComment({ id: 'root-2' }),
      makeComment({ id: 'reply-1', replyTo: 'root-1' }),
      makeComment({ id: 'reply-2', replyTo: 'root-2' }),
    ];
    const result = organizeComments(comments);
    expect(result).toHaveLength(2);
    const root1 = result.find((c) => c.id === 'root-1')!;
    const root2 = result.find((c) => c.id === 'root-2')!;
    expect(root1.replies).toHaveLength(1);
    expect(root1.replies![0].id).toBe('reply-1');
    expect(root2.replies).toHaveLength(1);
    expect(root2.replies![0].id).toBe('reply-2');
  });
});
