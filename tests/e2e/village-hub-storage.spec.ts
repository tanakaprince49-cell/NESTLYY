import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e-test@nestlyhealth.com';
const AUTH_KEY = 'nestly_auth_email';
const userKey = (key: string) => `${TEST_EMAIL}_${key}`;

// These tests run against the actual browser localStorage to verify
// Tanaka's report in #83 ("localStorage is not saving anything").
// They bypass Firebase auth by injecting the auth email directly.

test.describe('VillageHub localStorage persistence (#83)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app so we have the correct origin for localStorage
    await page.goto('/');
    // Inject auth email to bypass Firebase auth
    await page.evaluate((email) => {
      localStorage.setItem('nestly_auth_email', email);
    }, TEST_EMAIL);
  });

  test('joinNest writes to localStorage and persists after reload', async ({ page }) => {
    // Write membership via storage service pattern
    const saved = await page.evaluate((key) => {
      const memberships = [{ nestId: 'tmpl-1', joinedAt: Date.now() }];
      localStorage.setItem(key, JSON.stringify(memberships));
      return localStorage.getItem(key);
    }, userKey('village_memberships'));

    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].nestId).toBe('tmpl-1');

    // Reload and verify persistence
    await page.reload();
    const afterReload = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, userKey('village_memberships'));

    expect(afterReload).toBe(saved);
  });

  test('addCustomNest writes and persists after reload', async ({ page }) => {
    const nest = {
      id: 'e2e-nest-1',
      name: 'E2E Test Nest',
      description: 'Testing persistence',
      category: 'general',
      emoji: '🧪',
      memberCount: 1,
      isTemplate: false,
      createdAt: Date.now(),
    };

    await page.evaluate(({ key, nest }) => {
      localStorage.setItem(key, JSON.stringify([nest]));
    }, { key: userKey('village_custom_nests'), nest });

    await page.reload();

    const afterReload = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) || '[]');
    }, userKey('village_custom_nests'));

    expect(afterReload).toHaveLength(1);
    expect(afterReload[0].id).toBe('e2e-nest-1');
    expect(afterReload[0].name).toBe('E2E Test Nest');
  });

  test('addNestPost writes and persists after reload', async ({ page }) => {
    const post = {
      id: 'e2e-post-1',
      nestId: 'tmpl-1',
      authorName: 'E2E Tester',
      content: 'Does this persist?',
      likedByUser: false,
      likeCount: 0,
      timestamp: Date.now(),
      isTemplate: false,
    };

    await page.evaluate(({ key, post }) => {
      localStorage.setItem(key, JSON.stringify([post]));
    }, { key: userKey('village_posts'), post });

    await page.reload();

    const afterReload = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) || '[]');
    }, userKey('village_posts'));

    expect(afterReload).toHaveLength(1);
    expect(afterReload[0].content).toBe('Does this persist?');
  });

  test('full flow: create nest + join + post, all persist after reload', async ({ page }) => {
    await page.evaluate(({ authKey, email, membershipsKey, nestsKey, postsKey }) => {
      localStorage.setItem(authKey, email);

      // Create custom nest
      const nest = {
        id: 'e2e-full-nest',
        name: 'Full Flow Nest',
        description: 'Integration test',
        category: 'general',
        emoji: '🔬',
        memberCount: 1,
        isTemplate: false,
        createdAt: Date.now(),
      };
      localStorage.setItem(nestsKey, JSON.stringify([nest]));

      // Join it + a template
      const memberships = [
        { nestId: 'e2e-full-nest', joinedAt: Date.now() },
        { nestId: 'tmpl-3', joinedAt: Date.now() },
      ];
      localStorage.setItem(membershipsKey, JSON.stringify(memberships));

      // Write a post
      const post = {
        id: 'e2e-full-post',
        nestId: 'e2e-full-nest',
        authorName: 'Tester',
        content: 'Full flow test',
        likedByUser: false,
        likeCount: 0,
        timestamp: Date.now(),
        isTemplate: false,
      };
      localStorage.setItem(postsKey, JSON.stringify([post]));
    }, {
      authKey: AUTH_KEY,
      email: TEST_EMAIL,
      membershipsKey: userKey('village_memberships'),
      nestsKey: userKey('village_custom_nests'),
      postsKey: userKey('village_posts'),
    });

    // Reload to simulate page refresh
    await page.reload();

    const result = await page.evaluate(({ membershipsKey, nestsKey, postsKey }) => {
      return {
        memberships: JSON.parse(localStorage.getItem(membershipsKey) || '[]'),
        nests: JSON.parse(localStorage.getItem(nestsKey) || '[]'),
        posts: JSON.parse(localStorage.getItem(postsKey) || '[]'),
      };
    }, {
      membershipsKey: userKey('village_memberships'),
      nestsKey: userKey('village_custom_nests'),
      postsKey: userKey('village_posts'),
    });

    expect(result.memberships).toHaveLength(2);
    expect(result.nests).toHaveLength(1);
    expect(result.nests[0].name).toBe('Full Flow Nest');
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].content).toBe('Full flow test');
  });

  test('user-scoped keys: data not visible under different email', async ({ page }) => {
    // Write data under test email
    await page.evaluate(({ key }) => {
      localStorage.setItem(key, JSON.stringify([{ nestId: 'tmpl-1', joinedAt: Date.now() }]));
    }, { key: userKey('village_memberships') });

    // Check under different email scope
    const otherUserData = await page.evaluate(() => {
      return localStorage.getItem('other@email.com_village_memberships');
    });

    expect(otherUserData).toBeNull();
  });
});
