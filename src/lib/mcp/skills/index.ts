/**
 * Skills registry
 */

import { SkillDefinition } from '@/types/agent';
import { skillDefinition as goalSummary } from './goalSummary';
import { skillDefinition as progressAnalytics } from './progressAnalytics';
import { skillDefinition as smartGoalCreator } from './smartGoalCreator';

/**
 * Array of all skill definitions
 */
export const skills: SkillDefinition[] = [
  goalSummary,
  progressAnalytics,
  smartGoalCreator,
];
