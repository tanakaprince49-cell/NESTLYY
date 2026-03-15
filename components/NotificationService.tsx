
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService.ts';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'reminder' | 'milestone';
}

export const NotificationService: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    // Simulated daily checks
    const checkReminders = () => {
      const today = new Date().setHours(0, 0, 0, 0);
      const newNotifs: Notification[] = [];
      
      // Check vitamins
      const vitamins = storage.getVitamins();
      const hasTakenVitamin = vitamins.some(v => new Date(v.timestamp).setHours(0, 0, 0, 0) === today);
      if (!hasTakenVitamin) {
        newNotifs.push({
          id: 'vitamins-' + today,
          title: 'Daily Reminder',
          message: 'Don’t forget to take your prenatal vitamins today! 💊',
          type: 'reminder'
        });
      }

      // Check water
      const water = storage.getWaterLogs();
      const waterToday = water.filter(w => new Date(w.timestamp).setHours(0, 0, 0, 0) === today)
                              .reduce((acc, curr) => acc + curr.amount, 0);
      if (waterToday < 1000) {
        newNotifs.push({
          id: 'water-' + today,
          title: 'Hydration Check',
          message: 'Remember to drink water! Aim for 2L daily for a happy baby. 💧',
          type: 'reminder'
        });
      }

      // Milestone check
      const profile = storage.getProfile();
      if (profile) {
        const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
        const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
        if (weeks % 4 === 0 && weeks > 0) {
          newNotifs.push({
            id: 'milestone-' + weeks,
            title: 'Amazing Progress!',
            message: `You are now ${weeks} weeks pregnant. Your baby is growing fast! 🎉`,
            type: 'milestone'
          });
        }
      }

      if (newNotifs.length > 0) {
        setNotifications(prev => [...prev, ...newNotifs].slice(-3));
      }
    };

    // Check on load and then every few minutes for simulation
    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 60); // Every hour
    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[300] space-y-3 pointer-events-none">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-rose-100 flex gap-4 animate-in slide-in-from-top-full duration-500 pointer-events-auto"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'milestone' ? 'bg-amber-100 text-amber-500' : 'bg-rose-100 text-rose-500'}`}>
            {n.type === 'milestone' ? '✨' : '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-800 mb-0.5">{n.title}</h4>
            <p className="text-xs text-gray-600 font-medium leading-tight">{n.message}</p>
          </div>
          <button 
            onClick={() => removeNotification(n.id)}
            className="text-gray-300 hover:text-gray-500 active:scale-90 transition-all p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
};
