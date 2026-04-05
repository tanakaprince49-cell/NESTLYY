/**
 * Seed script: populates Firestore with Village Hub template nests and seed posts.
 *
 * Usage:
 *   1. Export FIREBASE_SERVICE_ACCOUNT env var with the service account JSON string
 *   2. Run: npx tsx scripts/seedVillage.ts
 *
 * Idempotent: uses fixed template IDs, so re-running updates existing docs in place.
 */

import admin from 'firebase-admin';
import { TEMPLATE_NESTS, getTemplatePosts } from '../services/villageTemplates.ts';

function init() {
  if (admin.apps?.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(raw)),
  });
}

async function seed() {
  init();
  const db = admin.firestore();
  const batch = db.batch();

  for (const nest of TEMPLATE_NESTS) {
    const ref = db.collection('nests').doc(nest.id);
    batch.set(ref, {
      name: nest.name,
      description: nest.description,
      category: nest.category,
      emoji: nest.emoji,
      memberCount: 0,
      isTemplate: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      creatorUid: null,
    });
  }

  const posts = getTemplatePosts();
  for (const post of posts) {
    const ref = db.collection('nests').doc(post.nestId).collection('posts').doc(post.id);
    batch.set(ref, {
      authorUid: post.authorUid,
      authorName: post.authorName,
      content: post.content,
      likedBy: [],
      likeCount: post.likeCount,
      createdAt: admin.firestore.Timestamp.fromMillis(post.createdAt),
      isTemplate: true,
    });
  }

  await batch.commit();
  console.log(`Seeded ${TEMPLATE_NESTS.length} template nests and ${posts.length} seed posts.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
