import React, { useState, useMemo, useEffect } from 'react';
import { Users, Heart, Sparkles, Plus, ArrowLeft, Send, X, Trash2, LogOut, ChevronRight, Loader2, MessageCircle, Share2, Camera, Video, Paperclip, Search } from 'lucide-react';
import { PregnancyProfile, NestCategory, Nest, NestPost, NestMembership, NestComment, NestMedia } from '../types.ts';
import {
  subscribeToNests,
  subscribeToUserMemberships,
  subscribeToNestPosts,
  createNest,
  deleteNest,
  joinNest,
  leaveNest,
  createPost,
  deletePost,
  toggleLike,
  subscribeToPostComments,
  createComment,
  deleteComment,
  toggleCommentLike,
  sharePost,
} from '../services/villageService.ts';
import { notifyNestMembers } from '../services/groupService.ts';

interface VillageHubProps {
  profile: PregnancyProfile;
  userUid: string | null;
}

type View = 'discover' | 'my-nests' | 'nest-detail';

const CATEGORIES: { label: string; value: NestCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Trimester', value: 'trimester' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Diet', value: 'diet' },
  { label: 'Support', value: 'support' },
  { label: 'Postpartum', value: 'postpartum' },
];

const EMOJI_OPTIONS = ['🌸', '🌿', '🦋', '🌙', '🔥', '💪', '🧘', '🎯', '🫶', '☀️', '🍼', '🎀'];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export const VillageHub: React.FC<VillageHubProps> = ({ profile, userUid }) => {
  const [view, setView] = useState<View>('discover');
  const [selectedNestId, setSelectedNestId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NestCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [nests, setNests] = useState<Nest[]>([]);
  const [memberships, setMemberships] = useState<NestMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }
    let nestsReady = false;
    let membershipsReady = false;
    const checkReady = () => {
      if (nestsReady && membershipsReady) setLoading(false);
    };
    const unsubNests = subscribeToNests((data) => {
      setNests(data);
      nestsReady = true;
      checkReady();
    });
    const unsubMemberships = subscribeToUserMemberships(userUid, (data) => {
      setMemberships(data);
      membershipsReady = true;
      checkReady();
    });
    return () => {
      unsubNests();
      unsubMemberships();
    };
  }, [userUid]);

  const joinedIds = useMemo(() => new Set(memberships.map((m) => m.nestId)), [memberships]);

  const filteredDiscover = useMemo(() => {
    let filtered = nests;

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((n) => n.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((n) =>
        n.name.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [nests, categoryFilter, searchQuery]);

  const joinedNests = useMemo(
    () => nests.filter((n) => joinedIds.has(n.id)),
    [nests, joinedIds],
  );

  const filteredJoinedNests = useMemo(() => {
    if (!searchQuery.trim()) return joinedNests;
    const query = searchQuery.toLowerCase().trim();
    return joinedNests.filter((n) =>
      n.name.toLowerCase().includes(query) ||
      n.description.toLowerCase().includes(query)
    );
  }, [joinedNests, searchQuery]);

  const selectedNest = selectedNestId ? nests.find((n) => n.id === selectedNestId) ?? null : null;

  const openNest = (nestId: string) => {
    setSelectedNestId(nestId);
    setView('nest-detail');
  };

  const handleJoin = async (nestId: string) => {
    if (!userUid) return;
    try {
      await joinNest(nestId, userUid);
    } catch (err) {
      console.error('joinNest failed', err);
      alert('Could not join nest. Please try again.');
    }
  };

  const handleLeave = async (nestId: string) => {
    if (!userUid) return;
    if (!confirm('Leave this nest? Your posts will remain.')) return;
    try {
      await leaveNest(nestId, userUid);
      if (view === 'nest-detail') setView('my-nests');
    } catch (err) {
      console.error('leaveNest failed', err);
      alert('Could not leave nest. Please try again.');
    }
  };

  const handleCreate = async (input: {
    name: string;
    description: string;
    category: NestCategory;
    emoji: string;
  }) => {
    if (!userUid) return;
    try {
      const newId = await createNest(input, userUid);
      setShowCreateModal(false);
      openNest(newId);
    } catch (err) {
      console.error('createNest failed', err);
      alert('Could not create nest. Please try again.');
    }
  };

  const handleDeleteNest = async (nestId: string) => {
    if (!confirm('Delete this nest? All posts will be removed.')) return;
    try {
      await deleteNest(nestId);
      setView('my-nests');
    } catch (err) {
      console.error('deleteNest failed', err);
      alert('Could not delete nest. Please try again.');
    }
  };

  // ── Guard: signed-out users ────────────────────────

  if (!userUid) {
    return (
      <div className="text-center py-16 space-y-4 px-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
          <Users size={32} className="text-rose-300" />
        </div>
        <h2 className="text-2xl font-serif text-slate-800">Sign in to join the Village</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Village Hub is a community space. Create an account or sign in to join nests and connect with other moms.
        </p>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="animate-spin text-rose-400" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading your village</p>
      </div>
    );
  }

  // ── Discover View ──────────────────────────────────

  if (view === 'discover') {
    return (
      <div className="space-y-8 pb-12">
        {/* Hero */}
        <div className="bg-rose-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Users size={180} />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300">Neighborhood Nests</span>
            <h2 className="text-4xl font-serif leading-tight">Find Your <br/>Village, {profile.userName || 'Mama'}.</h2>
            <p className="text-sm font-medium text-rose-100 max-w-xs leading-relaxed opacity-80">
              Motherhood is better when shared. Join a nest and connect with women on the same journey.
            </p>
          </div>
          <div className="flex gap-4 relative z-10 pt-4">
            <button
              onClick={() => setView('my-nests')}
              className="h-14 px-8 bg-white text-rose-900 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              My Nests <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-14 h-14 bg-rose-800 text-white rounded-2xl flex items-center justify-center border border-rose-700/50 hover:bg-rose-700 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nests by name or description..."
              className="w-full h-12 px-12 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 transition-colors"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                categoryFilter === cat.value
                  ? 'bg-rose-900 text-white shadow-lg'
                  : 'bg-white/60 text-slate-400 hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Nest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
          {filteredDiscover.map((nest, i) => (
            <NestCard
              key={nest.id}
              nest={nest}
              isJoined={joinedIds.has(nest.id)}
              onJoin={() => handleJoin(nest.id)}
              onOpen={() => openNest(nest.id)}
              delay={i * 0.05}
            />
          ))}
        </div>

        {filteredDiscover.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No nests in this category yet.</div>
        )}

        {/* Info Footer */}
        <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100/50 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-rose-500 animate-float">
            <Sparkles size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-serif text-slate-800">Why Nests work?</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              Small groups of women in the same life stage create instant bonds. Shared context builds trust faster than anything else.
            </p>
          </div>
        </div>

        {showCreateModal && (
          <CreateNestModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
          />
        )}
      </div>
    );
  }

  // ── My Nests View ──────────────────────────────────

  if (view === 'my-nests') {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => setView('discover')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-serif text-slate-800">My Nests</h2>
        </div>

        {/* Search */}
        <div className="px-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my nests..."
              className="w-full h-12 px-12 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 transition-colors"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {filteredJoinedNests.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <Users size={32} className="text-rose-300" />
            </div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No nests match your search.' : "You haven't joined any nests yet."}
            </p>
            <button
              onClick={() => setView('discover')}
              className="btn-nestly text-[10px] font-black uppercase tracking-widest px-6 py-3"
            >
              Discover Nests
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-1">
            {filteredJoinedNests.map((nest) => (
              <button
                key={nest.id}
                onClick={() => openNest(nest.id)}
                className="w-full bg-white/60 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all text-left"
              >
                <div className="w-14 h-14 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner">
                  {nest.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-serif text-slate-800 truncate">{nest.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {nest.memberCount} {nest.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        )}

        <div className="px-1">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full p-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-rose-300 hover:text-rose-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Create Your Own Nest
          </button>
        </div>

        {showCreateModal && (
          <CreateNestModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
          />
        )}
      </div>
    );
  }

  // ── Nest Detail View ───────────────────────────────

  if (view === 'nest-detail' && selectedNest) {
    return (
      <NestDetailView
        nest={selectedNest}
        profile={profile}
        userUid={userUid}
        onBack={() => setView('my-nests')}
        onLeave={() => handleLeave(selectedNest.id)}
        onDelete={selectedNest.creatorUid === userUid ? () => handleDeleteNest(selectedNest.id) : undefined}
      />
    );
  }

  return null;
};

// ── Sub-components ─────────────────────────────────

function NestCard({ nest, isJoined, onJoin, onOpen, delay }: {
  nest: Nest; isJoined: boolean; onJoin: () => void; onOpen: () => void; delay: number;
}) {
  return (
    <div
      className={`bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border-2 border-slate-50 hover:border-rose-100 transition-all group shadow-sm hover:shadow-xl animate-slide-up ${isJoined ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${delay}s` }}
      role={isJoined ? 'button' : undefined}
      tabIndex={isJoined ? 0 : undefined}
      onClick={isJoined ? onOpen : undefined}
      onKeyDown={isJoined ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } : undefined}
    >
      <div className="flex justify-between items-start mb-5">
        <div className="w-14 h-14 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner group-hover:bg-rose-100 transition-colors">
          {nest.emoji}
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </span>
          <span className="text-[10px] font-medium text-slate-400 block mt-1">{nest.memberCount} members</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xl font-serif text-slate-800 group-hover:text-rose-900 transition-colors">{nest.name}</h4>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{nest.description}</p>
        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-lg">
          {nest.category}
        </span>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100">
        {isJoined ? (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Joined</span>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
            className="w-full h-12 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-800 active:scale-95 transition-all"
          >
            Join Nest
          </button>
        )}
      </div>
    </div>
  );
}

function NestDetailView({ nest, profile, userUid, onBack, onLeave, onDelete }: {
  nest: Nest;
  profile: PregnancyProfile;
  userUid: string;
  onBack: () => void;
  onLeave: () => void;
  onDelete?: () => void;
}) {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<NestPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postMedia, setPostMedia] = useState<NestMedia[]>([]);
  const [comments, setComments] = useState<Record<string, NestComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<NestMedia | null>(null);
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});

  // Helper function to organize comments into nested structure
  const organizeComments = (flatComments: NestComment[]): NestComment[] => {
    const commentMap = new Map<string, NestComment>();
    const rootComments: NestComment[] = [];

    // First pass: create map of all comments
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.replyTo) {
        const parentComment = commentMap.get(comment.replyTo);
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(commentWithReplies);
        } else {
          // If parent not found, treat as root comment
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  useEffect(() => {
    setPostsLoading(true);
    const unsub = subscribeToNestPosts(nest.id, (data) => {
      setPosts(data);
      setPostsLoading(false);
    });
    return unsub;
  }, [nest.id]);

  // Load comments for posts that have them
  useEffect(() => {
    const unsubscribers: Unsubscribe[] = [];

    posts.forEach(post => {
      if (post.commentCount > 0 && !comments[post.id]) {
        const unsub = subscribeToPostComments(nest.id, post.id, (data) => {
          setComments(prev => ({ ...prev, [post.id]: data }));
        });
        unsubscribers.push(unsub);
      }
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [posts, nest.id, comments]);

  const handlePost = async () => {
    const text = newPost.trim();
    if (!text && postMedia.length === 0) return;
    try {
      const postId = await createPost(nest.id, {
        content: text,
        authorUid: userUid,
        authorName: profile.userName || 'Anonymous',
        media: postMedia,
      });

      // Send notifications to other nest members
      await notifyNestMembers(
        nest.id,
        nest.name,
        userUid,
        profile.userName || 'Anonymous',
        text,
        postId
      );

      setNewPost('');
      setPostMedia([]);
    } catch (err) {
      console.error('createPost failed', err);
      alert('Could not post. Please try again.');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(nest.id, postId, userUid);
    } catch (err) {
      console.error('toggleLike failed', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deletePost(nest.id, postId);
    } catch (err) {
      console.error('deletePost failed', err);
      alert('Could not delete post. Please try again.');
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;
    try {
      await createComment(nest.id, postId, {
        content: commentText,
        authorUid: userUid,
        authorName: profile.userName || 'Anonymous',
        replyTo: replyingTo[postId] || undefined,
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyingTo(prev => ({ ...prev, [postId]: null }));
    } catch (err) {
      console.error('createComment failed', err);
      alert('Could not add comment. Please try again.');
    }
  };

  const startReply = (postId: string, commentId: string, authorName: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: commentId }));
    setCommentInputs(prev => ({ ...prev, [postId]: `@${authorName} ` }));
  };

  const cancelReply = (postId: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    try {
      await toggleCommentLike(nest.id, postId, commentId, userUid);
    } catch (err) {
      console.error('toggleCommentLike failed', err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment(nest.id, postId, commentId);
    } catch (err) {
      console.error('deleteComment failed', err);
      alert('Could not delete comment. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!sharePostId) return;
    try {
      await sharePost(
        nest.id,
        sharePostId,
        userUid,
        profile.userName || 'Anonymous',
        shareMessage.trim() || undefined
      );
      setShowShareModal(false);
      setSharePostId(null);
      setShareMessage('');
    } catch (err) {
      console.error('sharePost failed', err);
      alert('Could not share post. Please try again.');
    }
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const media: NestMedia = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: result,
          filename: file.name,
          size: file.size,
        };
        setPostMedia(prev => [...prev, media]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (mediaId: string) => {
    setPostMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-rose-900 text-white p-8 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <span className="text-8xl">{nest.emoji}</span>
        </div>
        <div className="relative z-10 space-y-4">
          <button onClick={onBack} className="p-2 -ml-2 text-rose-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-3xl font-serif leading-tight">{nest.name}</h2>
          <p className="text-sm text-rose-100 opacity-80 max-w-xs">{nest.description}</p>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">
              {nest.memberCount} {nest.memberCount === 1 ? 'member' : 'members'}
            </span>
            <button
              onClick={onLeave}
              className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <LogOut size={12} /> Leave
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compose */}
      <div className="space-y-3 px-1">
        <div className="flex gap-3">
          <input
            type="text"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            placeholder="Share something with the nest..."
            maxLength={500}
            className="flex-1 h-12 px-5 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 transition-colors"
          />
          <div className="flex gap-2">
            <label className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
              />
              <Paperclip size={18} />
            </label>
            <button
              onClick={handlePost}
              disabled={!newPost.trim() && postMedia.length === 0}
              className="w-12 h-12 bg-rose-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 hover:bg-rose-800 active:scale-95 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Media Preview */}
        {postMedia.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {postMedia.map(media => (
              <div key={media.id} className="relative flex-shrink-0">
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.filename}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <video
                    src={media.url}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                  />
                )}
                <button
                  onClick={() => removeMedia(media.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-3 px-1">
        {postsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-rose-300" size={20} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No posts yet. Be the first to share!
          </div>
        ) : (
          posts.map(post => {
            const isLiked = post.likedBy.includes(userUid);
            const canDelete = post.authorUid === userUid;
            const isOwnPost = post.authorUid === userUid;
            const profileImage = isOwnPost ? profile.profileImage : null;

            return (
              <div key={post.id} className="bg-white/60 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] border border-slate-100 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={post.authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs sm:text-[10px] font-black text-rose-600">
                          {post.authorName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm sm:text-xs font-bold text-slate-700 block truncate">{post.authorName}</span>
                      <span className="text-xs sm:text-[10px] text-slate-400">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed break-words">{post.content}</p>

                {/* Media Display */}
                {post.media && post.media.length > 0 && (
                  <div className="space-y-2">
                    {post.media.map(media => (
                      <div key={media.id} className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer" onClick={() => {
                        setSelectedMedia(media);
                        setShowMediaModal(true);
                      }}>
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={media.filename}
                            className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
                            muted
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                      {post.likeCount}
                    </button>
                    <button
                      onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <MessageCircle size={16} />
                      {post.commentCount}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSharePostId(post.id);
                      setShowShareModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {/* Reply Context */}
                    {replyingTo[post.id] && (
                      <div className="bg-rose-50 rounded-lg p-2 flex items-center justify-between">
                        <span className="text-xs text-rose-700">
                          Replying to comment
                        </span>
                        <button
                          onClick={() => cancelReply(post.id)}
                          className="text-rose-500 hover:text-rose-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                        placeholder={replyingTo[post.id] ? "Write a reply..." : "Write a comment..."}
                        className="flex-1 h-8 px-3 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-rose-300 transition-colors"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="px-3 h-8 bg-rose-900 text-white text-xs rounded-lg disabled:opacity-30 hover:bg-rose-800 transition-colors"
                      >
                        {replyingTo[post.id] ? 'Reply' : 'Post'}
                      </button>
                    </div>

                    {/* Comments List */}
                    {organizeComments(comments[post.id] || []).map(comment => {
                      const renderComment = (comment: NestComment, depth = 0) => {
                        const isCommentLiked = comment.likedBy.includes(userUid);
                        const canDeleteComment = comment.authorUid === userUid;
                        return (
                          <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-2' : ''}`}>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {comment.authorUid === userUid && profile.profileImage ? (
                                      <img
                                        src={profile.profileImage}
                                        alt={comment.authorName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[8px] font-black text-rose-600">
                                        {comment.authorName.charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{comment.authorName}</span>
                                  <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                                </div>
                                {canDeleteComment && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                    className="text-slate-300 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleLikeComment(post.id, comment.id)}
                                  className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${
                                    isCommentLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                                  }`}
                                >
                                  <Heart size={12} fill={isCommentLiked ? 'currentColor' : 'none'} />
                                  {comment.likeCount}
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(prev => ({ ...prev, [post.id]: comment.id }));
                                    setCommentInputs(prev => ({ ...prev, [post.id]: `@${comment.authorName} ` }));
                                  }}
                                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                            {/* Render replies */}
                            {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
                          </div>
                        );
                      };
                      return renderComment(comment);
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div
            className="bg-white rounded-[2.5rem] p-6 w-full max-w-md space-y-4 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif text-slate-800">Share Post</h3>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a message (optional)..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 transition-colors resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-rose-900 text-white rounded-xl font-bold hover:bg-rose-800 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {showMediaModal && selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowMediaModal(false)}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMediaModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.filename}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateNestModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (input: { name: string; description: string; category: NestCategory; emoji: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NestCategory>('general');
  const [emoji, setEmoji] = useState('🌸');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      category,
      emoji,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md space-y-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif text-slate-800">Create a Nest</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nest Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yoga Moms"
              className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this nest about?"
              className="w-full h-20 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 resize-none"
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NestCategory)}
              className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300"
            >
              <option value="general">General</option>
              <option value="trimester">Trimester</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="diet">Diet</option>
              <option value="support">Support</option>
              <option value="postpartum">Postpartum</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Choose an Emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e ? 'bg-rose-100 ring-2 ring-rose-400 scale-110' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full h-14 bg-rose-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-rose-800 active:scale-95 transition-all"
          >
            Create Nest
          </button>
        </form>
      </div>
    </div>
  );
}
