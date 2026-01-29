"use client";

import { useMemo } from "react";
import { AnalyticsData } from "@/types";
import { formatCurrency } from "@/lib/storage";

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
  goalTitle?: string;
}

export function AnalyticsDashboard({ analytics, goalTitle }: AnalyticsDashboardProps) {
  // Calculate completion percentage for the circular progress
  const circumference = 2 * Math.PI * 45;
  const progressOffset = circumference - (analytics.completionRate / 100) * circumference;

  // Format projected date nicely
  const formattedProjectedDate = analytics.projectedCompletionDate
    ? new Date(analytics.projectedCompletionDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not enough data";

  // Get max values for chart scaling
  const maxWeeklyTasks = Math.max(...analytics.weeklyProgress.map((w) => w.tasksCompleted), 1);
  const maxCostByPhase = Math.max(...analytics.costByPhase.map((c) => Math.max(c.estimated, c.actual)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>📊</span>
          Analytics Dashboard
        </h2>
        {goalTitle && <p className="text-white/80 mt-1">{goalTitle}</p>}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Completion Rate"
          value={`${Math.round(analytics.completionRate)}%`}
          subtitle={`${analytics.completedTasks} of ${analytics.totalTasks} tasks`}
          icon="📈"
          color="blue"
        />
        <MetricCard
          title="Avg. Tasks/Day"
          value={analytics.averageTasksPerDay.toFixed(1)}
          subtitle="Based on active days"
          icon="⚡"
          color="amber"
        />
        <MetricCard
          title="Budget Spent"
          value={formatCurrency(analytics.totalActualCost)}
          subtitle={`of ${formatCurrency(analytics.totalEstimatedCost)} estimated`}
          icon="💰"
          color="emerald"
        />
        <MetricCard
          title="Days Remaining"
          value={analytics.daysRemaining?.toString() || "—"}
          subtitle="At current pace"
          icon="📅"
          color="purple"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Circular Progress */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Overall Progress</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="45"
                  stroke="url(#progressGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">
                  {Math.round(analytics.completionRate)}%
                </span>
                <span className="text-sm text-gray-500">Complete</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{analytics.completedTasks}</p>
              <p className="text-sm text-gray-500">Tasks Done</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{analytics.totalTasks - analytics.completedTasks}</p>
              <p className="text-sm text-gray-500">Remaining</p>
            </div>
          </div>
        </div>

        {/* Projection Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Projected Completion</h3>
          <div className="text-center py-4">
            <div className="text-5xl mb-2">🎯</div>
            <p className="text-2xl font-bold text-purple-600">{formattedProjectedDate}</p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics.daysRemaining
                ? `${analytics.daysRemaining} days from now`
                : "Complete more tasks for projection"}
            </p>
          </div>
          
          {analytics.velocityTrend.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Velocity Trend</p>
              <div className="flex items-end gap-1 h-16">
                {analytics.velocityTrend.slice(-14).map((point, index) => (
                  <div
                    key={point.date}
                    className="flex-1 bg-purple-200 rounded-t transition-all hover:bg-purple-300"
                    style={{
                      height: `${Math.max((point.velocity / Math.max(...analytics.velocityTrend.map((v) => v.velocity), 1)) * 100, 10)}%`,
                    }}
                    title={`${point.date}: ${point.velocity} tasks/day`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">Last 14 active days</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress Chart */}
      {analytics.weeklyProgress.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Weekly Progress</h3>
          <div className="space-y-3">
            {analytics.weeklyProgress.slice(-8).map((week) => (
              <div key={week.weekStart} className="flex items-center gap-4">
                <div className="w-24 text-xs text-gray-500">
                  {new Date(week.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(week.tasksCompleted / maxWeeklyTasks) * 100}%` }}
                    />
                    <div
                      className="h-full bg-purple-400 transition-all"
                      style={{ width: `${(week.substepsCompleted / (maxWeeklyTasks * 3)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm">
                  <span className="text-blue-600 font-medium">{week.tasksCompleted}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-purple-500">{week.substepsCompleted}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded"></span>
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-400 rounded"></span>
              <span>Substeps</span>
            </div>
          </div>
        </div>
      )}

      {/* Cost by Phase */}
      {analytics.costByPhase.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Budget by Phase</h3>
          <div className="space-y-4">
            {analytics.costByPhase.map((phase) => (
              <div key={phase.phase}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{phase.phase}</span>
                  <span className="text-gray-500">
                    {formatCurrency(phase.actual)} / {formatCurrency(phase.estimated)}
                  </span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                  {/* Estimated bar (background) */}
                  <div
                    className="absolute h-full bg-gray-200 rounded-full"
                    style={{ width: `${(phase.estimated / maxCostByPhase) * 100}%` }}
                  />
                  {/* Actual bar */}
                  <div
                    className={`absolute h-full rounded-full transition-all ${
                      phase.actual > phase.estimated ? "bg-red-400" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(phase.actual / maxCostByPhase) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Budget Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(analytics.totalEstimatedCost)}</p>
              <p className="text-xs text-gray-500">Estimated</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(analytics.totalActualCost)}</p>
              <p className="text-xs text-gray-500">Spent</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${analytics.totalEstimatedCost - analytics.totalActualCost >= 0 ? "text-blue-600" : "text-red-500"}`}>
                {formatCurrency(Math.abs(analytics.totalEstimatedCost - analytics.totalActualCost))}
              </p>
              <p className="text-xs text-gray-500">
                {analytics.totalEstimatedCost - analytics.totalActualCost >= 0 ? "Remaining" : "Over Budget"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Substeps Overview */}
      {analytics.totalSubsteps > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Substeps Overview</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${(analytics.completedSubsteps / analytics.totalSubsteps) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-purple-600">
                {analytics.completedSubsteps}/{analytics.totalSubsteps}
              </p>
              <p className="text-xs text-gray-500">Substeps Complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "blue" | "amber" | "emerald" | "purple";
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorStyles = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-500",
    purple: "from-purple-500 to-violet-500",
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorStyles[color]} opacity-10 rounded-bl-full`} />
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
