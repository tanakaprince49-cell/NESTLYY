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
  UserPlus,
  Download,
  Bell,
  ArrowLeft,
  XCircle
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
  orderBy,
  limit
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
  iconUrl?: string;
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

  // New Nest Form State
  const [newNest, setNewNest] = useState({
    name: '',
    description: '',
    category: 'General Support',
    iconUrl: ''
  });

  // Helper to get current weeks
  const getWeeks = () => {
    if (!profile.lmpDate) return 0;
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  };
  const weeks = getWeeks();
  const currentTrimester = weeks < 13 ? Trimester.FIRST : weeks < 27 ? Trimester.SECOND : Trimester.THIRD;

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
      const uid = auth.currentUser?.uid;
      if (!uid) {
         alert("Please sign in to create a Nest.");
         return;
      }

      await addDoc(collection(db, 'nests'), {
        ...newNest,
        ownerId: uid,
        adminIds: [uid],
        memberIds: [uid],
        iconUrl: newNest.iconUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${newNest.name}`,
        createdAt: serverTimestamp(),
        matchingMetadata: {
          trimester: currentTrimester
        }
      });
      setShowCreateModal(false);
      setNewNest({ name: '', description: '', category: 'General Support', iconUrl: '' });
    } catch (err: any) {
      console.error("Error creating nest:", err);
      if (err.message.includes("permissions")) {
         alert(`Permission Denied! (UID: ${auth.currentUser?.uid || 'Unknown'})\n\nFix Steps:\n1. Ensure you are signed in.\n2. Copy the rules from your local firestore.rules file to your Firebase Console -> Rules tab.\n3. Make sure 'localhost' is an authorized domain in Firebase Console -> Auth.`);
      } else {
         alert(`Oops! Could not create Nest: ${err.message}`);
      }
    }
  };

  const handleJoinNest = async (nestId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const nestRef = doc(db, 'nests', nestId);
      await updateDoc(nestRef, {
        memberIds: arrayUnion(uid)
      });
    } catch (err) {
      console.error("Error joining nest:", err);
    }
  };

  const filteredNests = nests.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchedNests = nests.filter(n => 
    n.matchingMetadata?.trimester === currentTrimester
  ).slice(0, 3);

  if (activeNest) {
    return (
      <NestDetailView 
        nest={activeNest} 
        profile={profile} 
        onBack={() => setActiveNest(null)} 
        onJoin={() => handleJoinNest(activeNest.id)}
      />
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <NotificationWatcher joinedNestIds={nests.filter(n => n.memberIds.includes(auth.currentUser?.uid || '')).map(n => n.id)} />

      {/* Header Section */}
      <div className="bg-rose-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
           <Users size={180} />
        </div>
        <div className="relative z-10 space-y-2 text-center sm:text-left">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300">Community Nests</span>
           <h2 className="text-4xl font-serif leading-tight">Your Village Hub</h2>
           <p className="text-sm font-medium text-rose-100 max-w-xs mx-auto sm:mx-0 leading-relaxed opacity-80">
              Motherhood is better when shared. Connect with moms in your stage.
           </p>
        </div>
        <div className="flex gap-4 relative z-[50] pt-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" size={18} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find a Nest..."
                className="w-full h-14 pl-12 pr-6 bg-white text-black border-2 border-rose-100 rounded-2xl text-sm font-semibold placeholder:text-slate-300 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
              />
           </div>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="w-14 h-14 bg-white text-rose-900 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all focus:ring-4 focus:ring-white/20"
           >
              <Plus size={24} />
           </button>
        </div>
      </div>

      {/* Discovery Feed */}
      <div className="space-y-4 px-1">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Explore Your Hub</h3>
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
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-50 shadow-inner group-hover:border-rose-200 transition-all">
                       <img src={nest.iconUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${nest.name}`} alt={nest.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                       {nest.category}
                    </span>
                 </div>

                 <div className="space-y-1">
                    <h4 className="text-xl font-serif text-slate-800 group-hover:text-rose-900 transition-colors">{nest.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{nest.description}</p>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {nest.memberIds.slice(0, 3).map((uid, j) => (
                         <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${uid}`} alt="Member" className="w-full h-full object-cover opacity-80" />
                         </div>
                       ))}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveNest(nest); }}
                      className="h-10 px-6 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-900 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                       {nest.memberIds.includes(auth.currentUser?.uid || '') ? 'Enter Village' : 'Join Village'}
                    </button>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-0">
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
                  <h3 className="text-2xl font-serif text-slate-800">Create a Village</h3>
                  <p className="text-xs text-slate-400">Build a community for moms like you.</p>
                </div>
                <form onSubmit={handleCreateNest} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Icon URL (Optional)</label>
                    <input 
                      value={newNest.iconUrl}
                      onChange={e => setNewNest({...newNest, iconUrl: e.target.value})}
                      placeholder="e.g. Image Link"
                      className="w-full h-14 px-6 bg-white border-2 border-slate-100 rounded-2xl text-sm font-semibold text-black placeholder:text-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Village Name</label>
                    <input 
                      value={newNest.name}
                      onChange={e => setNewNest({...newNest, name: e.target.value})}
                      placeholder="e.g. July Mamas 2026"
                      className="w-full h-14 px-6 bg-white border-2 border-slate-100 rounded-2xl text-sm font-semibold text-black placeholder:text-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={newNest.category}
                      onChange={e => setNewNest({...newNest, category: e.target.value})}
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 transition-all outline-none appearance-none"
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
                      className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-semibold text-black placeholder:text-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full h-16 bg-rose-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-rose-900/20 active:scale-95 transition-all mt-4">
                    Initialize Village
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NestDetailView = ({ nest, profile, onBack, onJoin }: { nest: Nest, profile: PregnancyProfile, onBack: () => void, onJoin: () => void }) => {
  const isMember = nest.memberIds.includes(auth.currentUser?.uid || '');
  const isAdmin = nest.adminIds.includes(auth.currentUser?.uid || '') || nest.ownerId === auth.currentUser?.uid;
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{file: File, type: 'image' | 'video', preview: string} | null>(null);

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

  const handleLikePost = async (postId: string, likedBy: string[]) => {
    const uid = auth.currentUser?.uid;
    if (!uid) { alert("Sign in to like posts!"); return; }
    const isLiked = likedBy.includes(uid);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likedBy: isLiked ? likedBy.filter(id => id !== uid) : arrayUnion(uid),
        likesCount: isLiked ? Math.max(0, likedBy.length - 1) : likedBy.length + 1
      });
    } catch (err: any) {
      console.error("Error liking post:", err);
      alert(`Could not like post: ${err.message}`);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedMedia) return;
    setIsPosting(true);
    try {
      let mediaUrl = '';
      if (selectedMedia) {
         const fileRef = ref(storage, `village/${nest.id}/${Date.now()}_${selectedMedia.file.name}`);
         const uploadTask = uploadBytesResumable(fileRef, selectedMedia.file);
         mediaUrl = await new Promise((resolve, reject) => {
           uploadTask.on('state_changed', 
             (s) => setUploadProgress((s.bytesTransferred / s.totalBytes) * 100),
             (e) => reject(e),
             async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
           );
         });
      }

      await addDoc(collection(db, 'posts'), {
        nestId: nest.id,
        authorId: auth.currentUser?.uid,
        authorName: profile.userName || 'Mama',
        authorImage: profile.profileImage || `https://i.pravatar.cc/100?u=${auth.currentUser?.uid}`,
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try { await updateDoc(doc(db, 'posts', postId), { deleted: true }); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-right-1 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{nest.category}</span>
        {isAdmin && (
          <button className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100">
            <ShieldCheck size={20} />
          </button>
        )}
      </div>

      <div className="bg-white p-10 rounded-[3rem] border-2 border-rose-50 space-y-6 relative overflow-hidden shadow-sm">
         <div className="flex items-center gap-6 relative z-10">
           <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-rose-50 shadow-sm shrink-0">
              <img src={nest.iconUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${nest.name}`} alt={nest.name} className="w-full h-full object-cover" />
           </div>
           <div className="space-y-1">
             <h2 className="text-3xl font-serif text-slate-900 leading-tight">{nest.name}</h2>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">{nest.memberIds.length} Village Members</span>
           </div>
         </div>
         <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm relative z-10">{nest.description}</p>
         <div className="flex items-center justify-between relative z-10 pt-4">
           {!isMember && (
             <button onClick={onJoin} className="h-12 px-8 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               Join Village
             </button>
           )}
           {isMember && isAdmin && (
             <button 
               onClick={() => {
                 const inviteLink = `${window.location.origin}/village/invite?nestId=${nest.id}&adminToken=${nest.ownerId.slice(0, 8)}`;
                 navigator.clipboard.writeText(inviteLink);
                 alert("Link copied! Share it to promote a moderator.");
               }}
               className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
             >
               <UserPlus size={14} /> Promote Moderator
             </button>
           )}
         </div>
      </div>

      {isMember && (
        <div className="bg-white p-2 rounded-[2.5rem] border-2 border-rose-50 shadow-sm focus-within:ring-2 focus-within:ring-rose-500/10 transition-all">
          <div className="flex items-center gap-4 p-4">
             <div className="w-12 h-12 rounded-2xl bg-rose-50 overflow-hidden border-2 border-white shadow-inner">
                <img src={profile.profileImage || `https://i.pravatar.cc/100?u=${auth.currentUser?.uid}`} alt="Me" className="w-full h-full object-cover" />
             </div>
             <input 
               value={newPostContent}
               onChange={e => setNewPostContent(e.target.value)}
               placeholder={`Share with the village...`}
               className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-black placeholder:text-slate-300"
             />
          </div>
          {selectedMedia && (
            <div className="mx-4 mb-4 relative rounded-3xl overflow-hidden border-2 border-rose-50 group">
               {selectedMedia.type === 'image' ? (
                 <img src={selectedMedia.preview} alt="Preview" className="w-full h-64 object-cover" />
               ) : (
                 <video src={selectedMedia.preview} className="w-full h-64 object-cover" controls />
               )}
               <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full"><X size={14} /></button>
               {uploadProgress !== null && (
                 <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all" style={{ width: `${uploadProgress}%` }} />
               )}
            </div>
          )}
          <div className="flex justify-between items-center p-3 border-t border-slate-50">
             <div className="flex">
                <input type="file" id="media-up" className="hidden" accept="image/*,video/*" onChange={e => {
                  const f = e.target.files?.[0];
                  if(f) setSelectedMedia({ file: f, type: f.type.startsWith('video') ? 'video' : 'image', preview: URL.createObjectURL(f)});
                }}/>
                <label htmlFor="media-up" className="p-3 text-slate-400 hover:text-rose-500 cursor-pointer"><Camera size={20} /></label>
             </div>
             <button onClick={handleCreatePost} disabled={isPosting || (!newPostContent && !selectedMedia)} className="h-12 w-12 bg-rose-900 text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-40"><Send size={18} /></button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post, i) => (
          <motion.div 
            key={post.id} 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm"
          >
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-rose-50 shadow-sm">
                    <img src={post.authorImage} alt={post.authorName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-[12px] font-black text-slate-800 leading-none">{post.authorName}</h5>
                    <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">
                      {post.createdAt?.toDate().toLocaleString([], { hour: '2-digit', minute: '2-digit', weekday: 'short' }) || 'Just now'}
                    </span>
                  </div>
               </div>
               {(isAdmin || post.authorId === auth.currentUser?.uid) && (
                  <button onClick={() => handleDeletePost(post.id)} className="p-3 text-slate-200 hover:text-rose-500"><Trash2 size={16} /></button>
               )}
            </div>

            {post.mediaUrl && (
              <div className="mx-2 rounded-[2rem] overflow-hidden border border-slate-50 relative group">
                 {post.mediaType === 'video' ? (
                   <video src={post.mediaUrl} controls className="w-full h-full object-cover max-h-[500px]" />
                 ) : (
                   <>
                     <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover max-h-[500px]" />
                     <a href={post.mediaUrl} download className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100"><Download size={16} /></a>
                   </>
                 )}
              </div>
            )}

            <div className="p-6 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button onClick={() => handleLikePost(post.id, post.likedBy || [])} className="transition-all hover:scale-110">
                    <Heart size={24} className={post.likedBy?.includes(auth.currentUser?.uid) ? 'text-rose-500' : 'text-slate-800'} fill={post.likedBy?.includes(auth.currentUser?.uid) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="transition-all hover:scale-110">
                    <MessageCircle size={24} className="text-slate-800" />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/village/post?id=${post.id}`); alert("Copied!"); }} className="transition-all hover:scale-110">
                    <Share2 size={24} className="text-slate-800" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                 <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{post.likesCount || 0} Likes</span>
                 <p className="text-sm font-medium text-slate-600 leading-relaxed">
                   <span className="font-black text-slate-800 mr-2">{post.authorName}</span>{post.content}
                 </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ===== Common Components ===== */
const NotificationWatcher = ({ joinedNestIds }: { joinedNestIds: string[] }) => {
  const [notif, setNotif] = useState<{ title: string, body: string } | null>(null);
  useEffect(() => {
    if (joinedNestIds.length === 0) return;
    const q = query(collection(db, 'posts'), where('nestId', 'in', joinedNestIds), orderBy('createdAt', 'desc'), limit(1));
    let initial = false;
    const unsub = onSnapshot(q, (s) => {
      if (!initial) { initial = true; return; }
      const p = s.docs[0]?.data();
      if (p && p.authorId !== auth.currentUser?.uid) {
        setNotif({ title: `New Village Post`, body: `${p.authorName}: ${p.content.slice(0, 40)}...` });
        setTimeout(() => setNotif(null), 5000);
      }
    });
    return () => unsub();
  }, [joinedNestIds.length]);
  return (
    <AnimatePresence>
      {notif && (
        <motion.div initial={{ y: -100 }} animate={{ y: 20 }} exit={{ y: -100 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm bg-white p-6 rounded-[2.5rem] shadow-2xl border-2 border-rose-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white"><Bell size={24} /></div>
          <div className="flex-1"><h5 className="font-serif text-slate-800 text-sm">{notif.title}</h5><p className="text-[10px] text-slate-500 font-medium line-clamp-1">{notif.body}</p></div>
          <button onClick={() => setNotif(null)} className="p-2 text-slate-300"><X size={18} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
