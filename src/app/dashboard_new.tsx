"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { StreakCounter } from "@/components/StreakCounter";
import { ProgressBar } from "@/components/ProgressBar";

export default function Dashboard() {
  const {
    goals,
    streak,
    profile,
    isLoaded,
    getProgress,
    getTotalProgress,
    getAnalytics,
    hasCompletedTaskToday,
  } = useGoals();

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
  const globalAnalytics = getAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation profile={profile} currentStreak={streak.currentStreak} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your journey overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Goals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Goals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{goals.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Current Streak</p>
                <p className="text-3xl font-bold mt-2">{streak.currentStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <ProgressBar progress={totalProgress} size="sm" />
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(globalAnalytics.completionRate)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Streak Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔥</span>
                Your Streak
              </h2>
              <StreakCounter 
                streak={streak}
                hasCompletedToday={hasCompletedTaskToday()}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/goals"
                className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
              >
                📝 View All Goals
              </Link>
              <Link
                href="/friends"
                className="block w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-center font-medium"
              >
                👥 Compare with Friends
              </Link>
              <Link
                href="/profile"
                className="block w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-center font-medium"
              >
                👤 Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Goals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Goals</h2>
            <Link
              href="/goals"
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              View All →
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No goals yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start your journey by creating your first goal!
              </p>
              <Link
                href="/goals"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Create Your First Goal
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.slice(0, 6).map((goal) => {
                const progress = getProgress(goal.id);
                const analytics = getAnalytics(goal.id);
                
                return (
                  <Link
                    key={goal.id}
                    href={`/goals#${goal.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {goal.description || "No description"}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{analytics.completedTasks}/{analytics.totalTasks} tasks</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressBar progress={progress} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
