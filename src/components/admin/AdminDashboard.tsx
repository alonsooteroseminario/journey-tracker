"use client";

import { useGetAnalyticsQuery } from "@/store/slices/adminSlice";
import { StatCards } from "./StatCards";
import { AnalyticsCharts } from "./AnalyticsCharts";

export function AdminDashboard() {
  const { data: analytics, isLoading, error } = useGetAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-2">Loading analytics data...</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-border-strong border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Fetching data from database...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-red-600 mt-2">Failed to load analytics data</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">
            Error loading analytics. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">
          Overview of your application metrics and analytics
        </p>
      </div>

      {/* Stats Cards */}
      <StatCards stats={analytics.stats} />

      {/* Charts */}
      <AnalyticsCharts
        userGrowth={analytics.userGrowth}
        goalActivity={analytics.goalActivity}
        taskActivity={analytics.taskActivity}
        topCategories={analytics.topCategories}
      />

      {/* Model Counts Table */}
      <div className="bg-surface rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">
            Database Overview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-200">
              {analytics.modelCounts.map((model) => (
                <tr key={model.model} className="hover:bg-surface-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {model.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right font-semibold">
                    {model.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Users Table */}
      {analytics.topUsers.length > 0 && (
        <div className="bg-surface rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">
              Most Active Users
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Goals
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Tasks Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-gray-200">
                {analytics.topUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-surface-muted">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {user.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                      {user.goalsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                      {user.tasksCompleted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
