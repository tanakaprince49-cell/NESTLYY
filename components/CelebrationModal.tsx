import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Heart, Star, Baby } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: number;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose, week }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-rose-900/40 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[3.5rem] p-12 w-full max-w-sm relative z-10 shadow-2xl overflow-hidden text-center"
          >
             {/* Decorative Sparkles */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-32 -left-32 opacity-5 text-rose-300"
                >
                   <Sparkles size={300} />
                </motion.div>
             </div>

             <div className="space-y-8 relative z-10">
                <div className="flex flex-col items-center gap-6">
                   <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
                      <Baby size={48} />
                   </div>
                   <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">Milestone Reached!</span>
                      <h2 className="text-4xl font-serif text-slate-800 leading-tight">Week {week}.</h2>
                      <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">
                         A beautiful new chapter of growth for your little one.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-2">
                      <Heart className="text-rose-400" size={20} />
                      <span className="text-[10px] font-black text-rose-900/40 uppercase tracking-widest">Growing</span>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-2">
                      <Star className="text-amber-400" size={20} />
                      <span className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">Radiating</span>
                   </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full h-16 bg-rose-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-rose-900/20 active:scale-95 transition-all"
                >
                   Continue Journey
                </button>
             </div>

             <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-slate-300 hover:text-slate-500 transition-colors"
             >
                <X size={24} />
             </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
