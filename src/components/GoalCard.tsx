"use client";

import { useState, useMemo } from "react";
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
import { ShareGoalModal } from "./templates/ShareGoalModal";
import { GoalGroupSelector } from "./GoalGroupSelector";
import { useUpdateGoalMutation } from "@/store/slices/goalsSlice";
import { StreakBadge } from "./StreakBadge";
import { useGetGoalStreaksQuery } from "@/store/slices/streaksSlice";
import { computeGoalTier } from "@/lib/streaks/computeTier";
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
  onAddTask: (goalId: string, title: string, description?: string, phaseId?: string) => void;
  onAddSubstep: (goalId: string, taskId: string, title: string, description?: string) => void;
  onUpdateSubstep: (goalId: string, taskId: string, substepId: string, updates: Partial<Substep>) => void;
  onToggleSubstep: (goalId: string, taskId: string, substepId: string) => void;
  onDeleteSubstep: (goalId: string, taskId: string, substepId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateDocumentStatus?: (goalId: string, docId: string, status: "pending" | "obtained" | "submitted") => void;
  onReorderTasks?: (goalId: string, tasks: Task[]) => void;
  onAddPhase?: (goalId: string, name: string, description: string) => void;
  onAddResource?: (goalId: string, category: string, name: string, url: string) => void;
  onDeleteResource?: (goalId: string, category: string, resourceIndex: number) => void;
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
  onAddPhase,
  onAddResource,
  onDeleteResource,
}: GoalCardProps) {
  const [updateGoalMutation] = useUpdateGoalMutation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(goal.phases && goal.phases.length > 0 ? "phases" : "tasks");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDescription, setNewPhaseDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description || "");
  const [editIcon, setEditIcon] = useState(goal.icon || "🎯");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSaveEdit = async () => {
    const updates: Record<string, string> = {};
    if (editTitle !== goal.title) updates.title = editTitle;
    if (editDescription !== (goal.description || "")) updates.description = editDescription;
    if (editIcon !== (goal.icon || "🎯")) updates.icon = editIcon;

    if (Object.keys(updates).length > 0) {
      await updateGoalMutation({ id: goal.id, updates });
    }
    setIsEditing(false);
  };

  // Fetch per-goal streak data for badge
  const { data: goalStreaks } = useGetGoalStreaksQuery();
  const goalStreak = useMemo(
    () => goalStreaks?.find((s) => s.goalId === goal.id),
    [goalStreaks, goal.id]
  );
  const goalTier = useMemo(
    () => computeGoalTier(goalStreak?.currentStreak ?? 0),
    [goalStreak?.currentStreak]
  );

  // Calculate completed and total counts including substeps
  let completedCount = 0;
  let totalCount = 0;

  goal.tasks.forEach((task) => {
    const substeps = task.substeps || [];

    if (substeps.length > 0) {
      // If task has substeps, count substeps only
      totalCount += substeps.length;
      completedCount += substeps.filter((s) => s.status === 'completed').length;
    } else {
      // If no substeps, count the task itself
      totalCount += 1;
      completedCount += task.status === 'completed' ? 1 : 0;
    }
  });

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
        className={`p-2 sm:p-6 ${
          progress === 100
            ? "bg-gradient-to-r from-green-50 to-emerald-50"
            : "bg-gradient-to-r from-red-50 via-white to-red-50"
        }`}
      >
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              {isEditing ? (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-lg sm:text-3xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
                    title="Change icon"
                  >
                    {editIcon}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 grid grid-cols-6 gap-1">
                      {["🎯", "📚", "💪", "🏃", "💻", "🎨", "🎵", "✈️", "💰", "🏠", "❤️", "⭐", "🔥", "🌱", "📈", "🎓", "🧘", "🍎"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => { setEditIcon(emoji); setShowEmojiPicker(false); }}
                          className="text-xl p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-lg sm:text-3xl flex-shrink-0">{goal.icon || '🎯'}</span>
              )}
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  className="text-sm sm:text-xl font-bold bg-transparent border-b-2 border-blue-400 focus:border-blue-600 outline-none w-full text-gray-800"
                  autoFocus
                />
              ) : (
                <h3 className="text-sm sm:text-xl font-bold text-gray-800 truncate">{goal.title}</h3>
              )}
              <StreakBadge tier={goalTier} streak={goalStreak?.currentStreak} />
              {progress === 100 && (
                <span className="text-base sm:text-2xl flex-shrink-0" title="Goal completed!">
                  🎉
                </span>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditing(false);
                }}
                rows={2}
                className="text-xs sm:text-sm bg-transparent border border-gray-300 rounded px-2 py-1 focus:border-blue-400 outline-none w-full text-gray-600 resize-none mt-1"
                placeholder="Add a description..."
              />
            ) : (
              goal.description && (
                <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{goal.description}</p>
              )
            )}
            {isEditing && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="mt-1">
              <GoalGroupSelector
                goalId={goal.id}
                currentGroupId={goal.groupId}
                onGroupChange={(goalId, groupId) => {
                  updateGoalMutation({
                    id: goalId,
                    updates: { groupId: groupId || undefined },
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setEditTitle(goal.title);
                setEditDescription(goal.description || "");
                setEditIcon(goal.icon || "🎯");
                setShowEmojiPicker(false);
              }}
              className="p-1.5 sm:p-3 min-w-[32px] sm:min-w-[48px] min-h-[32px] sm:min-h-[48px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={isEditing ? "Cancel editing" : "Edit goal"}
              aria-label={isEditing ? "Cancel editing" : "Edit goal"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 sm:p-3 min-w-[32px] sm:min-w-[48px] min-h-[32px] sm:min-h-[48px] flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-colors"
              title="Share as template"
              aria-label="Share goal as template"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 sm:p-3 min-w-[32px] sm:min-w-[48px] min-h-[32px] sm:min-h-[48px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
              aria-label={isExpanded ? "Collapse goal" : "Expand goal"}
              aria-expanded={isExpanded}
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 sm:p-3 min-w-[32px] sm:min-w-[48px] min-h-[32px] sm:min-h-[48px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-lg transition-colors"
              title="Delete goal"
              aria-label="Delete goal"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-2 sm:mt-4">
          <div className="flex items-center justify-between text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">
            <span className="truncate">{completedCount} of {totalCount} steps</span>
            {progress === 100 && (
              <span className="text-green-600 font-semibold text-[10px] sm:text-sm flex-shrink-0 ml-2">Complete!</span>
            )}
          </div>
          <ProgressBar progress={progress} showPercentage={true} size="md" />
        </div>

        {/* View Mode Tabs — only visible when expanded */}
        {isExpanded && (
          <div role="tablist" className="mt-2 sm:mt-4 grid grid-cols-5 md:flex gap-0.5 sm:gap-2">
            <button
              role="tab"
              aria-selected={viewMode === "phases"}
              onClick={() => { setViewMode("phases"); setSelectedPhase(null); }}
              className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === "phases" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="block sm:hidden">📊</span>
              <span className="hidden sm:inline">📊 Phases</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "tasks"}
              onClick={() => { setViewMode("tasks"); setSelectedPhase(null); }}
              className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === "tasks" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="block sm:hidden">✅</span>
              <span className="hidden sm:inline">✅ Tasks</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
              className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="block sm:hidden">📅</span>
              <span className="hidden sm:inline">📅 Calendar</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "analytics"}
              onClick={() => setViewMode("analytics")}
              className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === "analytics" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="block sm:hidden">📈</span>
              <span className="hidden sm:inline">📈 Analytics</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "info"}
              onClick={() => setViewMode("info")}
              className={`px-1 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[40px] rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === "info" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="block sm:hidden">ℹ️</span>
              <span className="hidden sm:inline">ℹ️ Resources</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      {isExpanded && (
        <div className="p-2 sm:p-6 border-t border-gray-100">
          {/* Phase View */}
          {viewMode === "phases" && (
            goal.phases && goal.phases.length > 0 ? (
              <div className="space-y-6">
                {isAddingPhase ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      placeholder="Phase name (e.g., Phase 2: Implementation)"
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsAddingPhase(false);
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                        }
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Description (e.g., Weeks 5-8 - Core implementation)"
                      value={newPhaseDescription}
                      onChange={(e) => setNewPhaseDescription(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newPhaseName.trim()) {
                          onAddPhase?.(goal.id, newPhaseName.trim(), newPhaseDescription.trim());
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                          setIsAddingPhase(false);
                        }
                        if (e.key === "Escape") {
                          setIsAddingPhase(false);
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                        }
                      }}
                    />
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => {
                          if (newPhaseName.trim()) {
                            onAddPhase?.(goal.id, newPhaseName.trim(), newPhaseDescription.trim());
                            setNewPhaseName("");
                            setNewPhaseDescription("");
                            setIsAddingPhase(false);
                          }
                        }}
                        disabled={!newPhaseName.trim()}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add Phase
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingPhase(false);
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : !selectedPhase ? (
                  <PhaseProgress
                    phases={goal.phases}
                    tasks={goal.tasks}
                    onPhaseClick={(phaseId) => setSelectedPhase(phaseId)}
                    onAddPhase={() => setIsAddingPhase(true)}
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
                        {displayedTasks.filter((t) => t.status === 'completed').length} of {displayedTasks.length} tasks completed
                      </p>
                    </div>

                    <TaskList
                      tasks={displayedTasks}
                      onToggleTask={(taskId) => onToggleTask(goal.id, taskId)}
                      onUpdateTask={(taskId, updates) => onUpdateTask(goal.id, taskId, updates)}
                      onDeleteTask={(taskId) => onDeleteTask(goal.id, taskId)}
                      onAddTask={(title, desc) => onAddTask(goal.id, title, desc, selectedPhase ?? undefined)}
                      onAddSubstep={(taskId, title, desc) => onAddSubstep(goal.id, taskId, title, desc)}
                      onUpdateSubstep={(taskId, substepId, updates) => onUpdateSubstep(goal.id, taskId, substepId, updates)}
                      onToggleSubstep={(taskId, substepId) => onToggleSubstep(goal.id, taskId, substepId)}
                      onDeleteSubstep={(taskId, substepId) => onDeleteSubstep(goal.id, taskId, substepId)}
                      onReorderTasks={(tasks) => onReorderTasks?.(goal.id, tasks)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {isAddingPhase ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      placeholder="Phase name (e.g., Phase 1: Planning)"
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsAddingPhase(false);
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                        }
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Description (e.g., Weeks 1-4 - Planning and preparation)"
                      value={newPhaseDescription}
                      onChange={(e) => setNewPhaseDescription(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newPhaseName.trim()) {
                          onAddPhase?.(goal.id, newPhaseName.trim(), newPhaseDescription.trim());
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                          setIsAddingPhase(false);
                        }
                        if (e.key === "Escape") {
                          setIsAddingPhase(false);
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                        }
                      }}
                    />
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => {
                          if (newPhaseName.trim()) {
                            onAddPhase?.(goal.id, newPhaseName.trim(), newPhaseDescription.trim());
                            setNewPhaseName("");
                            setNewPhaseDescription("");
                            setIsAddingPhase(false);
                          }
                        }}
                        disabled={!newPhaseName.trim()}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add Phase
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingPhase(false);
                          setNewPhaseName("");
                          setNewPhaseDescription("");
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
                    <span className="text-3xl mb-2">📊</span>
                    <p className="text-sm font-semibold text-gray-700">No phases yet</p>
                    <p className="text-xs text-gray-500 mt-1 mb-3 max-w-[260px]">
                      Phases help you break your goal into milestones.
                    </p>
                    <button
                      onClick={() => setIsAddingPhase(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Add First Phase
                    </button>
                  </div>
                )}
              </div>
            )
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

          {/* Info / Resources View */}
          {viewMode === "info" && (
            goal.budget || goal.timeline || goal.documents || goal.resources ? (
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
                {goal.resources && (
                  <ResourcesPanel
                    resources={goal.resources}
                    onAddResource={
                      onAddResource
                        ? (category, name, url) => onAddResource(goal.id, category, name, url)
                        : undefined
                    }
                    onDeleteResource={
                      onDeleteResource
                        ? (category, resourceIndex) => onDeleteResource(goal.id, category, resourceIndex)
                        : undefined
                    }
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-purple-50/50 rounded-xl border border-purple-100 border-dashed">
                <span className="text-3xl mb-2">📦</span>
                <p className="text-sm font-semibold text-gray-700">No resources yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[260px]">
                  Resources include budget tracking, timelines, document checklists, and reference links. Ask the chatbot to help you add them.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-goal-title"
        >
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm w-full shadow-2xl">
            <h4 id="delete-goal-title" className="text-base sm:text-lg font-bold text-gray-800 mb-2">Delete Goal?</h4>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Are you sure you want to delete &quot;{goal.title}&quot;? This will also
              delete all {totalCount} tasks. This action cannot be undone.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-3 sm:px-4 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteGoal(goal.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2 px-3 sm:px-4 bg-red-500 text-white rounded-lg text-sm sm:text-base hover:bg-red-600 transition-colors min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Goal Modal */}
      {showShareModal && (
        <ShareGoalModal
          goalId={goal.id}
          goalTitle={goal.title}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
