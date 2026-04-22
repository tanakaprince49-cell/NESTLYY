
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PregnancyProfile,
  LifecycleStage,
  BabyAvatar,
} from '@nestly/shared';
import { storage } from '../services/storageService.ts';
import { APP_VERSION } from '../services/exportService.ts';
import { Camera, Plus, Trash2, Baby } from 'lucide-react';
import { DataManagementCard } from './DataManagementCard.tsx';

interface SettingsProps {
  profile: PregnancyProfile;
  onUpdateProfile: (profile: PregnancyProfile) => void;
  localUuid: string;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onUpdateProfile, localUuid: _localUuid }) => {
  const [name, setName] = useState(profile.userName || '');
  const [saving, setSaving] = useState(false);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [newBaby, setNewBaby] = useState<Partial<BabyAvatar>>({
    name: '',
    gender: 'neutral',
    skinTone: 'tone1'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddBaby = () => {
    if (!newBaby.name) return;
    const baby: BabyAvatar = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBaby.name,
      gender: newBaby.gender as any,
      skinTone: newBaby.skinTone || 'tone1',
      birthDate: new Date().toISOString().split('T')[0],
      ...newBaby
    };
    const updatedProfile = {
      ...profile,
      babies: [...(profile.babies || []), baby]
    };
    storage.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    setShowAddBaby(false);
    setNewBaby({ name: '', gender: 'neutral', skinTone: 'tone1' });
  };

  const handleRemoveBaby = (id: string) => {
    setConfirmDialog({
      message: 'Remove this baby from your tracking?',
      onConfirm: () => {
        const updatedProfile = {
          ...profile,
          babies: profile.babies.filter(b => b.id !== id)
        };
        storage.saveProfile(updatedProfile);
        onUpdateProfile(updatedProfile);
        setConfirmDialog(null);
      }
    });
  };

  const handleSaveProfile = () => {
    setSaving(true);
    const updatedProfile = { ...profile, userName: name };
    storage.saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    setSaving(false);
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
          <h3 className="font-bold text-slate-800">Dietary Preference</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'normal', label: 'Balanced' },
              { id: 'vegan', label: 'Vegan' },
              { id: 'vegetarian', label: 'Vegetarian' },
              { id: 'pescatarian', label: 'Pescatarian' },
              { id: 'gluten-free', label: 'Gluten-Free' },
              { id: 'dairy-free', label: 'Dairy-Free' }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => onUpdateProfile({ ...profile, dietPreference: d.id as any })}
                className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${profile.dietPreference === d.id ? 'bg-rose-900 border-rose-900 text-white shadow-md' : 'bg-white border-slate-50 text-slate-400'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 ml-2">This adjusts your AI-generated daily plans.</p>
        </div>

        <div className="h-px bg-slate-50" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">My Babies</h3>
            <button 
              onClick={() => setShowAddBaby(true)}
              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {profile.babies?.map(baby => (
              <div key={baby.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-400 shadow-sm">
                    <Baby size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{baby.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{baby.gender}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveBaby(baby.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {(!profile.babies || profile.babies.length === 0) && (
              <p className="text-center py-4 text-xs text-slate-400 italic">No babies added yet.</p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAddBaby && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6"
              >
                <h3 className="text-2xl font-serif text-slate-900">Add New Baby</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">Baby's Name</label>
                    <input 
                      type="text" 
                      value={newBaby.name} 
                      onChange={e => setNewBaby({ ...newBaby, name: e.target.value })} 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all"
                      placeholder="Enter name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">Gender</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['boy', 'girl', 'neutral'].map(g => (
                        <button
                          key={g}
                          onClick={() => setNewBaby({ ...newBaby, gender: g as any })}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newBaby.gender === g ? 'bg-rose-500 border-rose-400 text-white' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1">Birth Date</label>
                    <input 
                      type="date" 
                      value={newBaby.birthDate} 
                      onChange={e => setNewBaby({ ...newBaby, birthDate: e.target.value })} 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAddBaby(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddBaby}
                    className="flex-1 py-4 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all"
                  >
                    Add Baby
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
            {(['pink', 'blue', 'orange'] as const).map(color => (
              <button
                key={color}
                onClick={() => onUpdateProfile({ ...profile, themeColor: color })}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${profile.themeColor === color ? 'border-rose-500 bg-rose-50' : 'bg-white border-slate-50'}`}
              >
                <div className={`w-6 h-6 rounded-full shadow-inner ${
                  color === 'pink' ? 'bg-rose-400' : 
                  color === 'blue' ? 'bg-blue-400' : 
                  'bg-orange-400'
                }`} />
                <span className="text-[8px] font-black uppercase tracking-widest truncate w-full text-center">{color}</span>
              </button>
            ))}
          </div>
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

      <DataManagementCard profile={profile} />

      <div className="card-premium p-6 space-y-4">
        <h3 className="font-bold text-slate-800">About Nestly</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Nestly is your private, secure companion for the most important journey of your life.
          All your data stays on your device.
        </p>
        <div className="flex gap-4 pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">v{APP_VERSION}</span>
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

      {confirmDialog && (
        <div className="fixed inset-0 z-[700] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{confirmDialog.message}</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
