import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CheckCircle, Apple, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodEntry, searchNutrition, getFoodById, NutritionFood } from '@nestly/shared';

interface FoodPickerProps {
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
}

const RECENT_KEY = 'recent_food_picks';
const LEGACY_KEY = 'recent_food_research';
const MAX_RECENT = 4;

function loadRecent(): string[] {
  try {
    const current = localStorage.getItem(RECENT_KEY);
    if (current) return JSON.parse(current) as string[];
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.removeItem(LEGACY_KEY);
      const names = JSON.parse(legacy) as string[];
      const ids = names
        .map((n) => searchNutrition(n, 1)[0]?.id)
        .filter((id): id is string => typeof id === 'string')
        .slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
      return ids;
    }
  } catch {
    // Fall through to empty.
  }
  return [];
}

export const FoodPicker: React.FC<FoodPickerProps> = ({ onAddEntry }) => {
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent());
  const [loggedFood, setLoggedFood] = useState<NutritionFood | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (successTimer.current) window.clearTimeout(successTimer.current);
  }, []);

  const matches = useMemo(() => searchNutrition(query, 8), [query]);

  const recentFoods = useMemo(
    () => recentIds.map((id) => getFoodById(id)).filter((f): f is NutritionFood => Boolean(f)),
    [recentIds],
  );

  const handlePick = (food: NutritionFood) => {
    onAddEntry({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      folate: food.folate,
      iron: food.iron,
      calcium: food.calcium,
    });

    const next = [food.id, ...recentIds.filter((id) => id !== food.id)].slice(0, MAX_RECENT);
    setRecentIds(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota / disabled storage.
    }

    setLoggedFood(food);
    setShowSuccess(true);
    setQuery('');
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 bg-white border-2 border-slate-50 mb-8 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 text-rose-900">
        <Apple size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
            <Search size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Food Log</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60">
              Offline pregnancy-aware nutrition picker
            </p>
          </div>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sadza, nyemba, rape, eggs..."
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-200 transition-all mb-3"
        />

        {query.trim() ? (
          <div className="flex flex-col gap-2 mb-4">
            {matches.length > 0 ? (
              matches.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handlePick(food)}
                  className="text-left bg-slate-50 hover:bg-rose-50 active:scale-[0.99] transition-all rounded-xl p-3 border border-transparent hover:border-rose-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{food.name}</div>
                      <div className="text-[11px] text-slate-500 italic line-clamp-2">
                        {food.explanation}
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-tighter text-rose-600 whitespace-nowrap">
                      {food.calories} kcal
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-semibold text-slate-500">
                    <span>{food.serving}</span>
                    <span>{food.protein}g protein</span>
                    <span>{food.folate}mcg folate</span>
                    <span>{food.iron}mg iron</span>
                    <span>{food.calcium}mg calcium</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic px-2 py-4 text-center">
                No food matched "{query}". Try sadza, kapenta, nyemba, rape, or egg.
              </div>
            )}
          </div>
        ) : recentFoods.length > 0 ? (
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Recent picks
            </div>
            <div className="flex flex-wrap gap-2">
              {recentFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handlePick(food)}
                  className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors"
                >
                  {food.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {showSuccess && loggedFood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-1 bg-rose-500 text-white rounded-full mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-900">Logged {loggedFood.name}!</p>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed italic">
                    {loggedFood.explanation}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                      {loggedFood.calories} kcal
                    </div>
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                      {loggedFood.protein}g protein
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
          <Info size={12} />
          <span>Values are WHO/USDA averages per serving; no data leaves this device.</span>
        </div>
      </div>
    </motion.div>
  );
};
