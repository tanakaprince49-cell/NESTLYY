import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CheckCircle, Apple, Info, ChevronDown, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodEntry, searchNutrition, getFoodById, NutritionFood } from '@nestly/shared';
import { storage } from '../services/storageService';

interface FoodPickerProps {
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
}

type LoggedSummary = {
  name: string;
  calories: number;
  protein: number;
  explanation?: string;
};

const MAX_RECENT = 4;
const MAX_CUSTOM_NAME = 60;
const MAX_CUSTOM_CALORIES = 5000;

export const FoodPicker: React.FC<FoodPickerProps> = ({ onAddEntry }) => {
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>(() => storage.getRecentFoodPicks());
  const [loggedFood, setLoggedFood] = useState<LoggedSummary | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const successTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (successTimer.current) window.clearTimeout(successTimer.current);
  }, []);

  const matches = useMemo(() => searchNutrition(query, 8), [query]);

  const recentFoods = useMemo(
    () => recentIds.map((id) => getFoodById(id)).filter((f): f is NutritionFood => Boolean(f)),
    [recentIds],
  );

  const trimmedQuery = query.trim();
  const showCustomEntry = trimmedQuery.length > 0 && matches.length === 0;

  // Seed the custom name from the user's query when the fallback form opens,
  // so they don't retype. Track the query we seeded from so we only overwrite
  // when the query changes — not on every keystroke the user makes in the
  // custom name field.
  const lastSeededQuery = useRef<string>('');
  useEffect(() => {
    if (showCustomEntry && trimmedQuery !== lastSeededQuery.current) {
      setCustomName(trimmedQuery.slice(0, MAX_CUSTOM_NAME));
      lastSeededQuery.current = trimmedQuery;
    }
    if (!showCustomEntry) {
      lastSeededQuery.current = '';
    }
  }, [showCustomEntry, trimmedQuery]);

  const flashSuccess = (summary: LoggedSummary) => {
    setLoggedFood(summary);
    setShowSuccess(true);
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => setShowSuccess(false), 3000);
  };

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
    storage.setRecentFoodPicks(next);

    flashSuccess({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      explanation: food.explanation,
    });
    setQuery('');
    setExpandedId(null);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim().slice(0, MAX_CUSTOM_NAME);
    const kcal = Math.max(0, Math.min(MAX_CUSTOM_CALORIES, Math.round(Number(customKcal) || 0)));
    if (!name || kcal <= 0) return;

    onAddEntry({
      name,
      calories: kcal,
      protein: 0,
      folate: 0,
      iron: 0,
      calcium: 0,
    });

    flashSuccess({
      name,
      calories: kcal,
      protein: 0,
      explanation: 'Custom entry — macro values other than kcal left blank.',
    });
    setCustomName('');
    setCustomKcal('');
    setQuery('');
  };

  const toggleExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((curr) => (curr === id ? null : id));
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
            <h2 className="text-xl font-bold text-slate-900">Log a meal</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60">
              Search foods you ate today
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

        {trimmedQuery ? (
          <div className="flex flex-col gap-2 mb-4">
            {matches.length > 0 ? (
              matches.map((food) => {
                const isExpanded = expandedId === food.id;
                return (
                  <div
                    key={food.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handlePick(food)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePick(food);
                      }
                    }}
                    className="text-left bg-slate-50 hover:bg-rose-50 active:scale-[0.99] transition-all rounded-xl p-3 border border-transparent hover:border-rose-100 cursor-pointer"
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
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex gap-3 text-[10px] font-semibold text-slate-500 min-w-0">
                        <span className="whitespace-nowrap">{food.protein}g protein</span>
                        <span className="whitespace-nowrap">{food.folate}mcg folate</span>
                        <span className="whitespace-nowrap">{food.iron}mg iron</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleExpanded(food.id, e)}
                        onKeyDown={(e) => {
                          // Parent div is role="button" with its own Enter/Space
                          // handler. Click.stopPropagation is not enough — keyboard
                          // activation fires both keydown on the focused button AND
                          // a synthesized click that bubbles. Stop the keydown too
                          // so Enter on "More" only toggles the drawer.
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                          }
                        }}
                        aria-expanded={isExpanded}
                        aria-controls={`more-${food.id}`}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 transition-colors whitespace-nowrap underline-offset-2 decoration-dotted hover:underline"
                      >
                        More nutrients
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          id={`more-${food.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-3 pt-2 mt-2 border-t border-slate-200 text-[10px] font-semibold text-slate-500">
                            <span>{food.serving}</span>
                            <span>{food.calcium}mg calcium</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 italic mb-3">
                  No food matched "{trimmedQuery}". Log it as a custom entry below. We'll save the
                  name and kcal only; protein, folate, iron and calcium stay blank.
                </p>
                <form onSubmit={handleCustomSubmit} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Edit3 size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.slice(0, MAX_CUSTOM_NAME))}
                      placeholder="Food name"
                      maxLength={MAX_CUSTOM_NAME}
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-200"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 w-[14px] text-center">
                      kcal
                    </span>
                    <input
                      type="number"
                      value={customKcal}
                      onChange={(e) => setCustomKcal(e.target.value)}
                      placeholder="~200"
                      inputMode="numeric"
                      min={1}
                      max={MAX_CUSTOM_CALORIES}
                      className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-200"
                    />
                    <button
                      type="submit"
                      disabled={!customName.trim() || !(Number(customKcal) > 0)}
                      className="ml-auto px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Log it
                    </button>
                  </div>
                </form>
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
                  {loggedFood.explanation && (
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed italic">
                      {loggedFood.explanation}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2">
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                      {loggedFood.calories} kcal
                    </div>
                    {loggedFood.protein > 0 && (
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                        {loggedFood.protein}g protein
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
          <Info size={12} />
          <span>Values are WHO averages per serving. Nothing you log leaves this phone.</span>
        </div>
      </div>
    </motion.div>
  );
};
