/**
 * Smart Goal Creator Skill - Create goal from natural language
 */

import { SkillDefinition, ToolResult } from '@/types/agent';
import { executeCreateGoal } from '../tools/createGoal';

export const skillDefinition: SkillDefinition = {
  name: 'smart-create-goal',
  description: 'Intelligently creates a goal from natural language, extracting tasks, dates, and priorities.',
  execute: async (args: Record<string, any>, userId?: string): Promise<ToolResult> => {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'User ID is required',
        };
      }

      // Check if we have extracted data
      const extractedData = args.extractedData || {};

      // Validate required fields
      if (!extractedData.title) {
        return {
          success: false,
          error: 'Validation error',
          message: 'Please provide a title for the goal. For example: "Learn Spanish" or "Run a marathon".',
        };
      }

      // Provide helpful feedback for missing optional fields
      const suggestions: string[] = [];

      if (!extractedData.description) {
        suggestions.push('Consider adding a description to clarify your goal.');
      }

      if (!extractedData.tasks || extractedData.tasks.length === 0) {
        suggestions.push('You can add tasks to break down your goal into smaller steps.');
      }

      if (!extractedData.targetDate) {
        suggestions.push('Setting a target date can help you stay on track.');
      }

      // Delegate to create-goal tool
      const createResult = await executeCreateGoal(extractedData, userId);

      if (createResult.success && suggestions.length > 0) {
        // Append suggestions to the success message
        createResult.message += `\n\n💡 Tips:\n- ${suggestions.join('\n- ')}`;
      }

      return createResult;
    } catch (error) {
      console.error('Error in smartGoalCreator skill:', error);
      return {
        success: false,
        error: 'Skill execution error',
        message: 'Failed to create goal',
      };
    }
  },
};
