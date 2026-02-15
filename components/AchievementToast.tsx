
import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed inset-x-4 top-24 z-[500] flex justify-center transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
      <div className="glass p-1 rounded-[2.5rem] border-2 border-white shadow-[0_20px_50px_rgba(244,63,94,0.2)] max-w-sm w-full relative overflow-hidden">
        {/* Animated Background Confetti Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="absolute animate-bounce" 
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                fontSize: '12px'
              }}
            >
              ✨
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-6 rounded-[2.3rem] flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/30 animate-pulse">
            {achievement.icon}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">New Milestone Unlocked!</p>
            <h4 className="text-xl font-serif leading-tight mb-1">{achievement.title}</h4>
            <p className="text-[11px] font-medium opacity-90 leading-tight">{achievement.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
