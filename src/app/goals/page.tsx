"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard";
import { CreateGoalModal } from "@/components/CreateGoalModal";

export default function GoalsPage() {
  const router = useRouter();
  const {
    goals,
    profile,
    streak,
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
    getProgress,
    getAnalytics,
    updateDocumentStatus,
  } = useGoals();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">My Goals</h1>
                  <p className="text-sm text-gray-500">Track your journey to success</p>
                </div>
              </div>
            </div>

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
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-8xl mb-6">🎯</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              No goals yet
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Start your journey by creating your first goal!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25 text-lg"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
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
        )}
      </main>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGoal={async (title, description) => {
          await addGoal(title, description);
          setIsCreateModalOpen(false);
        }}
        onAddGoalWithTasks={(goal) => {
          addGoalWithTasks(goal);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
