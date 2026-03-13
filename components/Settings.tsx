
import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { PregnancyProfile, LifecycleStage } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { syncProfileToFirestore } from '../firebase.ts';
import { Camera } from 'lucide-react';

interface SettingsProps {
  profile: PregnancyProfile;
  onUpdateProfile: (profile: PregnancyProfile) => void;
  userUid: string | null;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onUpdateProfile, userUid }) => {
  const [name, setName] = useState(profile.userName || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    const updatedProfile = { ...profile, userName: name };
    storage.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    if (userUid) {
      await syncProfileToFirestore(userUid, updatedProfile);
    }
    
    // Update local password if applicable
    const email = storage.getAuthEmail();
    if (email && password) {
      const localUsers = JSON.parse(localStorage.getItem('nestly_local_users') || '{}');
      if (localUsers[email]) {
        localUsers[email].password = password;
        localStorage.setItem('nestly_local_users', JSON.stringify(localUsers));
      }
    }
    
    setSaving(false);
    alert('Profile updated!');
    setPassword('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          const updatedProfile = { ...profile, profileImage: dataUrl };
          storage.saveProfile(updatedProfile);
          onUpdateProfile(updatedProfile);
          if (userUid) {
            syncProfileToFirestore(userUid, updatedProfile);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
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
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">Profile</h3>
          
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all"
                placeholder="Your Name"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">New Password (Optional)</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all"
                placeholder="••••••••"
              />
              <p className="text-[10px] text-slate-400 ml-2 mt-1">Only applies if you signed up with Email & Password.</p>
            </div>
          </div>

          <button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 bg-rose-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all"
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

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">App Theme</h3>
          <div className="grid grid-cols-4 gap-3">
            {(['pink', 'blue', 'neutral', 'orange', 'sage', 'lavender', 'sand', 'mint', 'sky', 'peach', 'lilac', 'stone'] as const).map(color => (
              <button
                key={color}
                onClick={() => onUpdateProfile({ ...profile, themeColor: color })}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${profile.themeColor === color ? 'border-rose-500 bg-rose-50' : 'bg-white border-slate-50'}`}
              >
                <div className={`w-6 h-6 rounded-full shadow-inner ${
                  color === 'pink' ? 'bg-rose-400' : 
                  color === 'blue' ? 'bg-blue-400' : 
                  color === 'neutral' ? 'bg-slate-400' :
                  color === 'orange' ? 'bg-orange-400' :
                  color === 'sage' ? 'bg-emerald-400' :
                  color === 'lavender' ? 'bg-purple-400' :
                  color === 'sand' ? 'bg-stone-400' :
                  color === 'mint' ? 'bg-emerald-300' :
                  color === 'sky' ? 'bg-sky-300' :
                  color === 'peach' ? 'bg-orange-300' :
                  color === 'lilac' ? 'bg-purple-300' :
                  'bg-stone-300'
                }`} />
                <span className="text-[8px] font-black uppercase tracking-widest truncate w-full text-center">{color}</span>
              </button>
            ))}
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

      <div className="card-premium p-6 space-y-4">
        <h3 className="font-bold text-slate-800">Contact Us</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          For collaborations, customer support, or just to say hello, we'd love to hear from you.
        </p>
        <a 
          href="mailto:supportnestly@gmail.com"
          className="block w-full py-4 bg-slate-50 border-2 border-rose-100/50 text-rose-900 rounded-2xl text-center active:scale-95 transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-rose-600">supportnestly@gmail.com</span>
        </a>
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
