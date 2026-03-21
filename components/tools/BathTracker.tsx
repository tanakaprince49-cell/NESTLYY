import React from 'react';
import { JournalEntry } from '../../types.ts';

interface BathTrackerProps {
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood: string) => void;
}

export const BathTracker: React.FC<BathTrackerProps> = ({ journalEntries, onAddJournal }) => {
  const bathLogs = journalEntries.filter(j => j.content.startsWith('[Bath]'));

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <h3 className="text-xl font-serif text-cyan-800">Bath Tracker</h3>
        <p className="text-xs text-slate-400 font-medium">Keep track of your baby's bath schedule.</p>
        <button 
          onClick={() => onAddJournal(`[Bath] Given a bath`, 'clean')}
          className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-600 transition-colors"
        >
          Log Bath Today
        </button>
      </div>
      {bathLogs.length > 0 && (
        <div className="card-premium p-6 bg-white border-2 border-slate-50">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent Baths</h4>
          <div className="space-y-3">
            {bathLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-800">Bath Logged</div>
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
