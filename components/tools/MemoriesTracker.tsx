import React from 'react';
import { storage } from '../../services/storageService.ts';
import { MemoryAlbums, MemoryPhoto } from '../../types.ts';
import { motion } from 'motion/react';
import { Camera as CameraIcon, Baby, Heart, Home, Users, Sparkles, Plus } from 'lucide-react';

interface MemoriesTrackerProps {
  albums: MemoryAlbums;
  onUpdateAlbums: () => void;
}

const ALBUM_TYPES: Array<{ id: keyof MemoryAlbums, label: string, icon: any }> = [
  { id: 'bump', label: 'Bump Photos', icon: CameraIcon },
  { id: 'baby', label: 'Baby Moments', icon: Baby },
  { id: 'ultrasound', label: 'Ultrasounds', icon: Heart },
  { id: 'nursery', label: 'Nursery', icon: Home },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'other', label: 'Other', icon: Sparkles },
];

export const MemoriesTracker: React.FC<MemoriesTrackerProps> = ({ albums, onUpdateAlbums }) => {
  const handleAddPhoto = (type: keyof MemoryAlbums) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const photo: MemoryPhoto = { 
            id: crypto.randomUUID(), 
            url: base64String, 
            timestamp: Date.now() 
          };
          storage.saveAlbumPhoto(type, photo);
          onUpdateAlbums();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALBUM_TYPES.map((album) => (
          <div key={album.id} className="card-premium p-6 bg-white border-2 border-white space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                  <album.icon size={20} />
                </div>
                <h3 className="text-lg font-serif text-slate-800">{album.label}</h3>
              </div>
              <button 
                onClick={() => handleAddPhoto(album.id)}
                className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {albums[album.id]?.length === 0 ? (
                <div className="col-span-3 py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No photos yet</p>
                </div>
              ) : (
                albums[album.id]?.slice(0, 6).map((photo) => (
                  <motion.div 
                    key={photo.id}
                    layoutId={photo.id}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group"
                  >
                    <img 
                      src={photo.url} 
                      alt="Memory" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ))
              )}
            </div>
            
            {albums[album.id]?.length > 6 && (
              <p className="text-[10px] text-center font-bold text-slate-400">
                + {albums[album.id].length - 6} more photos
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
