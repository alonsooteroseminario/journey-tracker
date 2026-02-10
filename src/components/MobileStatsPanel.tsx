"use client";

import { useState } from "react";
import { StreakCounter } from "./StreakCounter";
import { ProgressBar } from "./ProgressBar";
import { Calendar } from "./Calendar";
import type { Goal } from "@/types";

interface MobileStatsPanelProps {
  goals: Goal[];
}

export function MobileStatsPanel({ goals }: MobileStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate stats
  const activeGoals = goals.filter((g) => g.status !== "completed").length;
  const totalTasks = goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
  const completedTasks = goals.reduce(
    (sum, goal) => sum + goal.tasks.filter((t) => t.completed).length,
    0
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
              <div>
                <StreakCounter />
              </div>

              {/* Progress Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Overall Progress
                </h3>
                <ProgressBar value={completedTasks} max={totalTasks} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {activeGoals}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Active Goals
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {completedTasks}/{totalTasks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tasks
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Activity Calendar
                </h3>
                <Calendar />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
