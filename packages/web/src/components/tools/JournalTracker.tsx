import React, { useState } from 'react';
import { Sparkles, Flower, Moon, Heart, Smile, Activity, FileText, PenTool } from 'lucide-react';
import { JournalEntry } from '@nestly/shared';

interface JournalTrackerProps {
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood: string) => void;
  onRemoveJournal: (id: string) => void;
}

export const JournalTracker: React.FC<JournalTrackerProps> = ({ journalEntries, onAddJournal, onRemoveJournal }) => {
  const [journalInput, setJournalInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('sparkles');

  const handleSaveJournal = () => {
    if (journalInput.trim()) {
      onAddJournal(journalInput, selectedMood);
      setJournalInput('');
    }
  };

  const moodIcons = [
    { id: 'sparkles', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'flower', icon: Flower, color: 'text-pink-400' },
    { id: 'moon', icon: Moon, color: 'text-indigo-400' },
    { id: 'heart', icon: Heart, color: 'text-rose-500' },
    { id: 'smile', icon: Smile, color: 'text-amber-500' },
    { id: 'activity', icon: Activity, color: 'text-emerald-400' }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden rounded-3xl bg-[#fdfbf7] shadow-xl border border-rose-100 p-8">
        {/* Soft decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-100/50 text-rose-500 rounded-2xl shadow-sm rotate-3 transform">
              <PenTool size={24} />
            </span>
            <div>
              <h3 className="text-3xl font-serif text-rose-900 tracking-tight">Dear Diary...</h3>
              <p className="text-sm text-rose-400/80 italic font-serif">A beautiful space for your journey.</p>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
            {moodIcons.map(m => {
              const Icon = m.icon;
              const isSelected = selectedMood === m.id;
              return (
                <button 
                  key={m.id} 
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex-none w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-white shadow-md scale-110 -translate-y-1 border border-rose-100 ' + m.color : 'bg-slate-50/50 text-slate-300 hover:bg-white hover:scale-105'}`}
                >
                  <Icon size={isSelected ? 24 : 20} className={isSelected ? 'animate-pulse' : ''} />
                </button>
              )
            })}
          </div>
          
          <div className="relative rounded-2xl overflow-hidden border border-rose-100/50 shadow-inner bg-[#fffefa]">
            {/* Standard notebook lines */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f472b6 31px, #f472b6 32px)', marginTop: '32px' }}
            ></div>
            <textarea 
              value={journalInput}
              onChange={e => setJournalInput(e.target.value)}
              placeholder="What's on your mind today?"
              className="w-full h-48 bg-transparent border-none p-6 text-lg font-serif italic text-slate-700 resize-none focus:ring-0 transition-all outline-none leading-[32px] relative z-10 placeholder:text-rose-200"
            />
          </div>
          
          <button 
            onClick={handleSaveJournal}
            disabled={!journalInput.trim()}
            className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-white font-bold rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-rose-200 transition-all duration-300 flex justify-center items-center gap-2"
          >
            <Heart size={16} className={journalInput ? "animate-bounce" : ""} /> Save Memory
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {journalEntries.map((entry, idx) => {
          const selectedMeta = moodIcons.find(m => m.id === entry.mood);
          const MoodIcon = selectedMeta ? selectedMeta.icon : FileText;
          const iconColor = selectedMeta ? selectedMeta.color : 'text-slate-400';
          
          return (
            <div 
              key={entry.id} 
              className="group relative bg-[#fdfbf7] p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-rose-50/50"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div 
                className="absolute inset-x-0 bottom-0 top-16 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f472b6 31px, #f472b6 32px)' }}
              ></div>

              <div className="relative z-10 flex gap-6 items-start">
                <div className={`w-14 h-14 bg-white shadow-sm rounded-[1.25rem] border border-slate-50 flex items-center justify-center shrink-0 ${iconColor} transform -rotate-6 group-hover:rotate-0 transition-transform duration-500`}>
                  <MoodIcon size={28} />
                </div>
                <div className="flex-1 space-y-4 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">{new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    <button onClick={() => onRemoveJournal(entry.id)} className="text-xs text-slate-300 hover:text-rose-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                  </div>
                  <p className="text-lg text-slate-700 italic font-serif leading-[32px]">"{entry.content}"</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
