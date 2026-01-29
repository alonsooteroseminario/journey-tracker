"use client";

import { useState } from "react";
import { Goal, Task, Substep } from "@/types";
import { ProgressBar } from "./ProgressBar";
import { TaskList } from "./TaskList";
import { PhaseProgress } from "./PhaseProgress";
import { BudgetSummary } from "./BudgetSummary";
import { TimelineComparison } from "./TimelineComparison";
import { DocumentChecklist } from "./DocumentChecklist";
import { ResourcesPanel } from "./ResourcesPanel";
import { Calendar } from "./Calendar";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { AnalyticsData, ActivityLogEntry } from "@/types";

interface GoalCardProps {
  goal: Goal;
  progress: number;
  analytics: AnalyticsData;
  activityLog: ActivityLogEntry[];
  streakHistory: string[];
  onToggleTask: (goalId: string, taskId: string) => void;
  onUpdateTask: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (goalId: string, taskId: string) => void;
  onAddTask: (goalId: string, title: string, description?: string) => void;
  onAddSubstep: (goalId: string, taskId: string, title: string, description?: string) => void;
  onUpdateSubstep: (goalId: string, taskId: string, substepId: string, updates: Partial<Substep>) => void;
  onToggleSubstep: (goalId: string, taskId: string, substepId: string) => void;
  onDeleteSubstep: (goalId: string, taskId: string, substepId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateDocumentStatus?: (goalId: string, docId: string, status: "pending" | "obtained" | "submitted") => void;
  onReorderTasks?: (goalId: string, tasks: Task[]) => void;
}

type ViewMode = "tasks" | "phases" | "info" | "calendar" | "analytics";

export function GoalCard({
  goal,
  progress,
  analytics,
  activityLog,
  streakHistory,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onAddSubstep,
  onUpdateSubstep,
  onToggleSubstep,
  onDeleteSubstep,
  onDeleteGoal,
  onUpdateDocumentStatus,
  onReorderTasks,
}: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("phases");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  // Calculate completed and total counts including substeps
  let completedCount = 0;
  let totalCount = 0;

  goal.tasks.forEach((task) => {
    const substeps = task.substeps || [];
    
    if (substeps.length > 0) {
      // If task has substeps, count substeps only
      totalCount += substeps.length;
      completedCount += substeps.filter((s) => s.completed).length;
    } else {
      // If no substeps, count the task itself
      totalCount += 1;
      completedCount += task.completed ? 1 : 0;
    }
  });

  const hasExtendedData = goal.phases && goal.phases.length > 0;

  // Get tasks for a specific phase
  const getTasksForPhase = (phaseId: string): Task[] => {
    const phase = goal.phases?.find((p) => p.id === phaseId);
    if (!phase) return [];
    return goal.tasks.filter((t) => phase.taskIds.includes(t.id));
  };

  const displayedTasks = selectedPhase
    ? getTasksForPhase(selectedPhase)
    : goal.tasks;

  const selectedPhaseName = selectedPhase
    ? goal.phases?.find((p) => p.id === selectedPhase)?.name
    : null;

  // Filter activity log for this goal
  const goalActivityLog = activityLog.filter((a) => a.goalId === goal.id);

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 ${
        progress === 100
          ? "border-green-300 shadow-green-100"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`p-6 ${
          progress === 100
            ? "bg-gradient-to-r from-green-50 to-emerald-50"
            : "bg-gradient-to-r from-red-50 via-white to-red-50"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍁</span>
              <h3 className="text-xl font-bold text-gray-800">{goal.title}</h3>
              {progress === 100 && (
                <span className="text-2xl" title="Goal completed!">
                  🎉
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-gray-600 mt-1">{goal.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-lg transition-colors"
              title="Delete goal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{completedCount} of {totalCount} steps completed</span>
            {progress === 100 && (
              <span className="text-green-600 font-semibold">Complete!</span>
            )}
          </div>
          <ProgressBar progress={progress} showPercentage={true} size="lg" />
        </div>

        {/* View Mode Tabs */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {hasExtendedData && (
            <button
              onClick={() => { setViewMode("phases"); setSelectedPhase(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "phases" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              📊 Phases
            </button>
          )}
          <button
            onClick={() => { setViewMode("tasks"); setSelectedPhase(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "tasks" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
            }`}
          >
            ✅ Tasks
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
            }`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setViewMode("analytics")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "analytics" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
            }`}
          >
            📈 Analytics
          </button>
          {hasExtendedData && (
            <button
              onClick={() => setViewMode("info")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "info" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              ℹ️ Resources
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
      {isExpanded && (
        <div className="p-6 border-t border-gray-100">
          {/* Phase View */}
          {viewMode === "phases" && hasExtendedData && goal.phases && (
            <div className="space-y-6">
              {!selectedPhase ? (
                <PhaseProgress
                  phases={goal.phases}
                  tasks={goal.tasks}
                  onPhaseClick={(phaseId) => setSelectedPhase(phaseId)}
                />
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedPhase(null)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Phases
                  </button>

                  <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-bold text-blue-800">{selectedPhaseName}</h4>
                    <p className="text-sm text-blue-600">
                      {displayedTasks.filter((t) => t.completed).length} of {displayedTasks.length} tasks completed
                    </p>
                  </div>

                  <TaskList
                    tasks={displayedTasks}
                    onToggleTask={(taskId) => onToggleTask(goal.id, taskId)}
                    onUpdateTask={(taskId, updates) => onUpdateTask(goal.id, taskId, updates)}
                    onDeleteTask={(taskId) => onDeleteTask(goal.id, taskId)}
                    onAddTask={(title, desc) => onAddTask(goal.id, title, desc)}
                    onAddSubstep={(taskId, title, desc) => onAddSubstep(goal.id, taskId, title, desc)}
                    onUpdateSubstep={(taskId, substepId, updates) => onUpdateSubstep(goal.id, taskId, substepId, updates)}
                    onToggleSubstep={(taskId, substepId) => onToggleSubstep(goal.id, taskId, substepId)}
                    onDeleteSubstep={(taskId, substepId) => onDeleteSubstep(goal.id, taskId, substepId)}
                    onReorderTasks={(tasks) => onReorderTasks?.(goal.id, tasks)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tasks View */}
          {viewMode === "tasks" && (
            <TaskList
              tasks={goal.tasks}
              onToggleTask={(taskId) => onToggleTask(goal.id, taskId)}
              onUpdateTask={(taskId, updates) => onUpdateTask(goal.id, taskId, updates)}
              onDeleteTask={(taskId) => onDeleteTask(goal.id, taskId)}
              onAddTask={(title, desc) => onAddTask(goal.id, title, desc)}
              onAddSubstep={(taskId, title, desc) => onAddSubstep(goal.id, taskId, title, desc)}
              onUpdateSubstep={(taskId, substepId, updates) => onUpdateSubstep(goal.id, taskId, substepId, updates)}
              onToggleSubstep={(taskId, substepId) => onToggleSubstep(goal.id, taskId, substepId)}
              onDeleteSubstep={(taskId, substepId) => onDeleteSubstep(goal.id, taskId, substepId)}
              onReorderTasks={(tasks) => onReorderTasks?.(goal.id, tasks)}
            />
          )}

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <Calendar
              streakHistory={streakHistory}
              activityLog={goalActivityLog}
            />
          )}

          {/* Analytics View */}
          {viewMode === "analytics" && (
            <AnalyticsDashboard analytics={analytics} goalTitle={goal.title} />
          )}

          {/* Info View */}
          {viewMode === "info" && hasExtendedData && (
            <div className="space-y-6">
              {goal.budget && <BudgetSummary budget={goal.budget} />}
              {goal.timeline && <TimelineComparison timeline={goal.timeline} />}
              {goal.documents && (
                <DocumentChecklist
                  documents={goal.documents}
                  onUpdateStatus={(docId, status) =>
                    onUpdateDocumentStatus?.(goal.id, docId, status)
                  }
                />
              )}
              {goal.resources && <ResourcesPanel resources={goal.resources} />}
            </div>
          )}

          {/* Simple task view for non-extended goals when phases selected */}
          {!hasExtendedData && viewMode === "phases" && (
            <TaskList
              tasks={goal.tasks}
              onToggleTask={(taskId) => onToggleTask(goal.id, taskId)}
              onUpdateTask={(taskId, updates) => onUpdateTask(goal.id, taskId, updates)}
              onDeleteTask={(taskId) => onDeleteTask(goal.id, taskId)}
              onAddTask={(title, desc) => onAddTask(goal.id, title, desc)}
              onAddSubstep={(taskId, title, desc) => onAddSubstep(goal.id, taskId, title, desc)}
              onUpdateSubstep={(taskId, substepId, updates) => onUpdateSubstep(goal.id, taskId, substepId, updates)}
              onToggleSubstep={(taskId, substepId) => onToggleSubstep(goal.id, taskId, substepId)}
              onDeleteSubstep={(taskId, substepId) => onDeleteSubstep(goal.id, taskId, substepId)}
              onReorderTasks={(tasks) => onReorderTasks?.(goal.id, tasks)}
            />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-gray-800 mb-2">Delete Goal?</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &quot;{goal.title}&quot;? This will also
              delete all {totalCount} tasks. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteGoal(goal.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
