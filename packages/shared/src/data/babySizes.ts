export interface BabySize {
  week: number;
  emoji: string;
  size: string;
  lengthCm: number;
  weightG: number;
}

export const babySizes: BabySize[] = [
  { week: 4, emoji: '🌰', size: 'Poppy seed', lengthCm: 0.1, weightG: 0 },
  { week: 5, emoji: '🫘', size: 'Sesame seed', lengthCm: 0.2, weightG: 0 },
  { week: 6, emoji: '🫐', size: 'Lentil', lengthCm: 0.4, weightG: 0 },
  { week: 7, emoji: '🫐', size: 'Blueberry', lengthCm: 1.0, weightG: 1 },
  { week: 8, emoji: '🫒', size: 'Raspberry', lengthCm: 1.6, weightG: 1 },
  { week: 9, emoji: '🍇', size: 'Grape', lengthCm: 2.3, weightG: 2 },
  { week: 10, emoji: '🍈', size: 'Kumquat', lengthCm: 3.1, weightG: 4 },
  { week: 11, emoji: '🍓', size: 'Strawberry', lengthCm: 4.1, weightG: 7 },
  { week: 12, emoji: '🍋', size: 'Lime', lengthCm: 5.4, weightG: 14 },
  { week: 13, emoji: '🍋', size: 'Lemon', lengthCm: 7.4, weightG: 23 },
  { week: 14, emoji: '🍑', size: 'Peach', lengthCm: 8.7, weightG: 43 },
  { week: 15, emoji: '🍎', size: 'Apple', lengthCm: 10.1, weightG: 70 },
  { week: 16, emoji: '🥑', size: 'Avocado', lengthCm: 11.6, weightG: 100 },
  { week: 17, emoji: '🍐', size: 'Pear', lengthCm: 13.0, weightG: 140 },
  { week: 18, emoji: '🫑', size: 'Bell pepper', lengthCm: 14.2, weightG: 190 },
  { week: 19, emoji: '🥭', size: 'Mango', lengthCm: 15.3, weightG: 240 },
  { week: 20, emoji: '🍌', size: 'Banana', lengthCm: 16.4, weightG: 300 },
  { week: 21, emoji: '🥕', size: 'Carrot', lengthCm: 26.7, weightG: 360 },
  { week: 22, emoji: '🌽', size: 'Corn cob', lengthCm: 27.8, weightG: 430 },
  { week: 23, emoji: '🥭', size: 'Large mango', lengthCm: 28.9, weightG: 501 },
  { week: 24, emoji: '🌽', size: 'Ear of corn', lengthCm: 30.0, weightG: 600 },
  { week: 25, emoji: '🥦', size: 'Cauliflower', lengthCm: 34.6, weightG: 660 },
  { week: 26, emoji: '🥬', size: 'Lettuce head', lengthCm: 35.6, weightG: 760 },
  { week: 27, emoji: '🥒', size: 'Cucumber', lengthCm: 36.6, weightG: 875 },
  { week: 28, emoji: '🍆', size: 'Eggplant', lengthCm: 37.6, weightG: 1005 },
  { week: 29, emoji: '🎃', size: 'Acorn squash', lengthCm: 38.6, weightG: 1153 },
  { week: 30, emoji: '🥥', size: 'Coconut', lengthCm: 39.9, weightG: 1319 },
  { week: 31, emoji: '🍍', size: 'Pineapple', lengthCm: 41.1, weightG: 1502 },
  { week: 32, emoji: '🎃', size: 'Squash', lengthCm: 42.4, weightG: 1702 },
  { week: 33, emoji: '🍈', size: 'Honeydew', lengthCm: 43.7, weightG: 1918 },
  { week: 34, emoji: '🍈', size: 'Cantaloupe', lengthCm: 45.0, weightG: 2146 },
  { week: 35, emoji: '🥥', size: 'Large coconut', lengthCm: 46.2, weightG: 2383 },
  { week: 36, emoji: '🥬', size: 'Romaine lettuce', lengthCm: 47.4, weightG: 2622 },
  { week: 37, emoji: '🥦', size: 'Swiss chard', lengthCm: 48.6, weightG: 2859 },
  { week: 38, emoji: '🍉', size: 'Mini watermelon', lengthCm: 49.8, weightG: 3083 },
  { week: 39, emoji: '🍉', size: 'Small watermelon', lengthCm: 50.7, weightG: 3288 },
  { week: 40, emoji: '🍉', size: 'Watermelon', lengthCm: 51.2, weightG: 3462 },
  { week: 41, emoji: '🎃', size: 'Small pumpkin', lengthCm: 51.5, weightG: 3597 },
  { week: 42, emoji: '🎃', size: 'Pumpkin', lengthCm: 51.7, weightG: 3685 },
];

export function getBabySizeForWeek(week: number): BabySize | null {
  const clamped = Math.max(4, Math.min(42, week));
  return babySizes.find((s) => s.week === clamped) ?? null;
}
