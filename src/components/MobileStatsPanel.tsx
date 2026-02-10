"use client";

import { useState } from "react";
import { StreakCounter } from "./StreakCounter";
import { ProgressBar } from "./ProgressBar";
import { Calendar } from "./Calendar";
import type { Streak, ActivityLogEntry } from "@/types";

interface MobileStatsPanelProps {
  totalProgress: number;
  completedTasks: number;
  totalTasks: number;
  totalSubsteps: number;
  goalCount: number;
  streak: Streak;
  activityLog: ActivityLogEntry[];
}

export function MobileStatsPanel({
  totalProgress,
  completedTasks,
  totalTasks,
  totalSubsteps,
  goalCount,
  streak,
  activityLog,
}: MobileStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasCompletedToday = activityLog.some(
    (log) =>
      log.type === "task_completed" &&
      new Date(log.date).toDateString() === new Date().toDateString()
  );

  return (
    <>
      {/* FAB Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="View stats"
        className="fixed bottom-20 right-4 z-40 lg:hidden bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>

      {/* Bottom Sheet */}
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <div
            data-testid="stats-overlay"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            aria-hidden="true"
          />

          {/* Bottom Sheet Content */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto lg:hidden">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Progress
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close stats"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Streak Counter */}
              <StreakCounter streak={streak} hasCompletedToday={hasCompletedToday} />

              {/* Overall Progress */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Overall Progress
                </h3>
                <ProgressBar progress={totalProgress} size="md" showPercentage={true} />
                <div className="mt-3 flex justify-between text-xs text-gray-600">
                  <span>{completedTasks} done</span>
                  <span>{totalTasks - completedTasks} left</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Quick Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goals</span>
                    <span className="font-bold text-gray-800">{goalCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasks</span>
                    <span className="font-bold text-gray-800">{totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Substeps</span>
                    <span className="font-bold text-purple-600">{totalSubsteps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Done</span>
                    <span className="font-bold text-green-600">{completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-bold text-blue-600">{streak.streakHistory.length}</span>
                  </div>
                </div>
              </div>

              {/* Mini Calendar */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  Activity Calendar
                </h3>
                <Calendar
                  streakHistory={streak.streakHistory}
                  activityLog={activityLog}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
