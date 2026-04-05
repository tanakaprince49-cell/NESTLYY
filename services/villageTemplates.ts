import type { Nest, NestPost } from '../types.ts';

export const TEMPLATE_NESTS: Nest[] = [
  { id: 'tmpl-1', name: 'First Trimester Moms', description: 'Navigating the early weeks together. Morning sickness, first scans, and all the emotions.', category: 'trimester', emoji: '🌱', memberCount: 24, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-2', name: 'Second Trimester Club', description: 'Feeling those kicks! Sharing bump pics, gender reveals, and the glow-up phase.', category: 'trimester', emoji: '🦋', memberCount: 31, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-3', name: 'Third Trimester Warriors', description: 'Almost there! Hospital bags, birth plans, and counting down the days.', category: 'trimester', emoji: '🏔️', memberCount: 18, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-4', name: 'Vegan Pregnancy', description: 'Plant-based nutrition tips, recipes, and making sure baby gets everything they need.', category: 'diet', emoji: '🥑', memberCount: 12, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-5', name: 'Working Moms', description: 'Balancing career and bump. Maternity leave tips, boss conversations, and desk stretches.', category: 'lifestyle', emoji: '💼', memberCount: 45, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-6', name: 'Twin Pregnancy', description: 'Double the joy, double the questions. Support from moms who get it.', category: 'support', emoji: '👯', memberCount: 8, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-7', name: 'Newborn Moms Circle', description: 'First weeks with baby. Sleep deprivation, breastfeeding wins, and tiny toes.', category: 'postpartum', emoji: '👶', memberCount: 36, isTemplate: true, createdAt: 0 },
  { id: 'tmpl-8', name: 'Gentle Parenting', description: 'Raising little ones with empathy, patience, and connection-first approach.', category: 'support', emoji: '🤲', memberCount: 21, isTemplate: true, createdAt: 0 },
];

const DAY = 86400000;

export function getTemplatePosts(): NestPost[] {
  const now = Date.now();
  return [
    // First Trimester Moms
    { id: 'seed-1', nestId: 'tmpl-1', authorName: 'Sarah M.', content: 'Just heard the heartbeat for the first time today! So surreal. Anyone else cry during their first scan?', likedByUser: false, likeCount: 7, timestamp: now - 2 * DAY, isTemplate: true },
    { id: 'seed-2', nestId: 'tmpl-1', authorName: 'Emma K.', content: 'Week 8 and the nausea is real. Ginger tea helps a bit. What works for you?', likedByUser: false, likeCount: 4, timestamp: now - 5 * DAY, isTemplate: true },

    // Second Trimester Club
    { id: 'seed-3', nestId: 'tmpl-2', authorName: 'Priya R.', content: 'Felt the first kick at 18 weeks! My partner put his hand on my belly and felt it too.', likedByUser: false, likeCount: 12, timestamp: now - 1 * DAY, isTemplate: true },
    { id: 'seed-4', nestId: 'tmpl-2', authorName: 'Lisa T.', content: 'Anyone else getting the most vivid dreams? Last night I dreamed my baby was already walking.', likedByUser: false, likeCount: 6, timestamp: now - 3 * DAY, isTemplate: true },

    // Third Trimester Warriors
    { id: 'seed-5', nestId: 'tmpl-3', authorName: 'Amy W.', content: 'Hospital bag is packed! What did you all put in yours that you actually used?', likedByUser: false, likeCount: 9, timestamp: now - 1 * DAY, isTemplate: true },
    { id: 'seed-6', nestId: 'tmpl-3', authorName: 'Jade L.', content: '37 weeks and so ready. The waddle is real but I kind of love it.', likedByUser: false, likeCount: 5, timestamp: now - 4 * DAY, isTemplate: true },

    // Vegan Pregnancy
    { id: 'seed-7', nestId: 'tmpl-4', authorName: 'Nina C.', content: 'My iron levels are great at 28 weeks! Lentils + vitamin C combo is magic.', likedByUser: false, likeCount: 8, timestamp: now - 2 * DAY, isTemplate: true },
    { id: 'seed-8', nestId: 'tmpl-4', authorName: 'Zara P.', content: 'Found an amazing vegan prenatal vitamin with DHA from algae. Highly recommend it!', likedByUser: false, likeCount: 3, timestamp: now - 6 * DAY, isTemplate: true },

    // Working Moms
    { id: 'seed-9', nestId: 'tmpl-5', authorName: 'Rachel B.', content: 'Had the maternity leave conversation with my boss today. Went better than expected!', likedByUser: false, likeCount: 11, timestamp: now - 1 * DAY, isTemplate: true },
    { id: 'seed-10', nestId: 'tmpl-5', authorName: 'Olivia H.', content: 'Standing desk + pregnancy ball = my setup for the third trimester. Game changer.', likedByUser: false, likeCount: 7, timestamp: now - 3 * DAY, isTemplate: true },

    // Twin Pregnancy
    { id: 'seed-11', nestId: 'tmpl-6', authorName: 'Megan D.', content: 'Just found out it\'s twins at our 12-week scan! Still in shock. Any twin moms here?', likedByUser: false, likeCount: 6, timestamp: now - 2 * DAY, isTemplate: true },

    // Newborn Moms Circle
    { id: 'seed-12', nestId: 'tmpl-7', authorName: 'Hannah S.', content: 'Day 5 and breastfeeding finally clicked! Don\'t give up, it gets easier.', likedByUser: false, likeCount: 14, timestamp: now - 1 * DAY, isTemplate: true },
    { id: 'seed-13', nestId: 'tmpl-7', authorName: 'Sofia A.', content: 'The newborn smell is everything. Just spent 20 minutes sniffing my baby\'s head.', likedByUser: false, likeCount: 10, timestamp: now - 2 * DAY, isTemplate: true },

    // Gentle Parenting
    { id: 'seed-14', nestId: 'tmpl-8', authorName: 'Kate J.', content: 'Reading "The Whole-Brain Child" and it\'s changing how I think about tantrums already.', likedByUser: false, likeCount: 5, timestamp: now - 3 * DAY, isTemplate: true },
    { id: 'seed-15', nestId: 'tmpl-8', authorName: 'Diana M.', content: 'Reminder: you don\'t have to be perfect. Repair is part of gentle parenting too.', likedByUser: false, likeCount: 9, timestamp: now - 5 * DAY, isTemplate: true },
  ];
}
