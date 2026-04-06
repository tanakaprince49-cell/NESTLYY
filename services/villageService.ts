import { db, auth } from '../firebase.ts';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Nest, NestPost, NestMembership, NestStory, NestInvite } from '../types.ts';
import { TEMPLATE_NESTS } from './villageTemplates.ts';

class VillageService {
  // Listeners
  subscribeToNests(callback: (nests: Nest[]) => void) {
    const q = query(collection(db, 'nests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const nests = snapshot.docs.map(doc => doc.data() as Nest);
      callback(nests);
    });
  }

  subscribeToPosts(nestId: string, callback: (posts: NestPost[]) => void) {
    const q = query(collection(db, 'nest_posts'), where('nestId', '==', nestId));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => doc.data() as NestPost);
      posts.sort((a, b) => b.timestamp - a.timestamp);
      callback(posts);
    });
  }

  subscribeToMemberships(userId: string, callback: (memberships: NestMembership[]) => void) {
    const q = query(collection(db, 'nest_members'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const mems = snapshot.docs.map(doc => doc.data() as NestMembership);
      callback(mems);
    });
  }

  subscribeToStories(nestId: string, callback: (stories: NestStory[]) => void) {
    const q = query(collection(db, 'nest_stories'), where('nestId', '==', nestId));
    return onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const stories = snapshot.docs
        .map(doc => doc.data() as NestStory)
        .filter(s => s.expiresAt > now); // Filter out expired ones
      stories.sort((a, b) => b.timestamp - a.timestamp);
      callback(stories);
    });
  }

  // Group Management
  async createNest(nest: Nest) {
    const nestRef = doc(collection(db, 'nests'), nest.id);
    await setDoc(nestRef, nest);
  }

  async uploadProfilePic(nestId: string, dataUrl: string): Promise<string> {
    // Storing as base64 string directly in Firestore
    return dataUrl;
  }

  async uploadMedia(path: string, dataUrl: string): Promise<string> {
    // Storing as base64 string directly in Firestore
    return dataUrl;
  }

  async joinNest(nestId: string, userId: string, role: 'member' | 'admin' = 'member') {
    const memId = `${nestId}_${userId}`;
    const memRef = doc(db, 'nest_members', memId);
    await setDoc(memRef, {
      id: memId,
      nestId,
      userId,
      role,
      joinedAt: Date.now()
    });
    
    // Update member count
    const nestRef = doc(db, 'nests', nestId);
    const snap = await getDoc(nestRef);
    if (snap.exists()) {
      const current = snap.data().memberCount || 0;
      await updateDoc(nestRef, { memberCount: current + 1 });
    } else {
      const template = TEMPLATE_NESTS.find(t => t.id === nestId);
      if (template) {
        await setDoc(nestRef, { ...template, memberCount: 1 });
      }
    }
  }

  async leaveNest(nestId: string, userId: string) {
    const memId = `${nestId}_${userId}`;
    await deleteDoc(doc(db, 'nest_members', memId));

    // Update member count
    const nestRef = doc(db, 'nests', nestId);
    const snap = await getDoc(nestRef);
    if (snap.exists()) {
      const current = Math.max(0, (snap.data().memberCount || 1) - 1);
      await updateDoc(nestRef, { memberCount: current });
    }
  }

  async updateNest(nestId: string, data: any) {
    await updateDoc(doc(db, 'nests', nestId), data);
  }

  async deleteNest(nestId: string) {
    await deleteDoc(doc(db, 'nests', nestId));
  }

  async banUser(nestId: string, userId: string) {
    const memId = `${nestId}_${userId}`;
    await deleteDoc(doc(db, 'nest_members', memId));
    await updateDoc(doc(db, 'nests', nestId), { bannedUsers: arrayUnion(userId) });
  }

  // Posts
  async addPost(post: NestPost) {
    await setDoc(doc(db, 'nest_posts', post.id), post);
    
    // Broadcast for global notifications
    const nestRef = doc(db, 'nests', post.nestId);
    await updateDoc(nestRef, {
      lastPostId: post.id,
      lastPostText: post.content || 'Shared a media attachment',
      lastPostAuthor: post.authorName,
      lastPostTime: post.timestamp
    }).catch(e => console.warn("Failed to update nest last post, might be template"));
  }

  async deletePost(postId: string) {
    await deleteDoc(doc(db, 'nest_posts', postId));
  }

  async toggleLikePost(postId: string, userId: string) {
    const postRef = doc(db, 'nest_posts', postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const post = snap.data() as NestPost;
      const likedBy = post.likedBy || [];
      const hasLiked = likedBy.includes(userId);
      
      const newLikedBy = hasLiked ? likedBy.filter(u => u !== userId) : [...likedBy, userId];
      
      await updateDoc(postRef, {
        likedBy: newLikedBy,
        likeCount: newLikedBy.length
      });
    }
  }

  async hidePost(postId: string) {
    await updateDoc(doc(db, 'nest_posts', postId), { isHidden: true });
  }

  async addComment(postId: string, comment: any) {
    await updateDoc(doc(db, 'nest_posts', postId), {
      comments: arrayUnion(comment)
    });
  }

  // Stories
  async addStory(story: NestStory) {
    await setDoc(doc(db, 'nest_stories', story.id), story);
  }

  // Invites
  async createInvite(invite: NestInvite) {
    await setDoc(doc(db, 'nest_invites', invite.id), invite);
  }

  async getInvite(inviteId: string): Promise<NestInvite | null> {
    const snap = await getDoc(doc(db, 'nest_invites', inviteId));
    return snap.exists() ? (snap.data() as NestInvite) : null;
  }

  // Admin / Debug wiping
  async getDocsFromCollection(collectionName: string) {
     return await getDocs(collection(db, collectionName));
  }

  async deleteDocument(collectionName: string, documentId: string) {
     await deleteDoc(doc(db, collectionName, documentId));
  }
}

export const villageService = new VillageService();
