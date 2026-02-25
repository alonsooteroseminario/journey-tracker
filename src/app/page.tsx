"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useGoals } from "@/hooks/useGoals";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useNotifications } from "@/hooks/useNotifications";
import { GoalCard } from "@/components/GoalCard";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StreakCounter } from "@/components/StreakCounter";
import { ProgressBar } from "@/components/ProgressBar";
import { CreateGoalModal } from "@/components/CreateGoalModal";
import { NotificationBanner } from "@/components/NotificationBanner";
import { Calendar } from "@/components/Calendar";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Header } from "@/components/Header";
import { MobileStatsPanel } from "@/components/MobileStatsPanel";
import { LandingPage } from "@/components/LandingPage";
import { GoalGroupFilter } from "@/components/GoalGroupFilter";

function SortableGoalCard(props: React.ComponentProps<typeof GoalCard>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.goal.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle — grip icon in top-right */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-28 sm:top-5 sm:right-32 z-10 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </button>
      <GoalCard {...props} />
    </div>
  );
}

export default function Home() {
  const { user, isLoaded: userLoaded } = useUser();

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
    addPhase,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTasks,
    reorderGoals,
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
    addResource,
    deleteResource,
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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Goal drag-and-drop reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleGoalDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = goals.findIndex((g) => g.id === active.id);
      const newIndex = goals.findIndex((g) => g.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(goals, oldIndex, newIndex);
      reorderGoals(reordered.map((g) => g.id));
    },
    [goals, reorderGoals]
  );

  // Show loading while checking auth
  if (!userLoaded || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users (existing code continues)

  const totalProgress = getTotalProgress();
  const totalTasks = goals.reduce((sum, g) => sum + g.tasks.length, 0);
  const completedTasks = goals.reduce(
    (sum, g) => sum + g.tasks.filter((t) => t.status === "completed").length,
    0
  );
  const totalSubsteps = goals.reduce(
    (sum, g) => sum + g.tasks.reduce((ts, t) => ts + (t.substeps?.length || 0), 0),
    0
  );

  const globalAnalytics = getAnalytics();

  // Filter goals by selected group
  const filteredGoals = selectedGroupId
    ? goals.filter((g) => g.groupId === selectedGroupId)
    : goals;

  return (
    <main className="min-h-screen pb-4 md:pb-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        totalProgress={totalProgress}
        currentStreak={streak.currentStreak}
        onNewGoalClick={() => setIsCreateModalOpen(true)}
      />

      {/* Home view content */}
      <div className="max-w-6xl mx-auto px-1.5 sm:px-4 py-2 sm:py-8 pb-20 md:pb-8">
        {/* Global Analytics (Toggleable) */}
        {showGlobalAnalytics && goals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Global Analytics</h2>
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Start Your Journey</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first goal and break it down into tasks. Complete at least one task daily to build your streak!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-md shadow-blue-500/25"
            >
              Create Your First Goal
            </button>

            {/* Features Preview */}
            <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-3 sm:p-6 shadow-md border border-gray-100">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📝</div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Set Goals</h3>
                <p className="text-xs sm:text-sm text-gray-600">Define clear objectives</p>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-6 shadow-md border border-gray-100">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">✂️</div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Split Tasks</h3>
                <p className="text-xs sm:text-sm text-gray-600">Break into substeps</p>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-6 shadow-md border border-gray-100">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📊</div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Track Analytics</h3>
                <p className="text-xs sm:text-sm text-gray-600">Charts & projections</p>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-6 shadow-md border border-gray-100">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🔥</div>
                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Build Streaks</h3>
                <p className="text-xs sm:text-sm text-gray-600">Stay motivated daily</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-2 sm:gap-8">
            {/* Sidebar - Streak & Stats */}
            <div className="hidden lg:block lg:col-span-1 space-y-2 sm:space-y-4">
              {/* Streak Counter */}
              <StreakCounter streak={streak} hasCompletedToday={hasCompletedTaskToday()} />

              {/* Overall Progress */}
              <div className="bg-white rounded-lg p-2 sm:p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-xs sm:text-base text-gray-800 mb-1 sm:mb-4 flex items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-xl">📊</span>
                  <span className="hidden sm:inline">Overall Progress</span>
                  <span className="sm:hidden">Progress</span>
                </h3>
                <ProgressBar progress={totalProgress} size="md" showPercentage={true} />
                <div className="mt-1 sm:mt-4 flex justify-between text-[10px] sm:text-sm text-gray-600">
                  <span>{completedTasks} done</span>
                  <span>{totalTasks - completedTasks} left</span>
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
              <div className="bg-white rounded-lg p-2 sm:p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-xs sm:text-base text-gray-800 mb-1 sm:mb-4 flex items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-xl">📈</span>
                  Stats
                </h3>
                <div className="space-y-1 sm:space-y-3 text-[10px] sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goals</span>
                    <span className="font-bold text-gray-800">{goals.length}</span>
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
                    <span className="text-gray-600">Days</span>
                    <span className="font-bold text-blue-600">{streak.streakHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg/Day</span>
                    <span className="font-bold text-amber-600">{globalAnalytics.averageTasksPerDay}</span>
                  </div>
                </div>
                
                {/* View Full Analytics Button */}
                <button
                  onClick={() => setShowGlobalAnalytics(true)}
                  className="w-full mt-2 sm:mt-4 py-1.5 sm:py-2 text-[10px] sm:text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  View Full Analytics →
                </button>
              </div>
            </div>

            {/* Main Content - Goals */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-lg font-bold text-gray-800">Your Goals</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-blue-500 hover:text-blue-600 text-[10px] sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Goal
                </button>
              </div>

              {/* Goal Group Filter */}
              <GoalGroupFilter
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
              />

              {/* Goals List — drag to reorder */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleGoalDragEnd}
              >
                <SortableContext
                  items={filteredGoals.map((g) => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 sm:space-y-4">
                    {filteredGoals.map((goal) => (
                      <SortableGoalCard
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
                        onAddPhase={addPhase}
                        onAddSubstep={addSubstep}
                        onUpdateSubstep={updateSubstep}
                        onToggleSubstep={toggleSubstep}
                        onDeleteSubstep={deleteSubstep}
                        onDeleteGoal={deleteGoal}
                        onUpdateDocumentStatus={updateDocumentStatus}
                        onReorderTasks={reorderTasks}
                        onAddResource={addResource}
                        onDeleteResource={deleteResource}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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

      {/* Mobile Stats Panel - FAB with bottom sheet */}
      {goals.length > 0 && (
        <MobileStatsPanel
          totalProgress={totalProgress}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          totalSubsteps={totalSubsteps}
          goalCount={goals.length}
          streak={streak}
          activityLog={activityLog}
        />
      )}

      {/* Today's Status Badge (Fixed at bottom) */}
      {goals.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)]">
          <div
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-md font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
              hasCompletedTaskToday()
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white animate-pulse"
            }`}
          >
            {hasCompletedTaskToday() ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Today&apos;s progress saved!</span>
                <span className="sm:hidden">Progress saved!</span>
              </>
            ) : (
              <>
                <span className="flex-shrink-0">⚡</span>
                <span className="hidden sm:inline">Complete a task to save your streak!</span>
                <span className="sm:hidden">Do a task for your streak!</span>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
