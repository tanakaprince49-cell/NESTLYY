import type { Nest, NestPost } from '../types.ts';

export const TEMPLATE_NESTS: Nest[] = [
  { id: 'tmpl-1', name: 'First Trimester Moms', description: 'Navigating the early weeks together. Morning sickness, first scans, and all the emotions.', category: 'trimester', emoji: '🌱', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-2', name: 'Second Trimester Club', description: 'Feeling those kicks! Sharing bump pics, gender reveals, and the glow-up phase.', category: 'trimester', emoji: '🦋', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-3', name: 'Third Trimester Warriors', description: 'Almost there! Hospital bags, birth plans, and counting down the days.', category: 'trimester', emoji: '🏔️', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-4', name: 'Vegan Pregnancy', description: 'Plant-based nutrition tips, recipes, and making sure baby gets everything they need.', category: 'diet', emoji: '🥑', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-5', name: 'Working Moms', description: 'Balancing career and bump. Maternity leave tips, boss conversations, and desk stretches.', category: 'lifestyle', emoji: '💼', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-6', name: 'Twin Pregnancy', description: 'Double the joy, double the questions. Support from moms who get it.', category: 'support', emoji: '👯', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-7', name: 'Newborn Moms Circle', description: 'First weeks with baby. Sleep deprivation, breastfeeding wins, and tiny toes.', category: 'postpartum', emoji: '👶', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
  { id: 'tmpl-8', name: 'Gentle Parenting', description: 'Raising little ones with empathy, patience, and connection-first approach.', category: 'support', emoji: '🤲', memberCount: 0, isTemplate: true, createdAt: 0, creatorUid: null },
];

const DAY = 86400000;
const SYSTEM_UID = 'system';
const SYSTEM_NAME = 'Village Team';

export function getTemplatePosts(): NestPost[] {
  const now = Date.now();
  const base = (id: string, nestId: string, content: string, likeCount: number, daysAgo: number): NestPost => ({
    id, nestId, authorUid: SYSTEM_UID, authorName: SYSTEM_NAME,
    content, likedBy: [], likeCount, commentCount: 0, createdAt: now - daysAgo * DAY, isTemplate: true,
  });
  return [
    base('seed-1', 'tmpl-1', 'Welcome! Share how you are feeling in your first trimester. Morning sickness, scans, or the flood of emotions -- this space is for you.', 7, 2),
    base('seed-2', 'tmpl-1', 'Tip: ginger tea and small frequent meals help many people with early nausea. What has worked for you?', 4, 5),

    base('seed-3', 'tmpl-2', 'The second trimester is often the energy rebound phase. Share your bump updates and first kicks here.', 12, 1),
    base('seed-4', 'tmpl-2', 'Vivid pregnancy dreams are a common thing in the second trimester. Anyone else noticing this?', 6, 3),

    base('seed-5', 'tmpl-3', 'Hospital bag time! What are your must-haves? Share your tips with other third trimester members.', 9, 1),
    base('seed-6', 'tmpl-3', 'The final stretch can feel long. Remind yourself: your body is doing amazing work.', 5, 4),

    base('seed-7', 'tmpl-4', 'Vegan pregnancy tip: lentils + vitamin C rich foods boost iron absorption. Share your favorite meals.', 8, 2),
    base('seed-8', 'tmpl-4', 'Algae-based DHA supplements are a great plant-based option. Talk to your care provider about what fits your needs.', 3, 6),

    base('seed-9', 'tmpl-5', 'Navigating maternity leave conversations can feel daunting. Share what worked (or did not) at your workplace.', 11, 1),
    base('seed-10', 'tmpl-5', 'Standing desks, pregnancy balls, and regular breaks can make the workday much more comfortable.', 7, 3),

    base('seed-11', 'tmpl-6', 'Welcome twin parents! Share your journey, questions, and the unique joys of expecting two.', 6, 2),

    base('seed-12', 'tmpl-7', 'Breastfeeding has a learning curve for both you and baby. It is okay to ask for help -- lactation consultants can be a lifesaver.', 14, 1),
    base('seed-13', 'tmpl-7', 'The newborn phase is intense and beautiful. Small wins count. Share yours here.', 10, 2),

    base('seed-14', 'tmpl-8', 'Gentle parenting starts with understanding your own reactions. Books like "The Whole-Brain Child" are a great starting point.', 5, 3),
    base('seed-15', 'tmpl-8', 'Reminder: you do not have to be perfect. Repair and reconnection are part of gentle parenting too.', 9, 5),
  ];
}
