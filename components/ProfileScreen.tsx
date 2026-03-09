import React, { useState } from 'react';
import { storage } from '../services/storageService.ts';
import { syncProfileToFirestore } from '../firebase.ts';

interface ProfileScreenProps {
  userUid: string | null;
  onComplete: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ userUid, onComplete }) => {
  const [name, setName] = useState(storage.getProfile()?.userName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const profile = storage.getProfile();
    if (profile) {
      const updatedProfile = { ...profile, userName: name };
      storage.saveProfile(updatedProfile);
      if (userUid) {
        await syncProfileToFirestore(userUid, updatedProfile);
      }
    }
    setLoading(false);
    onComplete();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-serif">Edit Profile</h2>
      <input 
        type="text" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        className="w-full p-4 border rounded-xl"
        placeholder="Name"
      />
      <button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full p-4 bg-rose-600 text-white rounded-xl"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
};
