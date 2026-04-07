import { mockLocalStorage } from '../helpers';
import type { Nest, NestPost } from '../../packages/shared/src/types.ts';

vi.mock('../../packages/shared/src/services/syncService.ts', () => ({
  syncToFirestore: vi.fn(),
}));

import { storage } from '../../packages/web/src/services/storageService.ts';

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
  creatorUid: null,
  ...overrides,
});

const makePost = (overrides: Partial<NestPost> = {}): NestPost => ({
  id: crypto.randomUUID(),
  nestId: 'nest-1',
  authorUid: 'user-1',
  authorName: 'Test User',
  content: 'Hello!',
  likedBy: [],
  likeCount: 0,
  commentCount: 0,
  createdAt: Date.now(),
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
    const p1 = makePost({ id: 'p1', createdAt: 1 });
    const p2 = makePost({ id: 'p2', createdAt: 2 });
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
    storage.addNestPost(makePost({ id: 'p1', likeCount: 5 }));
    storage.toggleNestPostLike('p1', 'user-1');
    const post = storage.getAllNestPosts()[0];
    expect(post.likedBy.includes('user-1')).toBe(true);
    expect(post.likeCount).toBe(6);
  });

  it('toggles like off: true -> false, count -1', () => {
    storage.addNestPost(makePost({ id: 'p1', likeCount: 5, likedBy: ['user-1'] }));
    storage.toggleNestPostLike('p1', 'user-1');
    const post = storage.getAllNestPosts()[0];
    expect(post.likedBy.includes('user-1')).toBe(false);
    expect(post.likeCount).toBe(4);
  });

  it('likeCount does not go below zero', () => {
    storage.addNestPost(makePost({ id: 'p1', likeCount: 0, likedBy: ['user-1'] }));
    storage.toggleNestPostLike('p1', 'user-1');
    const post = storage.getAllNestPosts()[0];
    expect(post.likedBy.includes('user-1')).toBe(false);
    expect(post.likeCount).toBe(0);
  });

  it('toggle on nonexistent does not throw', () => {
    expect(() => storage.toggleNestPostLike('nonexistent', 'user-1')).not.toThrow();
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

describe('Tanaka repro: persistence after navigation (#83)', () => {
  it('custom nest persists after simulated re-render (create -> exit -> come back)', () => {
    // Simulate: user creates nest
    const nest = makeNest({ id: 'my-nest', name: 'My Nest' });
    storage.addCustomNest(nest);
    storage.joinNest(nest.id);

    // Simulate: user navigates away and comes back (fresh read from storage)
    const memberships = storage.getNestMemberships();
    const customNests = storage.getCustomNests();
    const joinedIds = new Set(memberships.map(m => m.nestId));
    const joinedNests = customNests.filter(n => joinedIds.has(n.id));

    expect(joinedNests).toHaveLength(1);
    expect(joinedNests[0].id).toBe('my-nest');
    expect(joinedNests[0].name).toBe('My Nest');
  });

  it('template join persists after simulated re-render', () => {
    storage.joinNest('tmpl-1');
    storage.joinNest('tmpl-3');

    // Simulate: fresh read
    const memberships = storage.getNestMemberships();
    const joinedIds = new Set(memberships.map(m => m.nestId));

    expect(joinedIds.has('tmpl-1')).toBe(true);
    expect(joinedIds.has('tmpl-3')).toBe(true);
    expect(memberships).toHaveLength(2);
  });

  it('post persists in nest after simulated re-render', () => {
    storage.joinNest('tmpl-1');
    storage.addNestPost(makePost({ id: 'p1', nestId: 'tmpl-1', content: 'Hello world' }));

    // Simulate: fresh read
    const posts = storage.getNestPosts('tmpl-1');
    expect(posts).toHaveLength(1);
    expect(posts[0].content).toBe('Hello world');
  });

  it('data persists across auth re-read (simulates page refresh)', () => {
    // User creates data
    const nest = makeNest({ id: 'refresh-nest' });
    storage.addCustomNest(nest);
    storage.joinNest('refresh-nest');
    storage.joinNest('tmpl-2');
    storage.addNestPost(makePost({ id: 'rp1', nestId: 'refresh-nest' }));

    // Simulate page refresh: re-set same auth email, read everything fresh
    storage.setAuthEmail('village@test.com');

    expect(storage.getCustomNests()).toHaveLength(1);
    expect(storage.getNestMemberships()).toHaveLength(2);
    expect(storage.getNestPosts('refresh-nest')).toHaveLength(1);
    expect(storage.isNestJoined('tmpl-2')).toBe(true);
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
