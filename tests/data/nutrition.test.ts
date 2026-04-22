import { describe, expect, it } from 'vitest';
import { nutritionFoods } from '../../packages/shared/src/data/nutrition.ts';

const byId = (id: string) => nutritionFoods.find(f => f.id === id);

describe('nutrition data — serving-unit convention (#335)', () => {
  it('has a non-empty serving string on every food', () => {
    for (const f of nutritionFoods) {
      expect(f.serving, `serving missing for ${f.id}`).toBeTruthy();
    }
  });

  it('keeps a gram or millilitre reference on every weight-based food', () => {
    // The UI label is for humans; the nutrition math is per-gram. Every
    // serving string must still carry an authoritative weight so an advanced
    // user can sanity-check the numbers. Eggs are counted not weighed
    // ("2 large", "2 medium") and are excluded.
    const countedById = new Set(['eggs-2', 'eggs-roadrunner']);
    for (const f of nutritionFoods) {
      if (countedById.has(f.id)) continue;
      expect(f.serving, `no g/ml reference on ${f.id}`).toMatch(/\d+\s*(g|ml)/);
    }
  });

  it('serves sadza on a side plate (3 variants)', () => {
    const ids = ['sadza-maize', 'sadza-rapoko', 'sadza-mhunga'];
    for (const id of ids) {
      const f = byId(id);
      expect(f, `${id} missing`).toBeTruthy();
      expect(f!.serving).toMatch(/side plate/i);
      expect(f!.serving).toMatch(/200g cooked/);
    }
  });

  it('serves meat portions by the palmful (beef, chicken breast, tilapia, liver)', () => {
    const ids = ['beef-lean', 'chicken-grilled', 'fish-tilapia', 'liver-beef'];
    for (const id of ids) {
      const f = byId(id);
      expect(f, `${id} missing`).toBeTruthy();
      expect(f!.serving, `${id} is not palmful`).toMatch(/palmful/i);
      expect(f!.serving).toMatch(/100g cooked/);
    }
  });

  it('serves leafy relishes by the palmful (rape, covo, tsunga, muboora, mufushwa, spinach)', () => {
    const ids = ['rape-chomolia', 'covo', 'tsunga', 'muboora', 'mufushwa', 'spinach'];
    for (const id of ids) {
      const f = byId(id);
      expect(f, `${id} missing`).toBeTruthy();
      expect(f!.serving, `${id} is not palmful cooked`).toMatch(/palmful cooked/i);
    }
  });

  it('serves dried snacks by the handful (kapenta, mopane worm, biltong)', () => {
    const ids = ['kapenta', 'mopane-worm', 'biltong'];
    for (const id of ids) {
      const f = byId(id);
      expect(f, `${id} missing`).toBeTruthy();
      expect(f!.serving, `${id} is not handful`).toMatch(/handful/i);
    }
  });

  it('leaves whole-item foods on their natural unit (fruit/vegetable "1 medium", drinks "1 cup/glass/mug/can")', () => {
    expect(byId('banana')!.serving).toMatch(/medium/);
    expect(byId('orange')!.serving).toMatch(/medium/);
    expect(byId('tomato')!.serving).toMatch(/medium/);
    expect(byId('milk-whole')!.serving).toMatch(/cup/);
    expect(byId('water')!.serving).toMatch(/glass/);
    expect(byId('tea-with-milk')!.serving).toMatch(/mug/);
    expect(byId('coca-cola')!.serving).toMatch(/can/);
  });

  it('does not leave any food with a bare gram-only serving ("100g cooked", "30g", "30g dry")', () => {
    // Before #335 these were abstract; now each has a culturally-familiar
    // prefix in front of the gram count.
    for (const f of nutritionFoods) {
      expect(f.serving, `${f.id} still uses bare grams`).not.toMatch(/^\d+g(\s|$)/);
    }
  });

  it('does not mutate nutrition numbers — only the display label changed', () => {
    // Sanity spot-check: the palmful/plate rename must not have shifted any
    // calorie/macro value. If someone edits grams later they have to edit
    // the numbers too.
    expect(byId('sadza-maize')!.calories).toBe(240);
    expect(byId('beef-lean')!.calories).toBe(220);
    expect(byId('beef-lean')!.protein).toBe(30);
    expect(byId('liver-beef')!.folate).toBe(260);
    expect(byId('liver-beef')!.iron).toBe(6.5);
    expect(byId('kapenta')!.calcium).toBe(450);
    expect(byId('rape-chomolia')!.folate).toBe(180);
    expect(byId('spinach')!.iron).toBe(6.4);
  });
});
