import React, { useState } from 'react';
import { Heart, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from '../../services/storageService.ts';

interface BabyNamesProps {
  babyNames: { name: string, gender: string, rating: number }[];
  onUpdateBabyNames: () => void;
}

export const BabyNames: React.FC<BabyNamesProps> = ({ babyNames, onUpdateBabyNames }) => {
  const [newNameInput, setNewNameInput] = useState('');
  const [newNameGender, setNewNameGender] = useState('neutral');

  const handleAddName = () => {
    if (newNameInput.trim()) {
      const newNames = [...babyNames, { name: newNameInput.trim(), gender: newNameGender, rating: 0 }];
      storage.saveBabyNames(newNames);
      setNewNameInput('');
      onUpdateBabyNames();
    }
  };

  const handleRemoveName = (idx: number) => {
    const newNames = babyNames.filter((_, i) => i !== idx);
    storage.saveBabyNames(newNames);
    onUpdateBabyNames();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="relative z-10">
          <h3 className="text-2xl font-serif text-rose-800 tracking-tight">Baby Names</h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">Curate your favorite names for your little one.</p>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newNameInput} 
              onChange={e => setNewNameInput(e.target.value)} 
              placeholder="Enter a name..." 
              className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200" 
            />
            <select 
              value={newNameGender} 
              onChange={e => setNewNameGender(e.target.value)}
              className="w-32 px-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border-none focus:ring-2 focus:ring-rose-200"
            >
              <option value="neutral">Neutral</option>
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </div>
          <button 
            onClick={handleAddName}
            className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-200 hover:bg-rose-800 active:scale-[0.98] transition-all"
          >
            Add to Collection
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Favorites</h4>
          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full">{babyNames.length} Names</span>
        </div>
        
        <AnimatePresence mode="popLayout">
          {babyNames.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center space-y-3"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No names added yet</p>
            </motion.div>
          ) : (
            babyNames.map((item, idx) => (
              <motion.div 
                key={`${item.name}-${idx}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-premium p-5 bg-white border-2 border-white flex justify-between items-center shadow-sm group hover:border-rose-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    item.gender === 'boy' ? 'bg-rose-50 text-rose-500' : 
                    item.gender === 'girl' ? 'bg-rose-50 text-rose-500' : 
                    'bg-rose-50 text-rose-500'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-serif text-lg text-slate-800 leading-none mb-1">{item.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.gender}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveName(idx)}
                  className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
