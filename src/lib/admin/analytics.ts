import { prisma } from "@/lib/prisma";
import type { AnalyticsData, AdminStats, ModelCount, TimeSeriesDataPoint } from "@/types/admin";

/**
 * Get comprehensive analytics data for the admin dashboard
 */
export async function getAnalytics(): Promise<AnalyticsData> {
  // Get current date and date ranges
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Parallel queries for better performance
  const [
    totalUsers,
    totalGoals,
    totalStreaks,
    totalTemplates,
    totalFeedItems,
    totalInvitations,
    newUsersToday,
    goalsCreatedToday,
    tasksCompletedToday,
    allGoals,
    recentUsers,
    recentGoals,
    recentActivityLogs,
    topTemplates,
  ] = await Promise.all([
    // Model counts
    prisma.user.count(),
    prisma.goal.count(),
    prisma.streakData.count({ where: { currentStreak: { gt: 0 } } }),
    prisma.goalTemplate.count(),
    prisma.feedItem.count(),
    prisma.invitation.count(),

    // Today's activity
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.goal.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.activityLog.count({
      where: {
        type: "task_completed",
        timestamp: { gte: todayStart },
      },
    }),

    // Data for analysis
    prisma.goal.findMany({
      select: {
        tasks: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.goal.findMany({
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.activityLog.findMany({
      where: {
        type: "task_completed",
        timestamp: { gte: thirtyDaysAgo },
      },
      select: {
        timestamp: true,
      },
    }),
    prisma.goalTemplate.findMany({
      select: {
        category: true,
        forkCount: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { forkCount: "desc" },
      take: 10,
    }),
  ]);

  // Calculate total tasks from goals
  const totalTasks = allGoals.reduce((sum, goal) => {
    const tasks = goal.tasks as unknown as Array<{ id: string }>;
    return sum + (Array.isArray(tasks) ? tasks.length : 0);
  }, 0);

  // Build stats object
  const stats: AdminStats = {
    totalUsers,
    totalGoals,
    totalTasks,
    activeStreaks: totalStreaks,
    totalTemplates,
    totalFeedItems,
    totalInvitations,
    newUsersToday,
    goalsCreatedToday,
    tasksCompletedToday,
  };

  // Model counts for table
  const modelCounts: ModelCount[] = [
    { model: "User", count: totalUsers, label: "Users" },
    { model: "Goal", count: totalGoals, label: "Goals" },
    { model: "Task", count: totalTasks, label: "Tasks" },
    { model: "StreakData", count: totalStreaks, label: "Active Streaks" },
    { model: "GoalTemplate", count: totalTemplates, label: "Templates" },
    { model: "FeedItem", count: totalFeedItems, label: "Feed Items" },
    { model: "Invitation", count: totalInvitations, label: "Invitations" },
  ];

  // User growth time series (last 30 days)
  const userGrowth = generateTimeSeries(recentUsers, 30);

  // Goal activity time series (last 30 days)
  const goalActivity = generateTimeSeries(recentGoals, 30);

  // Task activity time series (last 30 days)
  const taskActivity = generateTaskTimeSeries(recentActivityLogs, 30);

  // Top categories
  const categoryMap = new Map<string, number>();
  topTemplates.forEach((template) => {
    const category = template.category || "Other";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  const topCategories = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top users by goals
  const userGoalCounts = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          goals: true,
        },
      },
    },
    orderBy: {
      goals: {
        _count: "desc",
      },
    },
    take: 5,
  });

  // Calculate completed tasks per user
  const topUsersPromises = userGoalCounts.map(async (user) => {
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      select: { tasks: true },
    });

    const tasksCompleted = goals.reduce((sum, goal) => {
      const tasks = goal.tasks as unknown as Array<{ completed?: boolean }>;
      if (!Array.isArray(tasks)) return sum;
      return sum + tasks.filter((t) => t.completed).length;
    }, 0);

    return {
      userId: user.id,
      userName: user.name,
      goalsCount: user._count.goals,
      tasksCompleted,
    };
  });

  const topUsers = await Promise.all(topUsersPromises);

  return {
    stats,
    modelCounts,
    userGrowth,
    goalActivity,
    taskActivity,
    topCategories,
    topUsers,
  };
}

/**
 * Generate time series data for the last N days
 */
function generateTimeSeries(
  records: Array<{ createdAt: Date }>,
  days: number
): TimeSeriesDataPoint[] {
  const now = new Date();
  const series: TimeSeriesDataPoint[] = [];

  // Create a map of date -> count
  const countMap = new Map<string, number>();
  records.forEach((record) => {
    const dateStr = formatDate(record.createdAt);
    countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
  });

  // Fill in all dates
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    series.push({
      date: dateStr,
      value: countMap.get(dateStr) || 0,
    });
  }

  return series;
}

/**
 * Generate task completion time series
 */
function generateTaskTimeSeries(
  records: Array<{ timestamp: Date }>,
  days: number
): TimeSeriesDataPoint[] {
  const now = new Date();
  const series: TimeSeriesDataPoint[] = [];

  // Create a map of date -> count
  const countMap = new Map<string, number>();
  records.forEach((record) => {
    const dateStr = formatDate(record.timestamp);
    countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
  });

  // Fill in all dates
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    series.push({
      date: dateStr,
      value: countMap.get(dateStr) || 0,
    });
  }

  return series;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
