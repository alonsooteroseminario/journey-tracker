/**
 * Goal Summary Skill - Aggregated progress report
 */

import { SkillDefinition, ToolResult } from '@/types/agent';
import { executeGetGoals } from '../tools/getGoals';
import { executeGetStreaks } from '../tools/getStreaks';

export const skillDefinition: SkillDefinition = {
  name: 'generate-goal-summary',
  description: 'Generates a comprehensive summary of all goals including progress, upcoming tasks, and milestones.',
  execute: async (args: Record<string, any>, userId?: string): Promise<ToolResult> => {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'User ID is required',
        };
      }

      // Get all goals
      const goalsResult = await executeGetGoals({}, userId);
      if (!goalsResult.success) {
        return goalsResult;
      }

      // Get streak data
      const streaksResult = await executeGetStreaks({}, userId);
      if (!streaksResult.success) {
        return streaksResult;
      }

      const goals = goalsResult.data || [];
      const streakData = streaksResult.data;

      // Calculate aggregate statistics
      const totalGoals = goals.length;
      const totalTasks = goals.reduce((sum: number, goal: any) => sum + goal.totalTasks, 0);
      const completedTasks = goals.reduce((sum: number, goal: any) => sum + goal.completedTasks, 0);
      const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Find goals with 100% completion
      const completedGoals = goals.filter((goal: any) => goal.completionPercentage === 100);

      // Find goals in progress (0% < completion < 100%)
      const inProgressGoals = goals.filter(
        (goal: any) => goal.completionPercentage > 0 && goal.completionPercentage < 100
      );

      // Find goals not started (0% completion)
      const notStartedGoals = goals.filter((goal: any) => goal.completionPercentage === 0);

      // Build summary report
      const summary = {
        overview: {
          totalGoals,
          totalTasks,
          completedTasks,
          overallCompletion,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
        },
        goalBreakdown: {
          completed: completedGoals.length,
          inProgress: inProgressGoals.length,
          notStarted: notStartedGoals.length,
        },
        topGoals: goals.slice(0, 5).map((goal: any) => ({
          title: goal.title,
          completion: goal.completionPercentage,
          tasks: `${goal.completedTasks}/${goal.totalTasks}`,
        })),
      };

      // Format message
      let message = `📊 **Goal Summary Report**\n\n`;
      message += `**Overview:**\n`;
      message += `- Total Goals: ${totalGoals}\n`;
      message += `- Total Tasks: ${totalTasks} (${completedTasks} completed)\n`;
      message += `- Overall Progress: ${overallCompletion}%\n`;
      message += `- Current Streak: ${streakData.currentStreak} days\n\n`;

      message += `**Goal Breakdown:**\n`;
      message += `- ✅ Completed: ${completedGoals.length}\n`;
      message += `- 🔄 In Progress: ${inProgressGoals.length}\n`;
      message += `- 📋 Not Started: ${notStartedGoals.length}\n\n`;

      if (summary.topGoals.length > 0) {
        message += `**Top Goals:**\n`;
        summary.topGoals.forEach((goal: any, i: number) => {
          message += `${i + 1}. ${goal.title} - ${goal.completion}% (${goal.tasks} tasks)\n`;
        });
      }

      return {
        success: true,
        data: summary,
        message,
      };
    } catch (error) {
      console.error('Error in goalSummary skill:', error);
      return {
        success: false,
        error: 'Skill execution error',
        message: 'Failed to generate goal summary',
      };
    }
  },
};
