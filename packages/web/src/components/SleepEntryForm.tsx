import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Clock, Moon, Sun, Star } from 'lucide-react';
import { SleepLog, SleepMode, SleepQuality, getSleepType } from '@nestly/shared';

interface SleepEntryFormProps {
  onSave: (session: Partial<SleepLog>) => void;
  onClose: () => void;
  initialData?: SleepLog;
  mode: SleepMode;
}

export const SleepEntryForm: React.FC<SleepEntryFormProps> = ({ onSave, onClose, initialData, mode }) => {
  const [startTime, setStartTime] = useState(
    initialData ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [endTime, setEndTime] = useState(
    initialData ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [quality, setQuality] = useState<SleepQuality>(initialData?.quality || 'okay');
  const [note, setNote] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please enter valid dates and times.');
      return;
    }

    // Basic validation: End should not be the same as start unless it's a mistake
    if (startTime === endTime) {
      setError('Sleep start and end times cannot be identical.');
      return;
    }

    onSave({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      quality: mode === 'pregnancy' ? quality : undefined,
      notes: note,
      type: getSleepType(start.toISOString()),
      mode,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" />
            {initialData ? 'Edit Sleep' : 'Log Sleep'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Sleep Start
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Sleep End
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                required
              />
            </div>

            {mode === 'pregnancy' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Sleep Quality
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['poor', 'okay', 'good'] as SleepQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                        quality === q
                          ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any interruptions or dreams?"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all h-24 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-semibold shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all"
          >
            {initialData ? 'Update Session' : 'Save Session'}
          </button>
        </form>
      </div>
    </div>
  );
};
