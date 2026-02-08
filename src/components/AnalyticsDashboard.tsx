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
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white">
        <h2 className="text-base sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base">📊</span>
          Analytics
        </h2>
        {goalTitle && <p className="text-white/80 mt-0.5 sm:mt-1 text-xs sm:text-base truncate">{goalTitle}</p>}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        {analytics.mostProductiveDay && (
          <MetricCard
            title="Most Productive"
            value={analytics.mostProductiveDay.day}
            subtitle={`${analytics.mostProductiveDay.count} completions`}
            icon="🌟"
            color="pink"
          />
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        {/* Circular Progress */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-2 sm:mb-4 text-sm sm:text-base">Overall Progress</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-28 h-28 sm:w-40 sm:h-40">
              <svg className="w-28 h-28 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 160 160">
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
                <span className="text-xl sm:text-3xl font-bold text-gray-800">
                  {Math.round(analytics.completionRate)}%
                </span>
                <span className="text-xs sm:text-sm text-gray-500">Complete</span>
              </div>
            </div>
          </div>
          <div className="mt-2 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{analytics.completedTasks}</p>
              <p className="text-xs sm:text-sm text-gray-500">Tasks Done</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-400">{analytics.totalTasks - analytics.completedTasks}</p>
              <p className="text-xs sm:text-sm text-gray-500">Remaining</p>
            </div>
          </div>
        </div>

        {/* Projection Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-2 sm:mb-4 text-sm sm:text-base">Projected Completion</h3>
          <div className="text-center py-2 sm:py-4">
            <div className="text-3xl sm:text-5xl mb-1 sm:mb-2">🎯</div>
            <p className="text-base sm:text-2xl font-bold text-purple-600">{formattedProjectedDate}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-2 sm:mb-4 text-sm sm:text-base">Weekly Progress</h3>
          <div className="space-y-2 sm:space-y-3">
            {analytics.weeklyProgress.slice(-8).map((week) => (
              <div key={week.weekStart} className="flex items-center gap-2 sm:gap-4">
                <div className="w-14 sm:w-24 text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
                  {new Date(week.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 sm:h-6 bg-gray-100 rounded-full overflow-hidden flex">
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
                <div className="w-12 sm:w-20 text-right text-[10px] sm:text-sm flex-shrink-0">
                  <span className="text-blue-600 font-medium">{week.tasksCompleted}</span>
                  <span className="text-gray-400">/</span>
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-2 sm:mb-4 text-sm sm:text-base">Budget by Phase</h3>
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
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-sm sm:text-lg font-bold text-gray-800 truncate">{formatCurrency(analytics.totalEstimatedCost)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Estimated</p>
            </div>
            <div>
              <p className="text-sm sm:text-lg font-bold text-emerald-600 truncate">{formatCurrency(analytics.totalActualCost)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Spent</p>
            </div>
            <div>
              <p className={`text-sm sm:text-lg font-bold truncate ${analytics.totalEstimatedCost - analytics.totalActualCost >= 0 ? "text-blue-600" : "text-red-500"}`}>
                {formatCurrency(Math.abs(analytics.totalEstimatedCost - analytics.totalActualCost))}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {analytics.totalEstimatedCost - analytics.totalActualCost >= 0 ? "Remaining" : "Over Budget"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Substeps Overview */}
      {analytics.totalSubsteps > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-2 sm:mb-4 text-sm sm:text-base">Substeps Overview</h3>
          <div className="flex items-center gap-3 sm:gap-4 sm:p-6">
            <div className="flex-1 min-w-0">
              <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${(analytics.completedSubsteps / analytics.totalSubsteps) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base sm:text-xl font-bold text-purple-600">
                {analytics.completedSubsteps}/{analytics.totalSubsteps}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Substeps Complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Goal Breakdown */}
      {analytics.goalBreakdown && analytics.goalBreakdown.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Goal Breakdown</h3>
          <div className="space-y-3">
            {analytics.goalBreakdown.map((goal) => (
              <div key={goal.goalId} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 truncate flex-1">{goal.title}</h4>
                  <span className="text-xs sm:text-sm font-bold text-blue-600 ml-2">{goal.completionRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${goal.completionRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                    {goal.tasksCompleted}/{goal.totalTasks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase Completion */}
      {analytics.phaseCompletion && analytics.phaseCompletion.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Phase Completion</h3>
          <div className="space-y-3">
            {analytics.phaseCompletion.map((phase) => (
              <div key={phase.phaseId} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 truncate flex-1">{phase.name}</h4>
                  <span className="text-xs sm:text-sm font-bold text-purple-600 ml-2">{phase.completionRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${phase.completionRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                    {phase.tasksCompleted}/{phase.totalTasks}
                  </span>
                </div>
              </div>
            ))}
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
  color: "blue" | "amber" | "emerald" | "purple" | "pink";
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorStyles = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-500",
    purple: "from-purple-500 to-violet-500",
    pink: "from-pink-500 to-rose-500",
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 p-2.5 sm:p-4 overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br ${colorStyles[color]} opacity-10 rounded-bl-full`} />
      <div className="text-base sm:text-2xl mb-1 sm:mb-2">{icon}</div>
      <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{title}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 truncate">{subtitle}</p>
    </div>
  );
}
