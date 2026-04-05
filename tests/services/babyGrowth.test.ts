import { getBabyGrowth, babyGrowthData, type DevelopmentInfo } from '../../services/babyGrowth.ts';

describe('getBabyGrowth', () => {
  it('week 4 returns Poppy Seed', () => {
    expect(getBabyGrowth(4).size).toBe('Poppy Seed');
  });

  it('week 20 returns Banana', () => {
    expect(getBabyGrowth(20).size).toBe('Banana');
  });

  it('week 40 returns Watermelon', () => {
    expect(getBabyGrowth(40).size).toBe('Watermelon');
  });

  it('week below minimum falls back to week 4', () => {
    expect(getBabyGrowth(2).size).toBe('Poppy Seed');
    expect(getBabyGrowth(0).size).toBe('Poppy Seed');
  });

  it('week between keys rounds down to nearest', () => {
    // Week 15 is between 14 (Lemon) and 16 (Avocado)
    expect(getBabyGrowth(15).size).toBe('Lemon');
  });

  it('week above maximum returns week 40', () => {
    expect(getBabyGrowth(42).size).toBe('Watermelon');
    expect(getBabyGrowth(50).size).toBe('Watermelon');
  });
});

describe('data integrity', () => {
  const weeks = Object.keys(babyGrowthData).map(Number);
  const requiredFields: (keyof DevelopmentInfo)[] = [
    'size', 'description', 'image', 'weight', 'length', 'milestones', 'connection',
  ];

  it.each(weeks)('week %d has all required fields', (week) => {
    const data = babyGrowthData[week];
    for (const field of requiredFields) {
      expect(data[field]).toBeDefined();
    }
  });

  it.each(weeks)('week %d has non-empty milestones array', (week) => {
    expect(babyGrowthData[week].milestones.length).toBeGreaterThan(0);
  });

  it('covers weeks 4 through 40', () => {
    expect(Math.min(...weeks)).toBe(4);
    expect(Math.max(...weeks)).toBe(40);
    expect(weeks.length).toBe(19);
  });
});
