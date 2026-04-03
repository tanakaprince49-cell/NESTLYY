import { mockLocalStorage } from '../helpers';
import type { Nest, NestPost } from '../../types.ts';

vi.mock('../../services/syncService.ts', () => ({
  syncToFirestore: vi.fn(),
}));

import { storage } from '../../services/storageService.ts';

let ls: ReturnType<typeof mockLocalStorage>;

beforeEach(() => {
  ls = mockLocalStorage();
  vi.stubGlobal('localStorage', ls);
  storage.setAuthEmail('village@test.com');
});

const makeNest = (overrides: Partial<Nest> = {}): Nest => ({
  id: crypto.randomUUID(),
  name: 'Test Nest',
  description: 'A test nest',
  category: 'general',
  emoji: '🌸',
  memberCount: 1,
  isTemplate: false,
  createdAt: Date.now(),
  ...overrides,
});

const makePost = (overrides: Partial<NestPost> = {}): NestPost => ({
  id: crypto.randomUUID(),
  nestId: 'nest-1',
  authorName: 'Test User',
  content: 'Hello!',
  likedByUser: false,
  likeCount: 0,
  timestamp: Date.now(),
  isTemplate: false,
  ...overrides,
});

describe('memberships', () => {
  it('joinNest + isNestJoined returns true', () => {
    storage.joinNest('tmpl-1');
    expect(storage.isNestJoined('tmpl-1')).toBe(true);
  });

  it('joinNest is idempotent', () => {
    storage.joinNest('tmpl-1');
    storage.joinNest('tmpl-1');
    expect(storage.getNestMemberships()).toHaveLength(1);
  });

  it('leaveNest + isNestJoined returns false', () => {
    storage.joinNest('tmpl-1');
    storage.leaveNest('tmpl-1');
    expect(storage.isNestJoined('tmpl-1')).toBe(false);
  });

  it('leaveNest on nonexistent does not throw', () => {
    expect(() => storage.leaveNest('nonexistent')).not.toThrow();
  });

  it('fresh user has empty memberships', () => {
    expect(storage.getNestMemberships()).toEqual([]);
  });
});

describe('posts', () => {
  it('addNestPost prepends to list', () => {
    const p1 = makePost({ id: 'p1', timestamp: 1 });
    const p2 = makePost({ id: 'p2', timestamp: 2 });
    storage.addNestPost(p1);
    storage.addNestPost(p2);
    const all = storage.getAllNestPosts();
    expect(all[0].id).toBe('p2');
    expect(all[1].id).toBe('p1');
  });

  it('getNestPosts filters by nestId', () => {
    storage.addNestPost(makePost({ id: 'p1', nestId: 'nest-a' }));
    storage.addNestPost(makePost({ id: 'p2', nestId: 'nest-b' }));
    expect(storage.getNestPosts('nest-a')).toHaveLength(1);
    expect(storage.getNestPosts('nest-a')[0].id).toBe('p1');
  });

  it('removeNestPost deletes by id', () => {
    storage.addNestPost(makePost({ id: 'p1' }));
    storage.addNestPost(makePost({ id: 'p2' }));
    storage.removeNestPost('p1');
    expect(storage.getAllNestPosts()).toHaveLength(1);
    expect(storage.getAllNestPosts()[0].id).toBe('p2');
  });

  it('removeNestPost on nonexistent does not throw', () => {
    expect(() => storage.removeNestPost('nonexistent')).not.toThrow();
  });
});

describe('like toggle', () => {
  it('toggles like on: false -> true, count +1', () => {
    storage.addNestPost(makePost({ id: 'p1', likedByUser: false, likeCount: 5 }));
    storage.toggleNestPostLike('p1');
    const post = storage.getAllNestPosts()[0];
    expect(post.likedByUser).toBe(true);
    expect(post.likeCount).toBe(6);
  });

  it('toggles like off: true -> false, count -1', () => {
    storage.addNestPost(makePost({ id: 'p1', likedByUser: true, likeCount: 5 }));
    storage.toggleNestPostLike('p1');
    const post = storage.getAllNestPosts()[0];
    expect(post.likedByUser).toBe(false);
    expect(post.likeCount).toBe(4);
  });

  it('toggle on nonexistent does not throw', () => {
    expect(() => storage.toggleNestPostLike('nonexistent')).not.toThrow();
  });
});

describe('custom nests', () => {
  it('addCustomNest + getCustomNests', () => {
    const nest = makeNest({ id: 'custom-1' });
    storage.addCustomNest(nest);
    expect(storage.getCustomNests()).toHaveLength(1);
    expect(storage.getCustomNests()[0].id).toBe('custom-1');
  });

  it('removeCustomNest cascades: nest + membership + posts', () => {
    const nest = makeNest({ id: 'custom-1' });
    storage.addCustomNest(nest);
    storage.joinNest('custom-1');
    storage.addNestPost(makePost({ id: 'p1', nestId: 'custom-1' }));
    storage.addNestPost(makePost({ id: 'p2', nestId: 'custom-1' }));

    storage.removeCustomNest('custom-1');

    expect(storage.getCustomNests()).toHaveLength(0);
    expect(storage.isNestJoined('custom-1')).toBe(false);
    expect(storage.getNestPosts('custom-1')).toHaveLength(0);
  });

  it('removeCustomNest does not affect other nests', () => {
    storage.addCustomNest(makeNest({ id: 'custom-1' }));
    storage.addCustomNest(makeNest({ id: 'custom-2' }));
    storage.addNestPost(makePost({ id: 'p1', nestId: 'custom-1' }));
    storage.addNestPost(makePost({ id: 'p2', nestId: 'custom-2' }));

    storage.removeCustomNest('custom-1');

    expect(storage.getCustomNests()).toHaveLength(1);
    expect(storage.getNestPosts('custom-2')).toHaveLength(1);
  });
});

describe('cross-user isolation', () => {
  it('different users have separate memberships and posts', () => {
    storage.setAuthEmail('user-a@test.com');
    storage.joinNest('tmpl-1');
    storage.addNestPost(makePost({ id: 'p1', nestId: 'tmpl-1' }));

    storage.setAuthEmail('user-b@test.com');
    expect(storage.getNestMemberships()).toEqual([]);
    expect(storage.getAllNestPosts()).toEqual([]);
  });
});
