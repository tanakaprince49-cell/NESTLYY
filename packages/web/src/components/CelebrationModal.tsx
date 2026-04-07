import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  message: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  message,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm card-premium p-8 text-center"
          >
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-serif text-2xl font-bold text-[var(--nestly-burgundy)] mb-1">
              {title}
            </h2>
            <p className="text-sm font-semibold text-[var(--rose-main)] uppercase tracking-wider mb-4">
              {subtitle}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {message}
            </p>
            <button
              onClick={onClose}
              className="btn-nestly px-8 py-3 text-[10px]"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
