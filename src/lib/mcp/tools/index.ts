/**
 * Tool registry - centralized registration of all MCP tools
 */

import { ToolDefinition, ToolRegistry } from '@/types/agent';

// Import tool definitions and executors
import { toolDefinition as getGoalsDefinition, executeGetGoals } from './getGoals';
import { toolDefinition as getGoalByIdDefinition, executeGetGoalById } from './getGoalById';
import { toolDefinition as createGoalDefinition, executeCreateGoal } from './createGoal';
import { toolDefinition as updateGoalDefinition, executeUpdateGoal } from './updateGoal';
import { toolDefinition as deleteGoalDefinition, executeDeleteGoal } from './deleteGoal';
import { toolDefinition as createTaskDefinition, executeCreateTask } from './createTask';
import { toolDefinition as updateTaskDefinition, executeUpdateTask } from './updateTask';
import { toolDefinition as completeTaskDefinition, executeCompleteTask } from './completeTask';
import { toolDefinition as addSubstepDefinition, executeAddSubstep } from './addSubstep';
import { toolDefinition as completeSubstepDefinition, executeCompleteSubstep } from './completeSubstep';
import { toolDefinition as getStreaksDefinition, executeGetStreaks } from './getStreaks';
import { toolDefinition as getActivityDefinition, executeGetActivity } from './getActivity';
import { toolDefinition as getFriendsDefinition, executeGetFriends } from './getFriends';
import { toolDefinition as getContextDefinition, executeGetContext } from './getContext';
import { toolDefinition as updateGoalIconDefinition, executeUpdateGoalIcon } from './updateGoalIcon';
import { toolDefinition as deleteTaskDefinition, executeDeleteTask } from './deleteTask';
import { toolDefinition as deleteSubstepDefinition, executeDeleteSubstep } from './deleteSubstep';
import { toolDefinition as getProfileDefinition, executeGetProfile } from './getProfile';
import { toolDefinition as updateProfileDefinition, executeUpdateProfile } from './updateProfile';
import { toolDefinition as getFriendProfileDefinition, executeGetFriendProfile } from './getFriendProfile';
import { toolDefinition as removeFriendDefinition, executeRemoveFriend } from './removeFriend';
import { toolDefinition as createInvitationDefinition, executeCreateInvitation } from './createInvitation';
import { toolDefinition as getInvitationsDefinition, executeGetInvitations } from './getInvitations';
import { toolDefinition as getFeedDefinition, executeGetFeed } from './getFeed';
import { toolDefinition as addFeedCommentDefinition, executeAddFeedComment } from './addFeedComment';
import { toolDefinition as toggleFeedCheerDefinition, executeToggleFeedCheer } from './toggleFeedCheer';
import { toolDefinition as shareGoalTemplateDefinition, executeShareGoalTemplate } from './shareGoalTemplate';
import { toolDefinition as getSharedTemplatesDefinition, executeGetSharedTemplates } from './getSharedTemplates';
import { toolDefinition as forkGoalTemplateDefinition, executeForkGoalTemplate } from './forkGoalTemplate';
import { toolDefinition as updateGoalTemplateDefinition, executeUpdateGoalTemplate } from './updateGoalTemplate';
import { toolDefinition as deleteGoalTemplateDefinition, executeDeleteGoalTemplate } from './deleteGoalTemplate';
import { toolDefinition as createCampaignDefinition, executeCreateCampaign } from './createCampaign';
import { toolDefinition as getCampaignsDefinition, executeGetCampaigns } from './getCampaigns';
import { toolDefinition as generatePostContentDefinition, executeGeneratePostContent } from './generatePostContent';

/**
 * Array of all tool definitions
 */
export const tools: ToolDefinition[] = [
  getGoalsDefinition,
  getGoalByIdDefinition,
  createGoalDefinition,
  updateGoalDefinition,
  deleteGoalDefinition,
  createTaskDefinition,
  updateTaskDefinition,
  completeTaskDefinition,
  addSubstepDefinition,
  completeSubstepDefinition,
  getStreaksDefinition,
  getActivityDefinition,
  getFriendsDefinition,
  getContextDefinition,
  updateGoalIconDefinition,
  deleteTaskDefinition,
  deleteSubstepDefinition,
  getProfileDefinition,
  updateProfileDefinition,
  getFriendProfileDefinition,
  removeFriendDefinition,
  createInvitationDefinition,
  getInvitationsDefinition,
  getFeedDefinition,
  addFeedCommentDefinition,
  toggleFeedCheerDefinition,
  shareGoalTemplateDefinition,
  getSharedTemplatesDefinition,
  forkGoalTemplateDefinition,
  updateGoalTemplateDefinition,
  deleteGoalTemplateDefinition,
  createCampaignDefinition,
  getCampaignsDefinition,
  generatePostContentDefinition,
];

/**
 * Tool registry mapping tool names to executors
 */
// Tool executors have specifically-typed args internally; the registry uses a
// generic Record<string, unknown> signature. Runtime validation is handled by
// the JSON schema on each tool definition, so the cast is safe.
export const toolExecutors = {
  'get-goals': {
    definition: getGoalsDefinition,
    executor: executeGetGoals,
  },
  'get-goal-by-id': {
    definition: getGoalByIdDefinition,
    executor: executeGetGoalById,
  },
  'create-goal': {
    definition: createGoalDefinition,
    executor: executeCreateGoal,
  },
  'update-goal': {
    definition: updateGoalDefinition,
    executor: executeUpdateGoal,
  },
  'delete-goal': {
    definition: deleteGoalDefinition,
    executor: executeDeleteGoal,
  },
  'create-task': {
    definition: createTaskDefinition,
    executor: executeCreateTask,
  },
  'update-task': {
    definition: updateTaskDefinition,
    executor: executeUpdateTask,
  },
  'complete-task': {
    definition: completeTaskDefinition,
    executor: executeCompleteTask,
  },
  'add-substep': {
    definition: addSubstepDefinition,
    executor: executeAddSubstep,
  },
  'complete-substep': {
    definition: completeSubstepDefinition,
    executor: executeCompleteSubstep,
  },
  'get-streaks': {
    definition: getStreaksDefinition,
    executor: executeGetStreaks,
  },
  'get-activity': {
    definition: getActivityDefinition,
    executor: executeGetActivity,
  },
  'get-friends': {
    definition: getFriendsDefinition,
    executor: executeGetFriends,
  },
  'get-conversation-context': {
    definition: getContextDefinition,
    executor: executeGetContext,
  },
  'update-goal-icon': {
    definition: updateGoalIconDefinition,
    executor: executeUpdateGoalIcon,
  },
  'delete-task': {
    definition: deleteTaskDefinition,
    executor: executeDeleteTask,
  },
  'delete-substep': {
    definition: deleteSubstepDefinition,
    executor: executeDeleteSubstep,
  },
  'get-profile': {
    definition: getProfileDefinition,
    executor: executeGetProfile,
  },
  'update-profile': {
    definition: updateProfileDefinition,
    executor: executeUpdateProfile,
  },
  'get-friend-profile': {
    definition: getFriendProfileDefinition,
    executor: executeGetFriendProfile,
  },
  'remove-friend': {
    definition: removeFriendDefinition,
    executor: executeRemoveFriend,
  },
  'create-invitation': {
    definition: createInvitationDefinition,
    executor: executeCreateInvitation,
  },
  'get-invitations': {
    definition: getInvitationsDefinition,
    executor: executeGetInvitations,
  },
  'get-feed': {
    definition: getFeedDefinition,
    executor: executeGetFeed,
  },
  'add-feed-comment': {
    definition: addFeedCommentDefinition,
    executor: executeAddFeedComment,
  },
  'toggle-feed-cheer': {
    definition: toggleFeedCheerDefinition,
    executor: executeToggleFeedCheer,
  },
  'share-goal-template': {
    definition: shareGoalTemplateDefinition,
    executor: executeShareGoalTemplate,
  },
  'get-shared-templates': {
    definition: getSharedTemplatesDefinition,
    executor: executeGetSharedTemplates,
  },
  'fork-goal-template': {
    definition: forkGoalTemplateDefinition,
    executor: executeForkGoalTemplate,
  },
  'update-goal-template': {
    definition: updateGoalTemplateDefinition,
    executor: executeUpdateGoalTemplate,
  },
  'delete-goal-template': {
    definition: deleteGoalTemplateDefinition,
    executor: executeDeleteGoalTemplate,
  },
  'create-campaign': {
    definition: createCampaignDefinition,
    executor: executeCreateCampaign,
  },
  'get-campaigns': {
    definition: getCampaignsDefinition,
    executor: executeGetCampaigns,
  },
  'generate-post-content': {
    definition: generatePostContentDefinition,
    executor: executeGeneratePostContent,
  },
} as unknown as ToolRegistry;

/**
 * Get tool executor by name
 */
export function getToolExecutor(toolName: string) {
  return toolExecutors[toolName]?.executor;
}

/**
 * Check if tool executor exists
 */
export function hasToolExecutor(toolName: string): boolean {
  return toolName in toolExecutors;
}
