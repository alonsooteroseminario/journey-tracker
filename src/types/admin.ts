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
