import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Sparkles, 
  Heart, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  TrendingUp,
  X,
  Camera,
  Video,
  Send,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  UserPlus
} from 'lucide-react';
import { PregnancyProfile, Trimester } from '../types.ts';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth, storage } from '../firebase.ts';

interface Nest {
  id: string;
  name: string;
  description: string;
  category: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: any;
  matchingMetadata?: {
    trimester?: Trimester;
    interests?: string[];
  };
}

interface VillageHubProps {
  profile: PregnancyProfile;
}

export const VillageHub: React.FC<VillageHubProps> = ({ profile }) => {
  const [nests, setNests] = useState<Nest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNest, setActiveNest] = useState<Nest | null>(null);

  // Helper to get current weeks
  const getWeeks = () => {
    if (!profile.lmpDate) return 0;
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  };
  const weeks = getWeeks();
  const currentTrimester = weeks < 13 ? Trimester.FIRST : weeks < 27 ? Trimester.SECOND : Trimester.THIRD;

  // New Nest Form State
  const [newNest, setNewNest] = useState({
    name: '',
    description: '',
    category: 'General'
  });

  // Listen to all nests
  useEffect(() => {
    const q = query(collection(db, 'nests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Nest[];
      setNests(fetchedNests);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateNest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNest.name || !newNest.description) return;

    try {
      await addDoc(collection(db, 'nests'), {
        ...newNest,
        ownerId: auth.currentUser?.uid,
        adminIds: [auth.currentUser?.uid],
        memberIds: [auth.currentUser?.uid],
        createdAt: serverTimestamp(),
        matchingMetadata: {
          trimester: currentTrimester
        }
      });
      setShowCreateModal(false);
      setNewNest({ name: '', description: '', category: 'General' });
    } catch (err) {
      console.error("Error creating nest:", err);
    }
  };

  const joinNest = async (nestId: string) => {
    if (!auth.currentUser) return;
    try {
      const nestRef = doc(db, 'nests', nestId);
      await updateDoc(nestRef, {
        memberIds: arrayUnion(auth.currentUser.uid)
      });
    } catch (err) {
      console.error("Error joining nest:", err);
    }
  };

  // Filter & Match Logic
  const filteredNests = nests.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchedNests = nests.filter(n => 
    n.matchingMetadata?.trimester === currentTrimester
  ).slice(0, 3);

  if (activeNest) {
    return <NestDetailView nest={activeNest} profile={profile} onBack={() => setActiveNest(null)} />;
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header Section */}
      <div className="bg-rose-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
           <Users size={180} />
        </div>
        <div className="relative z-10 space-y-2">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300">Community Nests</span>
           <h2 className="text-4xl font-serif leading-tight">Your Village, <br/>{profile.userName}.</h2>
           <p className="text-sm font-medium text-rose-100 max-w-xs leading-relaxed opacity-80">
              Motherhood is better when shared. Connect with moms in your stage.
           </p>
        </div>
        <div className="flex gap-4 relative z-10 pt-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find a Nest..."
                className="w-full h-14 pl-12 pr-6 bg-rose-800/50 border-none rounded-2xl text-sm font-medium placeholder:text-rose-300/50 outline-none focus:ring-2 focus:ring-rose-400 transition-all"
              />
           </div>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="w-14 h-14 bg-white text-rose-900 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
           >
              <Plus size={24} />
           </button>
        </div>
      </div>

      {/* AI Matches */}
      {matchedNests.length > 0 && searchQuery === '' && (
        <div className="space-y-4 px-1">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Ava's Recommendations</h3>
            <Sparkles size={16} className="text-rose-400" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {matchedNests.map(nest => (
              <motion.div 
                key={nest.id}
                onClick={() => setActiveNest(nest)}
                className="min-w-[280px] bg-white p-6 rounded-[2.5rem] border-2 border-rose-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-slate-800">{nest.name}</h4>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Match: {nest.matchingMetadata?.trimester} Tri</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-6 leading-relaxed">{nest.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{nest.memberIds.length} Members</span>
                  <button className="p-2 text-rose-300 group-hover:text-rose-500 transition-colors">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Discovery Feed */}
      <div className="space-y-4 px-1">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Explore Nests</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNests.map((nest, i) => (
              <motion.div 
                key={nest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveNest(nest)}
                className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 hover:border-rose-100 transition-all group cursor-pointer shadow-sm hover:shadow-xl"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 shadow-inner group-hover:bg-rose-100 transition-colors">
                       <LayoutGrid size={24} />
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">
                       {nest.category}
                    </span>
                 </div>

                 <div className="space-y-1">
                    <h4 className="text-xl font-serif text-slate-800 group-hover:text-rose-900 transition-colors">{nest.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{nest.description}</p>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-3">
                       {nest.memberIds.slice(0, 3).map((uid, j) => (
                         <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${uid}`} alt="Member" className="w-full h-full object-cover" />
                         </div>
                       ))}
                       {nest.memberIds.length > 3 && (
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-50 flex items-center justify-center text-[8px] font-black text-rose-400">
                            +{nest.memberIds.length - 3}
                         </div>
                       )}
                    </div>
                    <button className="h-10 px-6 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all">
                       Enter Nest
                    </button>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-rose-900/40 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-rose-600" />
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif text-slate-800">Create a Nest</h3>
                  <p className="text-xs text-slate-400">Build a community for moms like you.</p>
                </div>
                <form onSubmit={handleCreateNest} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nest Name</label>
                    <input 
                      value={newNest.name}
                      onChange={e => setNewNest({...newNest, name: e.target.value})}
                      placeholder="e.g. July 2026 Mamas"
                      className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={newNest.category}
                      onChange={e => setNewNest({...newNest, category: e.target.value})}
                      className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                    >
                      <option>General Support</option>
                      <option>First Trimester</option>
                      <option>Second Trimester</option>
                      <option>Third Trimester</option>
                      <option>Newborn Journey</option>
                      <option>Mental Wellness</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={newNest.description}
                      onChange={e => setNewNest({...newNest, description: e.target.value})}
                      placeholder="What is this group about?"
                      rows={3}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500 transition-all outline-none resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full h-16 bg-rose-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-rose-900/20 active:scale-95 transition-all mt-4">
                    Initialize Nest
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===== Internal Detail View ===== */
const NestDetailView = ({ nest, profile, onBack }: { nest: Nest, profile: PregnancyProfile, onBack: () => void }) => {
  const isMember = nest.memberIds.includes(auth.currentUser?.uid || '');
  const isAdmin = nest.adminIds.includes(auth.currentUser?.uid || '') || nest.ownerId === auth.currentUser?.uid;
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{file: File, type: 'image' | 'video', preview: string} | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
     const file = e.target.files?.[0];
     if (file) {
        setSelectedMedia({
           file,
           type,
           preview: URL.createObjectURL(file)
        });
     }
  };

  const uploadMedia = async (file: File) => {
     return new Promise<string>((resolve, reject) => {
        const fileRef = ref(storage, `village/${nest.id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', 
           (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
           (error) => reject(error),
           async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
           }
        );
     });
  };

  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      where('nestId', '==', nest.id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [nest.id]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedMedia) return;
    setIsPosting(true);
    try {
      let mediaUrl = '';
      if (selectedMedia) {
         mediaUrl = await uploadMedia(selectedMedia.file);
      }

      await addDoc(collection(db, 'posts'), {
        nestId: nest.id,
        authorId: auth.currentUser?.uid,
        authorName: profile.userName || 'Mama',
        authorImage: `https://i.pravatar.cc/100?u=${auth.currentUser?.uid}`,
        content: newPostContent,
        mediaUrl,
        mediaType: selectedMedia?.type || null,
        likesCount: 0,
        commentCount: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
      setSelectedMedia(null);
      setUploadProgress(null);
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string, likedBy: string[]) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const isLiked = likedBy.includes(uid);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likedBy: isLiked ? likedBy.filter(id => id !== uid) : arrayUnion(uid),
        likesCount: isLiked ? Math.max(0, likedBy.length - 1) : likedBy.length + 1
      });
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await updateDoc(doc(db, 'posts', postId), { deleted: true });
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-1 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all">
          <X size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{nest.category}</span>
        {isAdmin && (
          <button className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 active:scale-90 transition-all">
            <ShieldCheck size={20} />
          </button>
        )}
      </div>

      {/* Nest Info Card */}
      <div className="bg-white p-10 rounded-[3rem] border-2 border-rose-50 space-y-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 text-rose-900">
           <LayoutGrid size={120} />
         </div>
         <div className="space-y-2 relative z-10">
           <h2 className="text-4xl font-serif text-slate-900 leading-tight">{nest.name}</h2>
           <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">{nest.description}</p>
         </div>
         <div className="flex items-center justify-between relative z-10 pt-4">
           {isMember ? (
             <div className="flex gap-3">
               <button className="bg-slate-50 text-slate-400 p-3 rounded-2xl"><UserPlus size={18} /></button>
               <button className="bg-slate-50 text-slate-400 p-3 rounded-2xl"><Share2 size={18} /></button>
             </div>
           ) : (
             <button className="h-12 px-8 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               Join Nest
             </button>
           )}
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{nest.memberIds.length} Members</span>
           </div>
         </div>
      </div>

      {/* Post Creator */}
      {isMember && (
        <div className="bg-white p-2 rounded-[2.5rem] border-2 border-rose-50 shadow-sm focus-within:border-rose-200 transition-all">
          <div className="flex items-center gap-4 p-4">
             <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-300 font-bold overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${auth.currentUser?.uid}`} alt="Profile" />
             </div>
             <input 
               value={newPostContent}
               onChange={e => setNewPostContent(e.target.value)}
               placeholder={`Post to ${nest.name}...`}
               className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300"
             />
          </div>
          {selectedMedia && (
            <div className="mx-4 mb-4 relative group">
               {selectedMedia.type === 'image' ? (
                 <img src={selectedMedia.preview} alt="Preview" className="w-full h-48 object-cover rounded-2xl border" />
               ) : (
                 <video src={selectedMedia.preview} className="w-full h-48 object-cover rounded-2xl border" />
               )}
               <button 
                 onClick={() => setSelectedMedia(null)}
                 className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all"
               >
                 <X size={14} />
               </button>
               {uploadProgress !== null && (
                 <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
               )}
            </div>
          )}
          <div className="flex justify-between items-center p-3 border-t border-slate-50">
             <div className="flex gap-1">
                <input 
                  type="file" 
                  id="image-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={e => handleFileSelect(e, 'image')}
                />
                <label 
                  htmlFor="image-upload"
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Camera size={18} />
                </label>

                <input 
                  type="file" 
                  id="video-upload" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={e => handleFileSelect(e, 'video')}
                />
                <label 
                  htmlFor="video-upload"
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Video size={18} />
                </label>
             </div>
             <button 
               onClick={handleCreatePost}
               disabled={isPosting || (!newPostContent && !selectedMedia)}
               className="h-12 w-12 bg-rose-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-40"
             >
                <Send size={18} />
             </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {posts.map((post, i) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[3rem] border-2 border-slate-50 overflow-hidden shadow-sm hover:shadow-xl transition-all"
          >
            <div className="p-6 sm:p-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-50">
                    <img src={post.authorImage} alt={post.authorName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-serif text-slate-900">{post.authorName}</h5>
                    <span className="text-[8px] font-black uppercase text-slate-300">
                      {post.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Now'}
                    </span>
                  </div>
                </div>
                {(isAdmin || post.authorId === auth.currentUser?.uid) && (
                  <button onClick={() => handleDeletePost(post.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {post.content}
              </p>

              {post.mediaUrl && (
                <div className="rounded-[2.5rem] overflow-hidden border border-slate-50 relative group">
                   {post.mediaType === 'video' ? (
                     <video src={post.mediaUrl} controls className="w-full h-64 object-cover" />
                   ) : (
                     <>
                       <img src={post.mediaUrl} alt="Post Media" className="w-full h-64 object-cover" />
                       <a 
                         href={post.mediaUrl} 
                         download 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500"
                       >
                         <Download size={18} />
                       </a>
                     </>
                   )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleLikePost(post.id, post.likedBy || [])}
                    className="flex items-center gap-2 group transition-all"
                  >
                    <div className={`p-3 rounded-xl transition-all ${post.likedBy?.includes(auth.currentUser?.uid) ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-400'}`}>
                      <Heart size={18} fill={post.likedBy?.includes(auth.currentUser?.uid) ? 'currentColor' : 'none'} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.likesCount || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 group transition-all">
                    <div className="p-3 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-slate-100 group-hover:text-slate-400 transition-all">
                      <MessageCircle size={18} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.commentCount || 0}</span>
                  </button>
                </div>
                <button className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-slate-100 transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {posts.length === 0 && !isPosting && (
          <div className="p-12 text-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
              <Plus size={32} />
            </div>
            <p className="text-xs text-slate-400 font-medium">Be the first to share an update!</p>
          </div>
        )}
      </div>
    </div>
  );
};
