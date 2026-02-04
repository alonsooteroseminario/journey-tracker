/**
 * Tool selector - filters tools based on user intent to reduce Claude context
 */

import { ToolDefinition } from '@/types/agent';

// Intent keywords mapped to tool categories
const intents = {
  create: ['create', 'add', 'new', 'make', 'start'],
  read: ['show', 'get', 'list', 'view', 'display', 'see', 'what', 'tell me'],
  update: ['update', 'change', 'modify', 'edit', 'rename'],
  delete: ['delete', 'remove', 'discard'],
  complete: ['complete', 'finish', 'done', 'check', 'mark'],
  streak: ['streak', 'consecutive', 'daily'],
  friends: ['friend', 'buddy', 'compare'],
  analytics: ['analytics', 'progress', 'report', 'summary', 'statistics', 'how am i doing'],
  activity: ['activity', 'history', 'log', 'recent'],
};

// Map tool names to intent categories
const toolIntentMap: Record<string, string[]> = {
  'get-goals': ['read'],
  'get-goal-by-id': ['read'],
  'create-goal': ['create'],
  'update-goal': ['update'],
  'delete-goal': ['delete'],
  'update-task': ['update', 'complete'],
  'complete-task': ['complete'],
  'add-substep': ['create'],
  'complete-substep': ['complete'],
  'get-streaks': ['streak', 'read'],
  'get-activity': ['activity', 'read'],
  'log-activity': ['activity'],
  'get-friends': ['friends', 'read'],
  'get-conversation-context': ['read'],
  'generate-goal-summary': ['analytics', 'read'],
  'analyze-progress': ['analytics'],
  'smart-create-goal': ['create'],
};

/**
 * Detect intent from user message
 */
export function detectIntent(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const detectedIntents: string[] = [];

  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      detectedIntents.push(intent);
    }
  }

  return detectedIntents;
}

/**
 * Filter tools based on detected intent
 * Returns all tools if no specific intent detected
 */
export function selectTools(
  allTools: ToolDefinition[],
  message: string
): ToolDefinition[] {
  const detectedIntents = detectIntent(message);

  // If no intent detected, return all tools
  if (detectedIntents.length === 0) {
    return allTools;
  }

  // Filter tools that match any detected intent
  const selectedTools = allTools.filter((tool) => {
    const toolIntents = toolIntentMap[tool.name] || [];
    return toolIntents.some((intent) => detectedIntents.includes(intent));
  });

  // Always include context tool
  const contextTool = allTools.find((t) => t.name === 'get-conversation-context');
  if (contextTool && !selectedTools.includes(contextTool)) {
    selectedTools.push(contextTool);
  }

  // If filtering resulted in too few tools, return all tools
  if (selectedTools.length < 3) {
    return allTools;
  }

  return selectedTools;
}
