import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { Nest, NestMembership, NestPost, NestCategory, NestMedia, NestComment } from '../types.ts';

export type Unsubscribe = ReturnType<typeof onSnapshot>;

const NESTS = 'nests';
const MEMBERSHIPS = 'memberships';
const POSTS = 'posts';

function tsToMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function nestFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Nest {
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name ?? '',
    description: d.description ?? '',
    category: (d.category ?? 'general') as NestCategory,
    emoji: d.emoji ?? '🌸',
    memberCount: d.memberCount ?? 0,
    isTemplate: d.isTemplate ?? false,
    createdAt: tsToMs(d.createdAt),
    creatorUid: d.creatorUid ?? null,
  };
}

function membershipFromDoc(snap: QueryDocumentSnapshot<DocumentData>): NestMembership {
  const d = snap.data();
  return {
    id: snap.id,
    nestId: d.nestId ?? '',
    userId: d.userId ?? '',
    joinedAt: tsToMs(d.joinedAt),
  };
}

function postFromDoc(snap: QueryDocumentSnapshot<DocumentData>, nestId: string): NestPost {
  const d = snap.data();
  return {
    id: snap.id,
    nestId,
    authorUid: d.authorUid ?? '',
    authorName: d.authorName ?? '',
    authorProfilePicture: d.authorProfilePicture || undefined,
    content: d.content ?? '',
    media: Array.isArray(d.media) ? d.media : [],
    likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
    likeCount: d.likeCount ?? 0,
    commentCount: d.commentCount ?? 0,
    createdAt: tsToMs(d.createdAt),
    isTemplate: d.isTemplate ?? false,
  };
}

// --- Nests ---

export function subscribeToNests(callback: (nests: Nest[]) => void): Unsubscribe {
  const q = query(collection(db, NESTS), orderBy('memberCount', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(nestFromDoc));
  });
}

export async function createNest(
  input: { name: string; description: string; category: NestCategory; emoji: string },
  creatorUid: string,
): Promise<string> {
  const nestRef = doc(collection(db, NESTS));
  const batch = writeBatch(db);
  batch.set(nestRef, {
    name: input.name,
    description: input.description,
    category: input.category,
    emoji: input.emoji,
    memberCount: 1,
    isTemplate: false,
    createdAt: serverTimestamp(),
    creatorUid,
  });
  const membershipId = `${creatorUid}_${nestRef.id}`;
  batch.set(doc(db, MEMBERSHIPS, membershipId), {
    nestId: nestRef.id,
    userId: creatorUid,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return nestRef.id;
}

// TODO: if post count per nest exceeds ~200, move to a Cloud Function (firebase-admin recursive delete)
export async function deleteNest(nestId: string): Promise<void> {
  const postsSnap = await getDocs(collection(db, NESTS, nestId, POSTS));
  const membershipsSnap = await getDocs(query(collection(db, MEMBERSHIPS), where('nestId', '==', nestId)));
  const batch = writeBatch(db);
  postsSnap.docs.forEach((p) => batch.delete(p.ref));
  membershipsSnap.docs.forEach((m) => batch.delete(m.ref));
  batch.delete(doc(db, NESTS, nestId));
  await batch.commit();
}

// --- Memberships ---

export function subscribeToUserMemberships(
  userId: string,
  callback: (memberships: NestMembership[]) => void,
): Unsubscribe {
  const q = query(collection(db, MEMBERSHIPS), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(membershipFromDoc));
  });
}

export async function joinNest(nestId: string, userId: string): Promise<void> {
  const membershipId = `${userId}_${nestId}`;
  const membershipRef = doc(db, MEMBERSHIPS, membershipId);
  const existing = await getDoc(membershipRef);
  if (existing.exists()) return;
  const batch = writeBatch(db);
  batch.set(membershipRef, {
    nestId,
    userId,
    joinedAt: serverTimestamp(),
  });
  batch.update(doc(db, NESTS, nestId), { memberCount: increment(1) });
  await batch.commit();
}

export async function leaveNest(nestId: string, userId: string): Promise<void> {
  const membershipId = `${userId}_${nestId}`;
  const membershipRef = doc(db, MEMBERSHIPS, membershipId);
  const existing = await getDoc(membershipRef);
  if (!existing.exists()) return;
  const batch = writeBatch(db);
  batch.delete(membershipRef);
  batch.update(doc(db, NESTS, nestId), { memberCount: increment(-1) });
  await batch.commit();
}

// --- Posts ---

export function subscribeToNestPosts(
  nestId: string,
  callback: (posts: NestPost[]) => void,
): Unsubscribe {
  const q = query(collection(db, NESTS, nestId, POSTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => postFromDoc(d, nestId)));
  });
}

export async function createPost(
  nestId: string,
  input: { content: string; authorUid: string; authorName: string; authorProfilePicture?: string; media?: NestMedia[] },
): Promise<string> {
  const postRef = doc(collection(db, NESTS, nestId, POSTS));
  await setDoc(postRef, {
    authorUid: input.authorUid,
    authorName: input.authorName,
    ...(input.authorProfilePicture ? { authorProfilePicture: input.authorProfilePicture } : {}),
    content: input.content,
    media: input.media || [],
    likedBy: [],
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    isTemplate: false,
  });
  return postRef.id;
}

export async function deletePost(nestId: string, postId: string): Promise<void> {
  await deleteDoc(doc(db, NESTS, nestId, POSTS, postId));
}

export async function toggleLike(
  nestId: string,
  postId: string,
  userId: string,
): Promise<void> {
  const postRef = doc(db, NESTS, nestId, POSTS, postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
    const hasLiked = likedBy.includes(userId);
    tx.update(postRef, {
      likedBy: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
      likeCount: increment(hasLiked ? -1 : 1),
    });
  });
}

// --- Comments ---

export function subscribeToPostComments(
  nestId: string,
  postId: string,
  callback: (comments: NestComment[]) => void,
): Unsubscribe {
  const q = query(collection(db, NESTS, nestId, POSTS, postId, 'comments'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(commentFromDoc));
  });
}

function commentFromDoc(snap: QueryDocumentSnapshot<DocumentData>): NestComment {
  const d = snap.data();
  return {
    id: snap.id,
    postId: d.postId ?? '',
    authorUid: d.authorUid ?? '',
    authorName: d.authorName ?? '',
    authorProfilePicture: d.authorProfilePicture || undefined,
    content: d.content ?? '',
    likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
    likeCount: d.likeCount ?? 0,
    createdAt: tsToMs(d.createdAt),
    replyTo: d.replyTo,
  };
}

export async function createComment(
  nestId: string,
  postId: string,
  input: { content: string; authorUid: string; authorName: string; authorProfilePicture?: string; replyTo?: string },
): Promise<string> {
  const commentRef = doc(collection(db, NESTS, nestId, POSTS, postId, 'comments'));
  const batch = writeBatch(db);
  batch.set(commentRef, {
    postId,
    authorUid: input.authorUid,
    authorName: input.authorName,
    ...(input.authorProfilePicture ? { authorProfilePicture: input.authorProfilePicture } : {}),
    content: input.content,
    replyTo: input.replyTo,
    likedBy: [],
    likeCount: 0,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, NESTS, nestId, POSTS, postId), {
    commentCount: increment(1),
  });
  await batch.commit();
  return commentRef.id;
}

export async function deleteComment(
  nestId: string,
  postId: string,
  commentId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, NESTS, nestId, POSTS, postId, 'comments', commentId));
  batch.update(doc(db, NESTS, nestId, POSTS, postId), {
    commentCount: increment(-1),
  });
  await batch.commit();
}

export async function toggleCommentLike(
  nestId: string,
  postId: string,
  commentId: string,
  userId: string,
): Promise<void> {
  const commentRef = doc(db, NESTS, nestId, POSTS, postId, 'comments', commentId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(commentRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
    const hasLiked = likedBy.includes(userId);
    tx.update(commentRef, {
      likedBy: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
      likeCount: increment(hasLiked ? -1 : 1),
    });
  });
}

// --- Sharing ---

export async function sharePost(
  nestId: string,
  postId: string,
  sharerUid: string,
  sharerName: string,
  shareMessage?: string,
): Promise<string> {
  const originalPostRef = doc(db, NESTS, nestId, POSTS, postId);
  const originalSnap = await getDoc(originalPostRef);
  if (!originalSnap.exists()) throw new Error('Post not found');

  const originalData = originalSnap.data();
  const shareContent = shareMessage
    ? `${shareMessage}\n\nShared from ${originalData.authorName}: "${originalData.content}"`
    : `Shared from ${originalData.authorName}: "${originalData.content}"`;

  return await createPost(nestId, {
    content: shareContent,
    authorUid: sharerUid,
    authorName: sharerName,
    authorProfilePicture: originalData.authorProfilePicture,
    media: originalData.media,
  });
}
