import React, { useState } from 'react';
import { JournalEntry } from '../../types.ts';

interface PumpingTrackerProps {
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood: string) => void;
}

export const PumpingTracker: React.FC<PumpingTrackerProps> = ({ journalEntries, onAddJournal }) => {
  const [pumpingVal, setPumpingVal] = useState('');
  const pumpingLogs = journalEntries.filter(j => j.content.startsWith('[Pumping]'));

  const handleLogPumping = () => {
    if (pumpingVal) {
      onAddJournal(`[Pumping] ${pumpingVal} ml`, 'milk');
      setPumpingVal('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <h3 className="text-xl font-serif text-pink-800">Pumping Log</h3>
        <p className="text-xs text-slate-400 font-medium">Track your pumping sessions and amounts.</p>
        <p className="text-xs text-slate-500 italic">
          Nestly provides informational support only and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <div className="flex gap-4">
          <input 
            type="number" 
            placeholder="Amount (ml)" 
            className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-200 text-sm outline-none"
            value={pumpingVal}
            onChange={(e) => setPumpingVal(e.target.value)}
          />
          <button 
            onClick={handleLogPumping}
            className="px-6 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors"
          >
            Log
          </button>
        </div>
      </div>
      {pumpingLogs.length > 0 && (
        <div className="card-premium p-6 bg-white border-2 border-slate-50">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent Pumping Sessions</h4>
          <div className="space-y-3">
            {pumpingLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-800">{log.content.replace('[Pumping] ', '')}</div>
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
