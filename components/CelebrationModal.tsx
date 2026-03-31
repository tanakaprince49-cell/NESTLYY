import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, Heart, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  message: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose, title, subtitle, message }) => {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 pb-4 text-center space-y-6">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-rose-500 shadow-inner"
              >
                <PartyPopper size={48} />
              </motion.div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">{subtitle}</span>
                <h3 className="text-3xl font-serif text-slate-900">{title}</h3>
              </div>

              <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100/50">
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                  "{message}"
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-rose-300">
                <Sparkles size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Love from Ava</span>
                <Sparkles size={16} />
              </div>
            </div>

            <div className="p-6">
              <button 
                onClick={onClose}
                className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
              >
                Thank You, Ava
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
