
import { Achievement, FoodEntry, WaterLog, PregnancyProfile, JournalEntry, VitaminLog, Trimester } from '../types';
import { storage } from './storageService';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_meal', title: 'Nest Builder', description: 'Log your very first meal in Nestly.', icon: '🍳' },
  { id: 'water_goal', title: 'Ocean Spirit', description: 'Reach your 2000ml hydration goal in a single day.', icon: '💧' },
  { id: 'first_journal', title: 'Mindful Mama', description: 'Record your first reflection in the journal.', icon: '✍️' },
  { id: 'vitamin_pro', title: 'Vitality Queen', description: 'Log your prenatal vitamins for the first time.', icon: '✨' },
  { id: 'tri_1', title: 'Golden Start', description: 'Begin your journey in the First Trimester.', icon: '🌱' },
  { id: 'tri_2', title: 'Glow Up', description: 'Successfully reached the Second Trimester.', icon: '🌸' },
  { id: 'tri_3', title: 'Home Stretch', description: 'Welcome to the Third Trimester!', icon: '🎀' },
  { id: 'weight_log', title: 'Healthy Tracker', description: 'Log your weight to monitor baby\'s growth environment.', icon: '⚖️' },
  { id: 'ar_explorer', title: 'Visionary', description: 'Experience baby\'s size in AR for the first time.', icon: '👓' }
];

export const checkAchievements = (
  profile: PregnancyProfile | null,
  foods: FoodEntry[],
  water: WaterLog[],
  journals: JournalEntry[],
  vitamins: VitaminLog[],
  trimester: Trimester
): Achievement[] => {
  const unlockedIds = storage.getUnlockedAchievementIds();
  const newlyUnlocked: Achievement[] = [];

  const tryUnlock = (id: string) => {
    if (!unlockedIds.includes(id)) {
      const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        storage.unlockAchievement(id);
        newlyUnlocked.push(achievement);
      }
    }
  };

  // Logic checks
  if (foods.length > 0) tryUnlock('first_meal');
  
  const today = new Date().setHours(0, 0, 0, 0);
  const waterToday = water.filter(w => new Date(w.timestamp).setHours(0, 0, 0, 0) === today)
                          .reduce((acc, curr) => acc + curr.amount, 0);
  if (waterToday >= 2000) tryUnlock('water_goal');

  if (journals.length > 0) tryUnlock('first_journal');
  if (vitamins.length > 0) tryUnlock('vitamin_pro');

  if (trimester === Trimester.FIRST) tryUnlock('tri_1');
  if (trimester === Trimester.SECOND) tryUnlock('tri_2');
  if (trimester === Trimester.THIRD) tryUnlock('tri_3');

  if (storage.getWeightLogs().length > 0) tryUnlock('weight_log');

  return newlyUnlocked;
};
