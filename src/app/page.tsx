"use client";

import { useState } from "react";
import Link from "next/link";
import { useGoals } from "@/hooks/useGoals";
import { useNotifications } from "@/hooks/useNotifications";
import { GoalCard } from "@/components/GoalCard";
import { StreakCounter } from "@/components/StreakCounter";
import { ProgressBar } from "@/components/ProgressBar";
import { CreateGoalModal } from "@/components/CreateGoalModal";
import { NotificationBanner } from "@/components/NotificationBanner";
import { Calendar } from "@/components/Calendar";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export default function Home() {
  const {
    goals,
    streak,
    profile,
    notificationsEnabled,
    activityLog,
    isLoaded,
    addGoal,
    addGoalWithTasks,
    deleteGoal,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTasks,
    addSubstep,
    updateSubstep,
    toggleSubstep,
    deleteSubstep,
    setNotificationsEnabled,
    getProgress,
    getTotalProgress,
    hasCompletedTaskToday,
    getAnalytics,
    updateDocumentStatus,
  } = useGoals();

  const {
    enableNotifications,
    disableNotifications,
    isSupported,
    permission,
  } = useNotifications(
    notificationsEnabled,
    hasCompletedTaskToday(),
    streak.currentStreak,
    setNotificationsEnabled
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showGlobalAnalytics, setShowGlobalAnalytics] = useState(false);

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journey...</p>
        </div>
      </div>
    );
  }

  const totalProgress = getTotalProgress();
  const totalTasks = goals.reduce((sum, g) => sum + g.tasks.length, 0);
  const completedTasks = goals.reduce(
    (sum, g) => sum + g.tasks.filter((t) => t.completed).length,
    0
  );
  const totalSubsteps = goals.reduce(
    (sum, g) => sum + g.tasks.reduce((ts, t) => ts + (t.substeps?.length || 0), 0),
    0
  );

  const globalAnalytics = getAnalytics();

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Journey Tracker</h1>
                <p className="text-sm text-gray-500">Small steps, big progress</p>
              </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="flex items-center gap-3">
              {goals.length > 0 && (
                <div className="hidden md:flex items-center gap-6">
                  <button
                    onClick={() => setShowGlobalAnalytics(!showGlobalAnalytics)}
                    className="text-center hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
                  >
                    <div className="text-2xl font-bold text-blue-600">{totalProgress}%</div>
                    <div className="text-xs text-gray-500">Overall Progress</div>
                  </button>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500 flex items-center gap-1">
                      {streak.currentStreak > 0 && <span>🔥</span>}
                      {streak.currentStreak}
                    </div>
                    <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
                </div>
              )}

              {/* Friends Button */}
              <Link
                href="/friends"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-purple-500/25 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">Friends</span>
              </Link>

              {/* Profile Picture Icon */}
              <Link
                href="/profile"
                className="group relative flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-all"
                title="Go to Profile"
              >
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-transparent group-hover:border-blue-400 group-hover:scale-105 transition-all shadow-md">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:block text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  {profile.name}
                </span>
              </Link>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Goal</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Global Analytics (Toggleable) */}
        {showGlobalAnalytics && goals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Global Analytics</h2>
              <button
                onClick={() => setShowGlobalAnalytics(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AnalyticsDashboard analytics={globalAnalytics} goalTitle="All Goals" />
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Your Journey</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first goal and break it down into tasks. Complete at least one task daily to build your streak!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25"
            >
              Create Your First Goal
            </button>

            {/* Features Preview */}
            <div className="mt-16 grid sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-bold text-gray-800 mb-1">Set Goals</h3>
                <p className="text-sm text-gray-600">Define clear objectives</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl mb-3">✂️</div>
                <h3 className="font-bold text-gray-800 mb-1">Split Tasks</h3>
                <p className="text-sm text-gray-600">Break into substeps</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold text-gray-800 mb-1">Track Analytics</h3>
                <p className="text-sm text-gray-600">Charts & projections</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-3xl mb-3">🔥</div>
                <h3 className="font-bold text-gray-800 mb-1">Build Streaks</h3>
                <p className="text-sm text-gray-600">Stay motivated daily</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar - Streak & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Streak Counter */}
              <StreakCounter streak={streak} hasCompletedToday={hasCompletedTaskToday()} />

              {/* Overall Progress */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Overall Progress
                </h3>
                <ProgressBar progress={totalProgress} size="lg" showPercentage={true} />
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                  <span>{completedTasks} completed</span>
                  <span>{totalTasks - completedTasks} remaining</span>
                </div>
              </div>

              {/* Mini Calendar */}
              <Calendar
                streakHistory={streak.streakHistory}
                activityLog={activityLog}
              />

              {/* Notifications */}
              <NotificationBanner
                enabled={notificationsEnabled}
                isSupported={isSupported}
                permission={permission}
                onEnable={enableNotifications}
                onDisable={disableNotifications}
              />

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Goals</span>
                    <span className="font-bold text-gray-800">{goals.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tasks</span>
                    <span className="font-bold text-gray-800">{totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Substeps</span>
                    <span className="font-bold text-purple-600">{totalSubsteps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Tasks</span>
                    <span className="font-bold text-green-600">{completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-bold text-blue-600">{streak.streakHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Tasks/Day</span>
                    <span className="font-bold text-amber-600">{globalAnalytics.averageTasksPerDay}</span>
                  </div>
                </div>
                
                {/* View Full Analytics Button */}
                <button
                  onClick={() => setShowGlobalAnalytics(true)}
                  className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  View Full Analytics →
                </button>
              </div>
            </div>

            {/* Main Content - Goals */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Your Goals</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Goal
                </button>
              </div>

              {/* Goals List */}
              <div className="space-y-6">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    progress={getProgress(goal.id)}
                    analytics={getAnalytics(goal.id)}
                    activityLog={activityLog}
                    streakHistory={streak.streakHistory}
                    onToggleTask={toggleTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onAddTask={addTask}
                    onAddSubstep={addSubstep}
                    onUpdateSubstep={updateSubstep}
                    onToggleSubstep={toggleSubstep}
                    onDeleteSubstep={deleteSubstep}
                    onDeleteGoal={deleteGoal}
                    onUpdateDocumentStatus={updateDocumentStatus}
                    onReorderTasks={reorderTasks}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGoal={addGoal}
        onAddGoalWithTasks={addGoalWithTasks}
      />

      {/* Today's Status Badge (Fixed at bottom) */}
      {goals.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 ${
              hasCompletedTaskToday()
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white animate-pulse"
            }`}
          >
            {hasCompletedTaskToday() ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Today&apos;s progress saved!
              </>
            ) : (
              <>
                <span>⚡</span>
                Complete a task to save your streak!
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
