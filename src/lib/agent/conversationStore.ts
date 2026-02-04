/**
 * In-memory conversation context store
 * Tracks recent goals, tasks, and session data per user
 */

import { ConversationContext } from '@/types/agent';

class ConversationStore {
  private contexts: Map<string, ConversationContext> = new Map();

  /**
   * Get or create conversation context for a user
   */
  getContext(userId: string): ConversationContext {
    if (!this.contexts.has(userId)) {
      this.contexts.set(userId, {
        userId,
        recentGoals: [],
        sessionStart: new Date(),
        messageCount: 0,
      });
    }
    return this.contexts.get(userId)!;
  }

  /**
   * Set the last accessed goal
   */
  setLastGoal(userId: string, goalId: string): void {
    const context = this.getContext(userId);
    context.lastGoalId = goalId;

    // Add to recent goals if not already present
    if (!context.recentGoals.includes(goalId)) {
      context.recentGoals.unshift(goalId);
      // Keep only the 10 most recent
      context.recentGoals = context.recentGoals.slice(0, 10);
    }
  }

  /**
   * Set the last accessed task
   */
  setLastTask(userId: string, taskId: string): void {
    const context = this.getContext(userId);
    context.lastTaskId = taskId;
  }

  /**
   * Increment message count
   */
  incrementMessages(userId: string): void {
    const context = this.getContext(userId);
    context.messageCount++;
  }

  /**
   * Clear context for a user
   */
  clearContext(userId: string): void {
    this.contexts.delete(userId);
  }

  /**
   * Get a human-readable summary of the context
   */
  getContextSummary(userId: string): string {
    const context = this.getContext(userId);

    const parts: string[] = [];

    if (context.lastGoalId) {
      parts.push(`Last goal: ${context.lastGoalId}`);
    }

    if (context.lastTaskId) {
      parts.push(`Last task: ${context.lastTaskId}`);
    }

    if (context.recentGoals.length > 0) {
      parts.push(`Recent goals: ${context.recentGoals.join(', ')}`);
    }

    parts.push(`Messages: ${context.messageCount}`);

    const sessionDuration = Math.floor(
      (Date.now() - context.sessionStart.getTime()) / 1000 / 60
    );
    parts.push(`Session: ${sessionDuration} minutes`);

    return parts.join(' | ');
  }
}

// Singleton instance
export const conversationStore = new ConversationStore();
