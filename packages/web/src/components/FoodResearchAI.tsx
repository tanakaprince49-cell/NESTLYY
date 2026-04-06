import React, { useState } from 'react';
import { Search, Loader2, CheckCircle, Apple, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodEntry } from '@nestly/shared';

interface FoodResearchAIProps {
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
}

export const FoodResearchAI: React.FC<FoodResearchAIProps> = ({ onAddEntry }) => {
  const [foodName, setFoodName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation: string;
    calories: number;
    protein: number;
    folate: number;
    iron: number;
    calcium: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentResearch, setRecentResearch] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_food_research');
    return saved ? JSON.parse(saved) : [];
  });

  const saveToRecent = (name: string) => {
    const updated = [name, ...recentResearch.filter(r => r !== name)].slice(0, 3);
    setRecentResearch(updated);
    localStorage.setItem('recent_food_research', JSON.stringify(updated));
  };

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/food-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName }),
      });

      if (!response.ok) {
        throw new Error('Failed to research food. Please try again.');
      }

      const data = await response.json();
      setResult(data);

      // Automatically record it
      onAddEntry({
        name: foodName,
        calories: data.calories || 0,
        protein: data.protein || 0,
        folate: data.folate || 0,
        iron: data.iron || 0,
        calcium: data.calcium || 0,
      });

      saveToRecent(foodName);
      setShowSuccess(true);
      setFoodName('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <h2 className="text-xl font-bold text-slate-900">Food Research AI</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60">AI-Powered Nutrition Analysis</p>
          </div>
        </div>

        <form onSubmit={handleResearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="What did you eat today?"
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-200 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !foodName.trim()}
            className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Research'}
          </button>
        </form>

        {recentResearch.length > 0 && !loading && !showSuccess && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recentResearch.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setFoodName(item)}
                className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium mb-4"
            >
              {error}
            </motion.div>
          )}

          {showSuccess && result && (
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
                  <p className="text-sm font-bold text-rose-900">Successfully Recorded!</p>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed italic">
                    {result.explanation}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                      {result.calories} kcal
                    </div>
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                      {result.protein}g protein
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
          <Info size={12} />
          <span>Enter any food to get an instant AI analysis and automatic log.</span>
        </div>
      </div>
    </motion.div>
  );
};
