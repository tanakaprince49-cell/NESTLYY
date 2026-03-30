import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { storage } from '../../services/storageService.ts';
import { ChecklistItem } from '../../types.ts';

interface ChecklistTrackerProps {
  checklists: { [key: string]: ChecklistItem[] };
  onUpdateChecklist: () => void;
}

export const ChecklistTracker: React.FC<ChecklistTrackerProps> = ({ checklists, onUpdateChecklist }) => {
  const [activeToolCat, setActiveToolCat] = useState<'hospital_bag' | 'birth_plan' | 'nursery' | 'general'>('hospital_bag');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const handleAddItem = () => {
    if (newChecklistItem) {
      const item: ChecklistItem = { 
        id: crypto.randomUUID(), 
        text: newChecklistItem, 
        completed: false, 
        category: activeToolCat 
      };
      storage.saveChecklistItem(item);
      setNewChecklistItem('');
      onUpdateChecklist();
    }
  };

  const handleToggleItem = (item: ChecklistItem) => {
    const updated = { ...item, completed: !item.completed };
    storage.saveChecklistItem(updated);
    onUpdateChecklist();
  };

  const handleRemoveItem = (id: string) => {
    storage.removeChecklistItem(id);
    onUpdateChecklist();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {(['hospital_bag', 'birth_plan', 'nursery', 'general'] as const).map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveToolCat(cat)}
            className={`flex-none px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeToolCat === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <h3 className="text-xl font-serif text-rose-800 capitalize">{activeToolCat.replace('_', ' ')}</h3>
        <div className="flex gap-3">
          <input 
            value={newChecklistItem} 
            onChange={e => setNewChecklistItem(e.target.value)} 
            placeholder="Add item..." 
            className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" 
          />
          <button 
            onClick={handleAddItem}
            className="px-6 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {checklists[activeToolCat]?.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggleItem(item)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-200 bg-white'}`}
                >
                  {item.completed && '✓'}
                </button>
                <span className={`text-sm font-medium ${item.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{item.text}</span>
              </div>
              <button onClick={() => handleRemoveItem(item.id)} className="text-rose-300 hover:text-rose-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
