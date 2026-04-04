import { CustomPlan, PregnancyProfile, Trimester } from '../types.ts';

export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashStringToInt(input: string): number {
  // Deterministic small hash
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getPregnancyWeek(profile: PregnancyProfile, date: Date): number {
  const lmp = new Date(profile.lmpDate);
  const diffMs = date.getTime() - lmp.getTime();
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, Math.min(42, diffWeeks + 1));
}

export function getTrimesterForWeek(week: number): Trimester {
  if (week < 14) return Trimester.FIRST;
  if (week < 28) return Trimester.SECOND;
  return Trimester.THIRD;
}

function pick<T>(items: T[], seed: number, count: number): T[] {
  if (items.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(items[(seed + i) % items.length]);
  }
  return out;
}

function buildMedicalTimeline(week: number): string[] {
  const items: Array<{ from: number; to: number; text: string }> = [
    { from: 6, to: 10, text: 'Early visit: confirm dating and discuss symptoms, supplements, and any risks.' },
    { from: 10, to: 13, text: 'Common screening window: first-trimester screening options (ask your provider).' },
    { from: 18, to: 22, text: 'Anatomy scan window: detailed ultrasound (timing varies by provider).' },
    { from: 24, to: 28, text: 'Glucose screening window (common timing; confirm with your provider).' },
    { from: 28, to: 32, text: 'Third-trimester check-ins: discuss fetal movement, birth plan, and warning signs.' },
    { from: 35, to: 37, text: 'Group B strep (GBS) screening window (common timing; confirm locally).' },
    { from: 37, to: 42, text: 'Late-pregnancy plan: when to call/come in, contractions timing, and hospital bag.' },
  ];

  return items
    .filter((i) => week >= i.from && week <= i.to)
    .map((i) => i.text);
}

export function generateDailyCustomPlan(profile: PregnancyProfile, date: Date): CustomPlan {
  const dateKey = getDateKey(date);
  const week = getPregnancyWeek(profile, date);
  const trimester = getTrimesterForWeek(week);
  const diet = profile.dietPreference || 'normal';
  const seed = hashStringToInt(`${dateKey}:${diet}:${trimester}`);

  const nutritionFocusByTrimester: Record<Trimester, { nutrients: { name: string; importance: string }[]; advice: string[] }> = {
    [Trimester.FIRST]: {
      nutrients: [
        { name: 'Folate', importance: 'Supports early neural development. Aim for folate-rich foods + prenatal guidance.' },
        { name: 'Vitamin B6', importance: 'May support nausea management for some people.' },
        { name: 'Protein', importance: 'Steady energy and growth foundations.' },
        { name: 'Hydration', importance: 'Helps with fatigue and digestion.' },
      ],
      advice: [
        'If nausea is strong, try small frequent meals and bland, iron-safe foods.',
        'Pair plant iron sources with vitamin C (e.g., spinach + citrus).',
        'Keep a “safe snack” nearby to avoid long gaps.',
      ],
    },
    [Trimester.SECOND]: {
      nutrients: [
        { name: 'Iron', importance: 'Supports increased blood volume and reduces anemia risk.' },
        { name: 'Calcium', importance: 'Supports bone and muscle development.' },
        { name: 'Fiber', importance: 'Supports digestion as hormones shift.' },
        { name: 'Omega-3', importance: 'Supports brain and eye development.' },
      ],
      advice: [
        'Choose iron-rich foods and pair with vitamin C.',
        'Add fiber + water together to support digestion.',
        'Include calcium sources daily (dairy or fortified alternatives).',
      ],
    },
    [Trimester.THIRD]: {
      nutrients: [
        { name: 'Protein', importance: 'Supports rapid growth and maternal strength.' },
        { name: 'Magnesium', importance: 'May help with muscle tension and sleep comfort.' },
        { name: 'Healthy carbs', importance: 'Supports consistent energy through the day.' },
        { name: 'Hydration', importance: 'Supports swelling management and overall comfort.' },
      ],
      advice: [
        'Balance carbs with protein for steadier energy.',
        'Try lighter dinners if reflux is bothering you.',
        'Prioritize hydration earlier in the day for better sleep.',
      ],
    },
  };

  const mealIdeas = {
    normal: {
      breakfast: ['Greek yogurt + fruit', 'Eggs + whole-grain toast', 'Oatmeal + nuts', 'Smoothie with spinach + banana'],
      lunch: ['Salmon or tuna salad (check local guidance)', 'Chicken + quinoa bowl', 'Lentil soup + side salad', 'Veggie wrap + hummus'],
      dinner: ['Stir-fry with veggies + rice', 'Bean chili + avocado', 'Baked fish + sweet potato', 'Pasta + veggies + olive oil'],
      snacks: ['Fruit + nut butter', 'Cheese + crackers', 'Roasted chickpeas', 'Trail mix'],
    },
    vegan: {
      breakfast: ['Oatmeal + chia + berries', 'Tofu scramble + toast', 'Smoothie with spinach + flax', 'Peanut butter banana toast'],
      lunch: ['Lentil bowl + greens', 'Chickpea salad wrap', 'Bean soup + whole grains', 'Quinoa + roasted veggies'],
      dinner: ['Tofu stir-fry + rice', 'Bean chili + avocado', 'Lentil pasta + veggies', 'Sweet potato + black beans'],
      snacks: ['Fruit + nuts', 'Hummus + carrots', 'Roasted edamame', 'Granola bar (low sugar)'],
    },
    vegetarian: {
      breakfast: ['Greek yogurt + berries', 'Oatmeal + nuts', 'Eggs + toast', 'Smoothie + chia'],
      lunch: ['Caprese + whole grains', 'Lentil soup', 'Chickpea salad', 'Veggie burrito bowl'],
      dinner: ['Paneer/tofu curry', 'Veggie pasta', 'Bean tacos', 'Stir-fry + rice'],
      snacks: ['Fruit + yogurt', 'Cheese + fruit', 'Hummus + crackers', 'Nuts + dates'],
    },
    pescatarian: {
      breakfast: ['Oatmeal + nuts', 'Yogurt + fruit', 'Eggs + toast', 'Smoothie'],
      lunch: ['Salmon bowl', 'Tuna salad (check local guidance)', 'Lentil soup', 'Veggie wrap'],
      dinner: ['Baked fish + veggies', 'Shrimp stir-fry', 'Bean chili', 'Pasta + veggies'],
      snacks: ['Fruit + nuts', 'Greek yogurt', 'Trail mix', 'Hummus + carrots'],
    },
    'gluten-free': {
      breakfast: ['GF oats + nuts', 'Eggs + fruit', 'Yogurt + berries', 'Smoothie'],
      lunch: ['Rice bowl + protein', 'Lentil soup', 'Salad + beans', 'GF wrap + hummus'],
      dinner: ['Stir-fry + rice', 'Baked fish + potato', 'Chili', 'Quinoa + veggies'],
      snacks: ['Fruit', 'Nuts', 'Yogurt', 'Rice cakes + nut butter'],
    },
    'dairy-free': {
      breakfast: ['Oatmeal + chia', 'Smoothie + flax', 'Eggs + toast', 'Avocado toast'],
      lunch: ['Bean bowl + greens', 'Chicken/Tofu wrap', 'Lentil soup', 'Quinoa salad'],
      dinner: ['Stir-fry + rice', 'Chili', 'Baked fish/tofu + veggies', 'Pasta + veggies'],
      snacks: ['Fruit + nuts', 'Hummus + carrots', 'Roasted chickpeas', 'Granola bar'],
    },
  } as const;

  const ideas = mealIdeas[diet as keyof typeof mealIdeas] ?? mealIdeas.normal;
  const focus = nutritionFocusByTrimester[trimester];

  const conditions = (profile.conditions || '').trim();
  const conditionsSafetyExtra = conditions
    ? [`If you have conditions like “${conditions}”, confirm any plan changes with your clinician.`]
    : [];

  const medicalUpcoming = buildMedicalTimeline(week);

  return {
    id: crypto.randomUUID(),
    trimester,
    dietPreference: diet,
    timestamp: Date.now(),
    nutrition: {
      breakfast: pick(ideas.breakfast, seed, 2),
      lunch: pick(ideas.lunch, seed + 3, 2),
      dinner: pick(ideas.dinner, seed + 6, 2),
      snacks: pick(ideas.snacks, seed + 9, 2),
      nutrients: focus.nutrients,
    },
    fitness: {
      exercises: pick(
        [
          '10–20 min gentle walk',
          'Prenatal stretching (5–10 min)',
          'Pelvic floor breathing (3–5 min)',
          'Light bodyweight mobility',
          'Short guided relaxation',
        ],
        seed + 11,
        3
      ),
      safety: [
        'Stop if you feel pain, dizziness, bleeding, or shortness of breath.',
        'Avoid overheating; sip water and take breaks.',
        ...conditionsSafetyExtra,
      ],
      frequency: 'Aim for gentle movement most days (adjust to your provider’s advice).',
    },
    routine: {
      morning: pick(
        [
          'Drink a full glass of water after waking.',
          '5 minutes of deep breathing or a short stretch.',
          'Add a protein source to breakfast.',
        ],
        seed + 21,
        3
      ),
      afternoon: pick(
        [
          'Take a short walk or stand-and-stretch break.',
          'Hydration check: refill your bottle.',
          'Choose an iron- or fiber-forward snack.',
        ],
        seed + 31,
        3
      ),
      evening: pick(
        [
          'Light dinner + early wind-down if reflux is present.',
          'Screen dimming 60 minutes before bed.',
          'Quick “tomorrow prep”: snack + water ready.',
        ],
        seed + 41,
        3
      ),
    },
    medical: {
      upcoming: [
        `Pregnancy day ${Math.max(1, Math.floor((new Date(dateKey).getTime() - new Date(profile.lmpDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} • Week ${week}`,
        ...medicalUpcoming,
      ],
      questions: pick(
        [
          'What warning signs should make me call right away?',
          'What supplements should I take (and in what dose)?',
          'What is my recommended activity level this week?',
          'What tests/scans are next for me personally?',
          'Any adjustments needed for my diet preference?',
        ],
        seed + 51,
        3
      ),
    },
  };
}

