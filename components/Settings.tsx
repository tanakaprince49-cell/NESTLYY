
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PregnancyProfile, LifecycleStage } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { syncProfileToFirestore } from '../firebase.ts';

interface SettingsProps {
  profile: PregnancyProfile;
  onUpdateProfile: (profile: PregnancyProfile) => void;
  userUid: string | null;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onUpdateProfile, userUid }) => {
  const [name, setName] = useState(profile.name || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const updatedProfile = { ...profile, name };
    storage.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    if (userUid) {
      await syncProfileToFirestore(userUid, updatedProfile);
    }
    setSaving(false);
    alert('Profile updated!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-serif text-rose-900">Settings</h2>
        <p className="text-slate-400 text-sm">Customize your Nestly experience.</p>
      </div>

      <div className="card-premium p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800">Profile</h3>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full p-3 border rounded-xl text-sm"
            placeholder="Your Name"
          />
          <button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-2 bg-rose-900 text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="h-px bg-slate-50" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800">Journey Mode</h3>
              <p className="text-xs text-slate-400">
                Currently in {profile.lifecycleStage === LifecycleStage.PREGNANCY ? 'Pregnancy' : 'Newborn'} phase
              </p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl relative">
            <motion.div
              layoutId="mode-bg"
              className="absolute inset-y-1 bg-white rounded-xl shadow-sm z-0"
              style={{ 
                width: 'calc(50% - 4px)',
                left: profile.lifecycleStage === LifecycleStage.PREGNANCY ? '4px' : 'calc(50%)'
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
            <button 
              onClick={() => onUpdateProfile({ ...profile, lifecycleStage: LifecycleStage.PREGNANCY })}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${profile.lifecycleStage === LifecycleStage.PREGNANCY ? 'text-rose-900' : 'text-slate-400'}`}
            >
              Pregnancy
            </button>
            <button 
              onClick={() => onUpdateProfile({ ...profile, lifecycleStage: LifecycleStage.NEWBORN })}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${profile.lifecycleStage === LifecycleStage.NEWBORN ? 'text-rose-900' : 'text-slate-400'}`}
            >
              Newborn
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-50" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800">Push Notifications</h3>
            <p className="text-xs text-slate-400">Reminders & Guidance</p>
          </div>
          <button 
            onClick={() => onUpdateProfile({ ...profile, notificationsEnabled: !profile.notificationsEnabled })}
            className={`w-14 h-8 rounded-full transition-all relative ${profile.notificationsEnabled ? 'bg-rose-900' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${profile.notificationsEnabled ? 'right-1' : 'left-1'}`} />
          </button>
        </div>

        <div className="h-px bg-slate-50" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800">Email Updates</h3>
            <p className="text-xs text-slate-400">Daily personalized guidance</p>
          </div>
          <button 
            onClick={() => onUpdateProfile({ ...profile, emailNotifications: !profile.emailNotifications })}
            className={`w-14 h-8 rounded-full transition-all relative ${profile.emailNotifications ? 'bg-rose-900' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${profile.emailNotifications ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="card-premium p-6 space-y-4">
        <h3 className="font-bold text-slate-800">About Nestly</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Nestly is your private, secure companion for the most important journey of your life. 
          All your data stays on your device.
        </p>
        <div className="flex gap-4 pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">v1.2.0</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Secure</span>
        </div>
      </div>

      <button 
        onClick={() => {
          if (confirm('Are you sure you want to delete your account? This will permanently erase all your data from this device.')) {
            storage.deleteAccount();
            window.location.reload();
          }
        }}
        className="w-full py-4 text-rose-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-rose-600 transition-colors"
      >
        Delete My Nest
      </button>
    </motion.div>
  );
};
