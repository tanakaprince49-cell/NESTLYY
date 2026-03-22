import React, { useState } from 'react';
import { JournalEntry } from '../../types.ts';

interface TeethingTrackerProps {
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood: string) => void;
}

export const TeethingTracker: React.FC<TeethingTrackerProps> = ({ journalEntries, onAddJournal }) => {
  const [teethingInput, setTeethingInput] = useState('');
  const teethingLogs = journalEntries.filter(j => j.content.startsWith('[Teething]'));

  const handleLogTeething = () => {
    if (teethingInput) {
      onAddJournal(`[Teething] ${teethingInput}`, 'tooth');
      setTeethingInput('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <h3 className="text-xl font-serif text-yellow-800">Teething Tracker</h3>
        <p className="text-xs text-slate-400 font-medium">Log teething symptoms and milestones.</p>
        <p className="text-xs text-slate-500 italic">
          Track your baby's teething milestones with Nestly.
        </p>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Symptoms or tooth spotted..." 
            className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-yellow-200 text-sm outline-none"
            value={teethingInput}
            onChange={(e) => setTeethingInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogTeething()}
          />
          <button 
            onClick={handleLogTeething}
            className="px-6 bg-yellow-500 text-white rounded-2xl font-bold shadow-lg shadow-yellow-200 hover:bg-yellow-600 transition-colors"
          >
            Log
          </button>
        </div>
      </div>
      {teethingLogs.length > 0 && (
        <div className="card-premium p-6 bg-white border-2 border-slate-50">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent Teething Logs</h4>
          <div className="space-y-3">
            {teethingLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-800">{log.content.replace('[Teething] ', '')}</div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
