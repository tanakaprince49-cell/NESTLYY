import { test, expect, Page } from '@playwright/test';

// Live integration test with real Firebase auth.
// Run manually: npx playwright test tests/e2e/village-hub-live.spec.ts
// DO NOT commit credentials - this file uses env vars or is run locally only.

const EMAIL = process.env.TEST_EMAIL || '';
const PASSWORD = process.env.TEST_PASSWORD || '';

async function login(page: Page) {
  await page.goto('/');

  // Pre-seed localStorage so PrivacyScreen + SetupScreen are skipped.
  // Keys are user-scoped: {email}_key
  await page.evaluate((email) => {
    localStorage.setItem('nestly_auth_email', email);
    localStorage.setItem(`${email}_privacy_accepted`, 'true');
    localStorage.setItem(`${email}_profile_v5`, JSON.stringify({
      userName: 'E2E Tester',
      lmpDate: '2026-01-01',
      dueDate: '2026-10-08',
      isManualDueDate: false,
      pregnancyType: 'singleton',
      babies: [{ name: 'Baby', gender: 'unknown' }],
      themeColor: 'pink',
      albums: {},
      lifecycleStage: 'pregnancy',
    }));
    // Prevent CelebrationModal from appearing (it portals to body and blocks clicks)
    localStorage.setItem(`${email}_last_week_celebrated`, '99');
  }, EMAIL);

  await page.goto('/');
  // Wait for splash to finish and auth screen to appear
  await page.waitForSelector('text=Email & Password', { timeout: 15000 });
  await page.click('text=Email & Password');

  // Fill login form
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for app to load (bottom nav with Village tab)
  await page.waitForSelector('text=Village', { timeout: 20000 });
}

async function dismissModals(page: Page) {
  // CelebrationModal or other z-[200] overlays may block interaction
  // Try clicking "Continue" button or the overlay backdrop
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('.fixed.inset-0.z-\\[200\\]');
    if (await overlay.isVisible().catch(() => false)) {
      const continueBtn = page.locator('button:has-text("Continue")');
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
      } else {
        await overlay.click({ position: { x: 10, y: 10 } });
      }
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }
}

async function goToVillage(page: Page) {
  await dismissModals(page);
  await page.click('text=Village');
  // Wait for VillageHub hero to appear
  await page.waitForSelector('text=Neighborhood Nests', { timeout: 10000 });
}

test.describe('VillageHub live integration (#83)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can join a template nest and it persists after reload', async ({ page }) => {
    await goToVillage(page);

    // Find a "Join Nest" button and click it
    const joinButton = page.locator('button:has-text("Join Nest")').first();
    await joinButton.waitFor({ timeout: 5000 });
    await joinButton.click();

    // Should now show "Joined" instead
    await expect(page.locator('text=Joined').first()).toBeVisible({ timeout: 3000 });

    // Check console logs for diagnostic output
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[VillageHub]')) consoleLogs.push(msg.text());
    });

    // Go to My Nests
    await page.click('text=My Nests');
    await page.waitForSelector('h2:has-text("My Nests")', { timeout: 5000 });

    // Should have at least one nest listed (not the empty state)
    const emptyState = page.locator('text=You haven\'t joined any nests yet.');
    const nestList = page.locator('button:has-text("posts")');

    // Either we see nests or we don't see the empty message
    const hasNests = await nestList.count() > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasNests || !isEmpty).toBeTruthy();

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector('text=Village', { timeout: 15000 });
    await goToVillage(page);
    await page.click('text=My Nests');
    await page.waitForSelector('h2:has-text("My Nests")', { timeout: 5000 });

    // Should still have nests after reload
    const hasNestsAfterReload = await page.locator('button:has-text("posts")').count() > 0;
    expect(hasNestsAfterReload).toBeTruthy();
  });

  test('can create a custom nest and it appears in My Nests', async ({ page }) => {
    await goToVillage(page);

    // Capture diagnostic logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[VillageHub]')) consoleLogs.push(msg.text());
    });

    // Click the create button (+ icon in hero)
    const createButton = page.locator('button:has(svg)').filter({ has: page.locator('text=Create Your Own Nest') });
    // Try the "+" button in the hero area first
    const plusButton = page.locator('.bg-rose-800').first();
    await plusButton.click();

    // Fill the create form
    await page.waitForSelector('text=Create a Nest', { timeout: 5000 });
    await page.fill('input[placeholder="e.g. Yoga Moms"]', 'E2E Test Nest');
    await page.fill('textarea', 'Automated test nest');
    await page.click('button:has-text("Create Nest")');

    // Should navigate to nest detail
    await expect(page.locator('text=E2E Test Nest')).toBeVisible({ timeout: 5000 });

    // Check diagnostic logs were emitted
    // (logs captured after the action)
    await page.waitForTimeout(500);
    console.log('Diagnostic logs captured:', consoleLogs);

    // Go back to My Nests (back arrow in nest detail header)
    await page.locator('text=E2E Test Nest').waitFor({ timeout: 3000 });
    const backArrow = page.locator('.bg-rose-900 button').first();
    await backArrow.click();
    await page.waitForSelector('h2:has-text("My Nests")', { timeout: 5000 });

    // Custom nest should be listed
    await expect(page.locator('text=E2E Test Nest')).toBeVisible();

    // Reload and check persistence
    await page.reload();
    await page.waitForSelector('text=Village', { timeout: 15000 });
    await goToVillage(page);
    await page.click('text=My Nests');
    await page.waitForSelector('h2:has-text("My Nests")', { timeout: 5000 });
    await expect(page.locator('text=E2E Test Nest')).toBeVisible();
  });

  test('can write a post in a nest', async ({ page }) => {
    await goToVillage(page);

    // Join a template first if not already
    const joinButton = page.locator('button:has-text("Join Nest")').first();
    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click();
      await page.waitForTimeout(300);
    }

    // Go to My Nests and open the first one
    await page.click('text=My Nests');
    await page.waitForSelector('h2:has-text("My Nests")', { timeout: 5000 });

    const firstNest = page.locator('button:has-text("posts")').first();
    await firstNest.waitFor({ timeout: 5000 });
    await firstNest.click();

    // Write a post
    const postInput = page.locator('input[placeholder="Share something with the nest..."]');
    await postInput.waitFor({ timeout: 5000 });
    await postInput.fill('E2E test post - checking persistence');
    // Send button is the sibling button in the same flex container as the input
    await postInput.locator('xpath=../button').click();

    // Post should appear
    await expect(page.locator('text=E2E test post - checking persistence')).toBeVisible({ timeout: 3000 });

    // Reload and verify
    await page.reload();
    await page.waitForSelector('text=Village', { timeout: 15000 });
    await goToVillage(page);
    await page.click('text=My Nests');
    await page.waitForSelector('h2:has-text("My Nests")', { timeout: 5000 });
    await page.locator('button:has-text("posts")').first().click();
    await expect(page.locator('text=E2E test post - checking persistence')).toBeVisible({ timeout: 5000 });
  });

  test('diagnostic logs show correct auth email', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[VillageHub]')) consoleLogs.push(msg.text());
    });

    await goToVillage(page);

    // Join a nest to trigger diagnostic log
    const joinButton = page.locator('button:has-text("Join Nest")').first();
    if (await joinButton.isVisible().catch(() => false)) {
      await joinButton.click();
      await page.waitForTimeout(500);
    }

    // Check that auth email is correct in logs
    const authLogs = consoleLogs.filter(l => l.includes('auth:'));
    if (authLogs.length > 0) {
      console.log('Auth logs:', authLogs);
      const hasCorrectAuth = authLogs.some(l => l.includes(EMAIL));
      const hasNullAuth = authLogs.some(l => l.includes('auth: null'));

      expect(hasNullAuth).toBeFalsy();
      expect(hasCorrectAuth).toBeTruthy();
    }

    // Also verify localStorage directly
    const storageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('village')) keys.push(key);
      }
      return keys;
    });

    console.log('Village localStorage keys:', storageKeys);

    // Keys should be scoped with email, not "guest_"
    const guestKeys = storageKeys.filter(k => k.startsWith('guest_'));
    expect(guestKeys).toHaveLength(0);
  });
});

// Cleanup: remove test data after all tests
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page);

  // Clean up test data
  await page.evaluate(() => {
    const keysToClean: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('village')) keysToClean.push(key);
    }
    keysToClean.forEach(k => localStorage.removeItem(k));
  });

  await page.close();
});
