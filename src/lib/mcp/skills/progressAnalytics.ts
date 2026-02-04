/**
 * Progress Analytics Skill - Velocity, trends, and projections
 */

import { SkillDefinition, ToolResult } from '@/types/agent';
import { executeGetGoals } from '../tools/getGoals';
import { executeGetActivity } from '../tools/getActivity';

export const skillDefinition: SkillDefinition = {
  name: 'analyze-progress',
  description: 'Analyzes goal progress and provides insights, velocity trends, and projections.',
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

      // Get recent activity (last 30 entries)
      const activityResult = await executeGetActivity({ limit: 30 }, userId);
      if (!activityResult.success) {
        return activityResult;
      }

      const goals = goalsResult.data || [];
      const activities = activityResult.data || [];

      // Calculate completion velocity (tasks completed per day)
      const completedActivities = activities.filter((a: any) =>
        a.type === 'task_completed' || a.type === 'substep_completed'
      );

      let velocity = 0;
      if (completedActivities.length > 0) {
        const oldestActivity = new Date(completedActivities[completedActivities.length - 1].timestamp);
        const newestActivity = new Date(completedActivities[0].timestamp);
        const daysDiff = Math.max(
          1,
          Math.floor((newestActivity.getTime() - oldestActivity.getTime()) / (1000 * 60 * 60 * 24))
        );
        velocity = completedActivities.length / daysDiff;
      }

      // Calculate remaining tasks
      const totalTasks = goals.reduce((sum: number, goal: any) => sum + goal.totalTasks, 0);
      const completedTasks = goals.reduce((sum: number, goal: any) => sum + goal.completedTasks, 0);
      const remainingTasks = totalTasks - completedTasks;

      // Project completion date
      let projectedDays = 0;
      let projectedDate = null;
      if (velocity > 0 && remainingTasks > 0) {
        projectedDays = Math.ceil(remainingTasks / velocity);
        const future = new Date();
        future.setDate(future.getDate() + projectedDays);
        projectedDate = future.toISOString().split('T')[0];
      }

      // Weekly progress (group by week)
      const weeklyData: Record<string, number> = {};
      completedActivities.forEach((activity: any) => {
        const date = new Date(activity.timestamp);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Get Sunday of that week
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
      });

      const analytics = {
        velocity: Math.round(velocity * 100) / 100,
        remainingTasks,
        projectedCompletion: {
          days: projectedDays,
          date: projectedDate,
        },
        weeklyProgress: Object.entries(weeklyData).map(([week, count]) => ({
          week,
          tasksCompleted: count,
        })),
        recentActivity: activities.slice(0, 10),
      };

      // Format message
      let message = `📈 **Progress Analytics**\n\n`;
      message += `**Velocity:**\n`;
      message += `- Tasks per day: ${analytics.velocity}\n`;
      message += `- Remaining tasks: ${remainingTasks}\n\n`;

      if (projectedDate) {
        message += `**Projection:**\n`;
        message += `- Estimated completion in ${projectedDays} days\n`;
        message += `- Projected date: ${projectedDate}\n\n`;
      } else if (remainingTasks > 0) {
        message += `**Projection:**\n`;
        message += `- Complete more tasks to establish a velocity trend\n\n`;
      } else {
        message += `**Status:**\n`;
        message += `- All tasks completed! 🎉\n\n`;
      }

      if (analytics.weeklyProgress.length > 0) {
        message += `**Weekly Progress (last ${analytics.weeklyProgress.length} weeks):**\n`;
        analytics.weeklyProgress.slice(0, 4).forEach((week: any) => {
          message += `- ${week.week}: ${week.tasksCompleted} tasks\n`;
        });
      }

      return {
        success: true,
        data: analytics,
        message,
      };
    } catch (error) {
      console.error('Error in progressAnalytics skill:', error);
      return {
        success: false,
        error: 'Skill execution error',
        message: 'Failed to analyze progress',
      };
    }
  },
};
