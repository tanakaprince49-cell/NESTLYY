import type { Nest, NestPost } from '../types.ts';

export const TEMPLATE_NESTS: Nest[] = [
  { id: 'tmpl-1', name: 'First Trimester Moms', description: 'Navigating the early weeks together. Morning sickness, first scans, and all the emotions.', category: 'trimester', emoji: '🌱', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-2', name: 'Second Trimester Club', description: 'Feeling those kicks! Sharing bump pics, gender reveals, and the glow-up phase.', category: 'trimester', emoji: '🦋', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-3', name: 'Third Trimester Warriors', description: 'Almost there! Hospital bags, birth plans, and counting down the days.', category: 'trimester', emoji: '🏔️', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-4', name: 'Vegan Pregnancy', description: 'Plant-based nutrition tips, recipes, and making sure baby gets everything they need.', category: 'diet', emoji: '🥑', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-5', name: 'Working Moms', description: 'Balancing career and bump. Maternity leave tips, boss conversations, and desk stretches.', category: 'lifestyle', emoji: '💼', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-6', name: 'Twin Pregnancy', description: 'Double the joy, double the questions. Support from moms who get it.', category: 'support', emoji: '👯', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-7', name: 'Newborn Moms Circle', description: 'First weeks with baby. Sleep deprivation, breastfeeding wins, and tiny toes.', category: 'postpartum', emoji: '👶', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
  { id: 'tmpl-8', name: 'Gentle Parenting', description: 'Raising little ones with empathy, patience, and connection-first approach.', category: 'support', emoji: '🤲', memberCount: 0, isTemplate: true, createdAt: 0, admins: [], hasNoAdmin: true },
];

const DAY = 86400000;

export function getTemplatePosts(): NestPost[] {
  const now = Date.now();
  return [];
}
