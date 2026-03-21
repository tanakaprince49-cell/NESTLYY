import React from 'react';
import { format, parseISO } from 'date-fns';
import { Moon, Sun, Edit2, Trash2, Clock } from 'lucide-react';
import { SleepLog, formatDuration, calculateDurationMinutes } from '../src/utils/sleepUtils';

interface SleepHistoryProps {
  sessions: SleepLog[];
  onEdit: (session: SleepLog) => void;
  onDelete: (id: string) => void;
}

export const SleepHistory: React.FC<SleepHistoryProps> = ({ sessions, onEdit, onDelete }) => {
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
        Recent History
      </h3>
      
      {sortedSessions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Moon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No sleep sessions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => (
            <div 
              key={session.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${session.type === 'night' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                    {session.type === 'night' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {formatDuration(calculateDurationMinutes(session.startTime, session.endTime))}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase font-bold">
                        {session.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(session.startTime), 'MMM d, h:mm a')} - {format(parseISO(session.endTime), 'h:mm a')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(session)}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(session.id)}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {session.notes && (
                <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                  "{session.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
