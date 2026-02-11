export interface AdminStats {
  totalUsers: number;
  totalGoals: number;
  totalTasks: number;
  activeStreaks: number;
  totalTemplates: number;
  totalFeedItems: number;
  totalInvitations: number;
  newUsersToday: number;
  goalsCreatedToday: number;
  tasksCompletedToday: number;
}

export interface ModelCount {
  model: string;
  count: number;
  label: string;
}

export interface TimeSeriesDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
  label?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export type TimeRange = "7d" | "30d" | "90d";

export interface AnalyticsData {
  stats: AdminStats;
  modelCounts: ModelCount[];
  userGrowth: TimeSeriesDataPoint[];
  goalActivity: TimeSeriesDataPoint[];
  taskActivity: TimeSeriesDataPoint[];
  topCategories: { category: string; count: number }[];
  topUsers: { userId: string; userName: string; goalsCount: number; tasksCompleted: number }[];
}

// Social Media Types
export type SocialPlatform = "twitter" | "instagram";

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  metadata: any;
  isActive: boolean;
  tokenExpiresAt: Date | null;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccountWithTokens extends SocialAccount {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

export interface ConnectSocialAccountRequest {
  platform: SocialPlatform;
  code: string; // OAuth authorization code
  redirectUri: string;
}

export interface SocialOAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string[];
}

export interface SocialPost {
  id: string;
  userId: string;
  accountId: string;
  campaignId: string | null;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  status: "draft" | "scheduled" | "posted" | "failed";
  scheduledFor: Date | null;
  postedAt: Date | null;
  platformPostId: string | null;
  postUrl: string | null;
  analytics: any;
  linkedGoalId: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPostWithAccount extends SocialPost {
  account: {
    id: string;
    platform: SocialPlatform;
    username: string;
    displayName: string | null;
    profileImage: string | null;
  };
}

export interface CreatePostRequest {
  accountId: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledFor?: string;
  linkedGoalId?: string;
}

export interface UpdatePostRequest {
  content?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledFor?: string | null;
  status?: "draft" | "scheduled";
  linkedGoalId?: string | null;
}

export interface MarketingCampaign {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetGoals: string[];
  platforms: SocialPlatform[];
  postingSchedule: any;
  status: "draft" | "active" | "paused" | "completed";
  startDate: Date | null;
  endDate: Date | null;
  contentTemplates: any;
  createdAt: Date;
  updatedAt: Date;
}

// Video Types
export type VideoTemplateType = "goal_progress" | "streak_milestone" | "task_completion";

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  templateType: VideoTemplateType;
  sourceData: any;
  status: "pending" | "rendering" | "completed" | "failed";
  renderJobId: string | null;
  duration: number | null;
  width: number;
  height: number;
  fps: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  fileSize: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  templateType: VideoTemplateType;
  sourceData: any;
  width?: number;
  height?: number;
  fps?: number;
}

// Recording Types
export type RecordingFlowType = "goal_creation" | "task_completion" | "dashboard_tour" | "custom";

export interface Recording {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  flowType: RecordingFlowType;
  flowConfig: any;
  status: "pending" | "recording" | "completed" | "failed";
  videoUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecordingRequest {
  title: string;
  description?: string;
  flowType: RecordingFlowType;
  flowConfig?: any;
}
