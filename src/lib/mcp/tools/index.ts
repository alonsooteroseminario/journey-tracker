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
];

/**
 * Tool registry mapping tool names to executors
 */
export const toolExecutors: ToolRegistry = {
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
};

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
