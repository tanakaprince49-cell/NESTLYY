import React from 'react';
import { Heart, Sparkles, Baby, Flower, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { JournalEntry } from '../../types.ts';

interface CalmTrackerProps {
  onAddJournal: (content: string, mood: string) => void;
  journalEntries: JournalEntry[];
}

export const CalmTracker: React.FC<CalmTrackerProps> = ({ onAddJournal, journalEntries }) => {
  const calmEntries = journalEntries.filter(j => j.content.startsWith('[Calm]'));

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-10 bg-white border-2 border-white text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-100 via-emerald-400 to-emerald-100" />
        
        <div className="space-y-2">
          <h3 className="text-2xl font-serif text-emerald-800">Peaceful Nest</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Breathe in peace, breathe out stress.</p>
        </div>
        <p className="text-xs text-slate-500 italic">
          Nestly provides informational support only and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>

        <div className="grid grid-cols-1 gap-6">
          {[
            { title: "The Safe Breath", chant: "I am safe. My baby is safe. We are held in love.", icon: Heart, color: "text-rose-400" },
            { title: "Strength Chant", chant: "My body is strong. My mind is calm. I trust the journey.", icon: Sparkles, color: "text-amber-400" },
            { title: "Connection", chant: "I am connected to my baby. We are growing together in peace.", icon: Baby, color: "text-blue-400" },
            { title: "Release", chant: "I release all tension. I embrace this moment with grace.", icon: Flower, color: "text-emerald-400" }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-slate-50 rounded-[2rem] border border-white shadow-sm space-y-3 cursor-pointer group"
              onClick={() => {
                onAddJournal(`[Calm] Chanted: ${item.chant}`, 'peace');
              }}
            >
              <div className={`flex justify-center ${item.color}`}>
                <item.icon size={32} className="group-hover:animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">{item.title}</h4>
              <p className="text-lg font-serif italic text-slate-600 leading-relaxed">"{item.chant}"</p>
              <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest pt-2">Tap to record this moment of peace</div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-5">
          <div className="text-emerald-500">
            <Activity size={32} />
          </div>
          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-relaxed text-left">
            When you feel stressed, try the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8.
          </p>
        </div>
      </div>
      
      {calmEntries.length > 0 && (
        <div className="card-premium p-6 bg-white border-2 border-slate-50">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent Calm Moments</h4>
          <div className="space-y-3">
            {calmEntries.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-800">{log.content.replace('[Calm] ', '')}</div>
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
