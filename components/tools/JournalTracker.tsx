import React, { useState } from 'react';
import { Sparkles, Flower, Moon, Heart, Smile, Activity, FileText } from 'lucide-react';
import { JournalEntry } from '../../types.ts';

interface JournalTrackerProps {
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood: string) => void;
  onRemoveJournal: (id: string) => void;
}

export const JournalTracker: React.FC<JournalTrackerProps> = ({ journalEntries, onAddJournal, onRemoveJournal }) => {
  const [journalInput, setJournalInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('sparkles');

  const handleSaveJournal = () => {
    if (journalInput) {
      onAddJournal(journalInput, selectedMood);
      setJournalInput('');
    }
  };

  const moodIcons = [
    { id: 'sparkles', icon: Sparkles },
    { id: 'flower', icon: Flower },
    { id: 'moon', icon: Moon },
    { id: 'heart', icon: Heart },
    { id: 'smile', icon: Smile },
    { id: 'activity', icon: Activity }
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Parent's Reflections</h3>
        <p className="text-xs text-slate-500 italic">
          Reflect on your journey with Nestly.
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {moodIcons.map(m => (
            <button 
              key={m.id} 
              onClick={() => setSelectedMood(m.id)}
              className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedMood === m.id ? 'bg-rose-500 text-white shadow-md scale-110' : 'bg-slate-50 text-slate-400'}`}
            >
              <m.icon size={20} />
            </button>
          ))}
        </div>
        <textarea 
          value={journalInput}
          onChange={e => setJournalInput(e.target.value)}
          placeholder="How are you feeling today?"
          className="w-full h-32 bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-medium resize-none focus:bg-white transition-all shadow-inner outline-none"
        />
        <button 
          onClick={handleSaveJournal}
          className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl"
        >
          Save Reflection
        </button>
      </div>

      <div className="space-y-4">
        {journalEntries.map(entry => (
          <div key={entry.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex gap-4 items-start">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
              {entry.mood === 'sparkles' ? <Sparkles size={20} /> : 
               entry.mood === 'flower' ? <Flower size={20} /> :
               entry.mood === 'moon' ? <Moon size={20} /> :
               entry.mood === 'heart' ? <Heart size={20} /> :
               entry.mood === 'smile' ? <Smile size={20} /> :
               entry.mood === 'activity' ? <Activity size={20} /> :
               <FileText size={20} />}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</span>
                <button onClick={() => onRemoveJournal(entry.id)} className="text-[10px] text-rose-300 hover:text-rose-500 font-bold">Delete</button>
              </div>
              <p className="text-sm text-slate-700 italic font-medium leading-relaxed">"{entry.content}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
