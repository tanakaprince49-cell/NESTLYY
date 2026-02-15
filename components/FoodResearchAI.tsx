
import React, { useState } from 'react';
import { getFoodResearch } from '../services/geminiService';
import { FoodResearchResult, FoodEntry } from '../types';

interface FoodResearchAIProps {
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
}

export const FoodResearchAI: React.FC<FoodResearchAIProps> = ({ onAddEntry }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAdded(false);
    try {
      const data = await getFoodResearch(query);
      setResult(data);
    } catch (err) {
      setError("Nestly couldn't reach the AI lab. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLog = () => {
    if (!result) return;
    onAddEntry({
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      folate: result.folate,
      iron: result.iron,
      calcium: result.calcium
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const getSafetyStyles = (rating: string) => {
    switch (rating) {
      case 'Safe': return 'bg-emerald-500 text-white';
      case 'Caution': return 'bg-amber-500 text-white';
      case 'Avoid': return 'bg-rose-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center">
        <h3 className="text-xl font-serif text-rose-800">AI Food Researcher</h3>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Research any food with Nestly AI</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border border-white shadow-md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Raw Salmon, Spinach, Papaya..."
              className="w-full pl-6 pr-14 py-5 bg-white/60 rounded-2xl text-sm outline-none shadow-inner font-medium focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              )}
            </button>
          </div>
          {error && <p className="text-[10px] text-rose-500 font-bold uppercase text-center">{error}</p>}
        </form>
      </div>

      {result && (
        <div className="glass p-8 rounded-[2.5rem] border-2 border-white shadow-xl space-y-8 animate-in zoom-in-95">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-2xl font-serif text-rose-900 leading-tight">{result.name}</h4>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">AI Lab Analysis (Per 100g)</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${getSafetyStyles(result.safetyRating)}`}>
              {result.safetyRating}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
             {[
               { label: 'Kcal', val: result.calories, color: 'text-rose-500' },
               { label: 'Protein', val: result.protein + 'g', color: 'text-emerald-600' },
               { label: 'Folate', val: result.folate + 'mcg', color: 'text-sky-600' },
               { label: 'Iron', val: result.iron + 'mg', color: 'text-rose-600' },
               { label: 'Calcium', val: result.calcium + 'mg', color: 'text-amber-600' },
             ].map((stat, i) => (
               <div key={i} className="bg-white/50 p-3 rounded-2xl border border-white text-center">
                 <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                 <span className={`text-sm font-black ${stat.color}`}>{stat.val}</span>
               </div>
             ))}
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 italic">
               <p className="text-sm text-gray-700 font-medium leading-relaxed">"{result.advice}"</p>
            </div>
            
            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Key Benefits</h5>
              <div className="grid gap-2">
                {result.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-white/60">
                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                    <span className="text-xs text-gray-600 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleAddToLog}
            disabled={added}
            className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
              added 
              ? 'bg-emerald-500 text-white' 
              : 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95'
            }`}
          >
            {added ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Added to Daily Log
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to Daily Log
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
