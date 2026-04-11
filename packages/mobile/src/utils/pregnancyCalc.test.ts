import { validateLmpDate } from './pregnancyCalc';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe('validateLmpDate', () => {
  it('accepts today', () => {
    expect(validateLmpDate(new Date())).toBeNull();
  });

  it('accepts yesterday', () => {
    expect(validateLmpDate(daysAgo(1))).toBeNull();
  });

  it('accepts a date 299 days ago', () => {
    expect(validateLmpDate(daysAgo(299))).toBeNull();
  });

  it('rejects tomorrow', () => {
    const tomorrow = daysAgo(-1);
    expect(validateLmpDate(tomorrow)).toMatch(/future/i);
  });

  it('rejects a date 301 days ago', () => {
    expect(validateLmpDate(daysAgo(301))).toMatch(/42 weeks/i);
  });

  it('rejects the silently defaulted new Date("2024") from year-only input', () => {
    // new Date("2024") is a valid Date (2024-01-01), which is how the old
    // free-text parser let partial year-only input slip through. Unless we
    // are still in the 2024 window (which we are not in 2026+), this must
    // be rejected as too far in the past.
    const partial = new Date('2024');
    expect(validateLmpDate(partial)).not.toBeNull();
  });
});
