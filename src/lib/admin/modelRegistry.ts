import { prisma } from "@/lib/prisma";

/**
 * Model metadata registry for the database explorer
 * Maps model names to their Prisma delegates, display columns, and search fields
 */

export interface ModelMetadata {
  name: string;
  label: string;
  delegate: any; // Prisma delegate
  displayColumns: string[]; // Columns to show in table
  searchableFields: string[]; // Fields that can be searched
  sortableFields: string[]; // Fields that can be sorted
  jsonFields: string[]; // Fields that contain JSON data
}

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  User: {
    name: "User",
    label: "Users",
    delegate: prisma.user,
    displayColumns: ["id", "name", "email", "clerkId", "joinedDate", "lastLoginDate"],
    searchableFields: ["name", "email", "clerkId"],
    sortableFields: ["name", "email", "joinedDate", "lastLoginDate", "createdAt"],
    jsonFields: [],
  },
  Goal: {
    name: "Goal",
    label: "Goals",
    delegate: prisma.goal,
    displayColumns: ["id", "title", "userId", "startDate", "targetDate", "isPublic", "createdAt"],
    searchableFields: ["title", "description"],
    sortableFields: ["title", "createdAt", "startDate", "targetDate"],
    jsonFields: ["tasks", "phases", "budget", "timeline", "documents", "resources"],
  },
  StreakData: {
    name: "StreakData",
    label: "Streak Data",
    delegate: prisma.streakData,
    displayColumns: ["id", "userId", "currentStreak", "longestStreak", "lastActivityDate"],
    searchableFields: [],
    sortableFields: ["currentStreak", "longestStreak", "lastActivityDate", "createdAt"],
    jsonFields: [],
  },
  Friendship: {
    name: "Friendship",
    label: "Friendships",
    delegate: prisma.friendship,
    displayColumns: ["id", "userId", "friendId", "status", "addedDate"],
    searchableFields: ["status"],
    sortableFields: ["addedDate", "status", "createdAt"],
    jsonFields: [],
  },
  Invitation: {
    name: "Invitation",
    label: "Invitations",
    delegate: prisma.invitation,
    displayColumns: ["id", "userId", "code", "used", "usedBy", "expiresAt"],
    searchableFields: ["code", "usedBy"],
    sortableFields: ["expiresAt", "used", "createdAt"],
    jsonFields: [],
  },
  SocialShare: {
    name: "SocialShare",
    label: "Social Shares",
    delegate: prisma.socialShare,
    displayColumns: ["id", "userId", "platform", "message", "streakAtTime", "timestamp"],
    searchableFields: ["platform", "message"],
    sortableFields: ["platform", "timestamp"],
    jsonFields: [],
  },
  ActivityLog: {
    name: "ActivityLog",
    label: "Activity Logs",
    delegate: prisma.activityLog,
    displayColumns: ["id", "userId", "type", "action", "goalId", "timestamp"],
    searchableFields: ["type", "action"],
    sortableFields: ["type", "timestamp"],
    jsonFields: ["metadata"],
  },
  EmailPreferences: {
    name: "EmailPreferences",
    label: "Email Preferences",
    delegate: prisma.emailPreferences,
    displayColumns: ["id", "userId", "enabled", "frequency"],
    searchableFields: ["frequency"],
    sortableFields: ["enabled", "frequency", "createdAt"],
    jsonFields: [],
  },
  FeedItem: {
    name: "FeedItem",
    label: "Feed Items",
    delegate: prisma.feedItem,
    displayColumns: ["id", "userId", "type", "content", "visibility", "createdAt"],
    searchableFields: ["type", "content"],
    sortableFields: ["type", "visibility", "createdAt"],
    jsonFields: ["metadata"],
  },
  FeedComment: {
    name: "FeedComment",
    label: "Feed Comments",
    delegate: prisma.feedComment,
    displayColumns: ["id", "feedItemId", "userId", "content", "createdAt"],
    searchableFields: ["content"],
    sortableFields: ["createdAt"],
    jsonFields: [],
  },
  FeedCheer: {
    name: "FeedCheer",
    label: "Feed Cheers",
    delegate: prisma.feedCheer,
    displayColumns: ["id", "feedItemId", "userId", "emoji", "createdAt"],
    searchableFields: ["emoji"],
    sortableFields: ["createdAt"],
    jsonFields: [],
  },
  GoalTemplate: {
    name: "GoalTemplate",
    label: "Goal Templates",
    delegate: prisma.goalTemplate,
    displayColumns: ["id", "authorId", "title", "difficulty", "category", "isPublished", "forkCount"],
    searchableFields: ["title", "description", "difficulty", "category"],
    sortableFields: ["title", "difficulty", "forkCount", "isPublished", "createdAt"],
    jsonFields: ["tasks", "phases", "timeline", "resources", "tags"],
  },
  GoalFork: {
    name: "GoalFork",
    label: "Goal Forks",
    delegate: prisma.goalFork,
    displayColumns: ["id", "templateId", "userId", "newGoalId", "forkedAt"],
    searchableFields: [],
    sortableFields: ["forkedAt"],
    jsonFields: [],
  },
  ForkRequest: {
    name: "ForkRequest",
    label: "Fork Requests",
    delegate: prisma.forkRequest,
    displayColumns: ["id", "templateId", "requesterId", "status", "createdAt"],
    searchableFields: ["status", "message"],
    sortableFields: ["status", "createdAt"],
    jsonFields: [],
  },
};

/**
 * Get model metadata by name
 */
export function getModelMetadata(modelName: string): ModelMetadata | undefined {
  return MODEL_REGISTRY[modelName];
}

/**
 * Get all model names
 */
export function getAllModelNames(): string[] {
  return Object.keys(MODEL_REGISTRY);
}

/**
 * Validate if a model name is valid
 */
export function isValidModel(modelName: string): boolean {
  return modelName in MODEL_REGISTRY;
}
