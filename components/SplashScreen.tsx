import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo.tsx';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-rose-50"
          style={{ maxWidth: 'var(--app-width)', margin: '0 auto' }}
        >
          {/* Background Decorative Elements */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.05 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--rose-main)_0%,_transparent_70%)]"
          />
          
          <div className="relative flex flex-col items-center">
            {/* Animated Logo Container */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.2
              }}
              className="relative mb-8"
            >
              <Logo className="w-32 h-32" />
              
              {/* Pulse Effect */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0, 0.2]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-rose-200 rounded-[30%] -z-10 blur-xl"
              />
            </motion.div>

            {/* Text Content */}
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-5xl font-serif text-rose-900 tracking-tight"
              >
                Nestly
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1, delay: 1 }}
                className="flex items-center gap-3"
              >
                <div className="h-[1px] w-8 bg-rose-900" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-900">
                  Pregnancy Companion
                </span>
                <div className="h-[1px] w-8 bg-rose-900" />
              </motion.div>
            </div>
          </div>

          {/* Bottom Loading Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-16 flex flex-col items-center gap-4"
          >
            <div className="w-48 h-[2px] bg-rose-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-full h-full bg-gradient-to-r from-transparent via-rose-500 to-transparent"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-300 animate-pulse">
              Preparing your journey
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
