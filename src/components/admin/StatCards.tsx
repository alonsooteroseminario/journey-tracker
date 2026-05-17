"use client";

import type { AdminStats } from "@/types/admin";

interface StatCardsProps {
  stats: AdminStats;
}

const statConfig = [
  {
    key: "totalUsers" as keyof AdminStats,
    label: "Total Users",
    icon: "👥",
    color: "blue",
    trend: "newUsersToday" as keyof AdminStats,
    trendLabel: "new today",
  },
  {
    key: "totalGoals" as keyof AdminStats,
    label: "Total Goals",
    icon: "🎯",
    color: "purple",
    trend: "goalsCreatedToday" as keyof AdminStats,
    trendLabel: "created today",
  },
  {
    key: "activeStreaks" as keyof AdminStats,
    label: "Active Streaks",
    icon: "🔥",
    color: "orange",
  },
  {
    key: "totalTemplates" as keyof AdminStats,
    label: "Templates",
    icon: "📋",
    color: "green",
  },
  {
    key: "totalTasks" as keyof AdminStats,
    label: "Total Tasks",
    icon: "✅",
    color: "indigo",
    trend: "tasksCompletedToday" as keyof AdminStats,
    trendLabel: "completed today",
  },
  {
    key: "totalFeedItems" as keyof AdminStats,
    label: "Feed Items",
    icon: "📢",
    color: "pink",
  },
  {
    key: "totalInvitations" as keyof AdminStats,
    label: "Invitations",
    icon: "✉️",
    color: "teal",
  },
];

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statConfig.map((config) => {
        const value = stats[config.key];
        const trendValue = config.trend ? stats[config.trend] : undefined;

        return (
          <div
            key={config.key}
            className="bg-surface rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{config.icon}</span>
              {trendValue !== undefined && trendValue > 0 && (
                <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <span>↑</span>
                  <span className="font-medium">{trendValue}</span>
                </div>
              )}
            </div>
            <p className="text-text-secondary text-sm mb-1">{config.label}</p>
            <p className="text-3xl font-bold text-text-primary">
              {value.toLocaleString()}
            </p>
            {config.trend && (
              <p className="text-xs text-text-muted mt-2">
                {trendValue} {config.trendLabel}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
