import React, { useState } from 'react';
import { Pill, Activity, Trash2 } from 'lucide-react';
import { MedicationLog } from '@nestly/shared';
import { motion, AnimatePresence } from 'motion/react';

interface MedicationTrackerProps {
  medicationLogs: MedicationLog[];
  onAddMedication: (log: Omit<MedicationLog, 'id' | 'timestamp'>) => void;
  onRemoveMedication: (id: string) => void;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({ 
  medicationLogs, onAddMedication, onRemoveMedication 
}) => {
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <Pill size={24} />
          </div>
          <div>
            <h3 className="text-xl font-serif text-rose-800">Medication Log</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Track your pregnancy safe meds</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 italic">
          Track your medications with Nestly.
        </p>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Medication Name</label>
            <input 
              value={medName}
              onChange={e => setMedName(e.target.value)}
              placeholder="e.g. Prenatal Vitamin, Tylenol"
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Dosage</label>
            <input 
              value={medDosage}
              onChange={e => setMedDosage(e.target.value)}
              placeholder="e.g. 500mg"
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Reminder Time</label>
            <input 
              type="time"
              value={medTime}
              onChange={e => setMedTime(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200 transition-all"
            />
          </div>
          <button 
            onClick={() => {
              if (medName.trim() && medDosage.trim()) {
                onAddMedication({ name: medName.trim(), dosage: medDosage.trim(), time: medTime });
                setMedName('');
                setMedDosage('');
                setMedTime('');
              }
            }}
            className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-200 hover:bg-rose-800 active:scale-[0.98] transition-all"
          >
            Log Medication
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Logs</h4>
          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full">{medicationLogs.length} Total</span>
        </div>

        <AnimatePresence mode="popLayout">
          {medicationLogs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center space-y-3"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No medications logged yet</p>
            </motion.div>
          ) : (
            medicationLogs.map((log) => (
              <motion.div 
                key={log.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card-premium p-5 bg-white border-2 border-white flex justify-between items-center group hover:border-rose-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <Activity size={18} />
                  </div>
                  <div>
                    <div className="font-serif text-lg text-slate-800 leading-none mb-1">{log.name}</div>
                    <div className="text-[10px] font-bold text-slate-400">{log.dosage} {log.time && `• ${log.time}`}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                    {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                  <button 
                    onClick={() => onRemoveMedication(log.id)}
                    className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
