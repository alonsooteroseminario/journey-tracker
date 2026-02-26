"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Goal, Task, Substep } from "@/types";
import { StreakBadge } from "@/components/StreakBadge";
import { useGetGoalStreaksQuery } from "@/store/slices/streaksSlice";
import { computeGoalTier } from "@/lib/streaks/computeTier";

interface KanbanCardProps {
  item: Goal | Task | Substep;
  level: "goals" | "tasks" | "substeps";
  columnStatus: "not_started" | "in_progress" | "completed";
  onDrillDown: () => void;
  onArchive?: () => void;
}

export function KanbanCard({ item, level, columnStatus, onDrillDown, onArchive }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const task = item as Task;
  const substep = item as Substep;
  const goal = item as Goal;

  // Fetch per-goal streak data for badge (only used at goals level)
  const { data: goalStreaks } = useGetGoalStreaksQuery(undefined, { skip: level !== "goals" });
  const goalStreak = useMemo(
    () => (level === "goals" ? goalStreaks?.find((s) => s.goalId === item.id) : undefined),
    [goalStreaks, item.id, level]
  );
  const goalTier = useMemo(
    () => computeGoalTier(goalStreak?.currentStreak ?? 0),
    [goalStreak?.currentStreak]
  );

  // Determine if item has children to drill down into
  const hasChildren =
    (level === "goals" && goal.tasks && goal.tasks.length > 0) ||
    (level === "tasks" && task.substeps && task.substeps.length > 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-2 sm:p-3 pl-5 sm:pl-6 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${
        (item as Task).isArchived ? "opacity-60 !bg-gray-50" : ""
      }`}
    >
      {/* Parent breadcrumb for flat views */}
      {level === "tasks" && (item as any)._goalTitle && (
        <div className="text-[9px] sm:text-[10px] text-gray-400 truncate mb-0.5 flex items-center gap-1">
          <span>{(item as any)._goalIcon || "🎯"}</span>
          <span className="truncate">{(item as any)._goalTitle}</span>
        </div>
      )}
      {level === "substeps" && (item as any)._goalTitle && (
        <div className="text-[9px] sm:text-[10px] text-gray-400 truncate mb-0.5 flex items-center gap-1">
          <span>{(item as any)._goalIcon || "🎯"}</span>
          <span className="truncate">{(item as any)._goalTitle}</span>
          <span className="text-gray-300">&rsaquo;</span>
          <span className="truncate">{(item as any)._taskTitle}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">
            {item.title}
          </h4>
          {(item as Task).isArchived && (
            <span className="ml-1 px-1 py-0.5 text-[8px] bg-amber-100 text-amber-600 rounded font-medium">
              ARCHIVED
            </span>
          )}
          {level === "goals" && <StreakBadge tier={goalTier} streak={goalStreak?.currentStreak} />}
        </div>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown();
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
            title="Drill down"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Description (if available) */}
      {(task.description || substep.description) && (
        <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description || substep.description}
        </p>
      )}

      {/* Goal: List task names */}
      {level === "goals" && goal.tasks && goal.tasks.length > 0 && (() => {
        const visibleTasks = columnStatus === "in_progress"
          ? goal.tasks.filter((t) => t.status !== "completed")
          : goal.tasks;
        if (visibleTasks.length === 0) return null;
        return (
          <ul className="mb-2 space-y-0.5">
            {visibleTasks.slice(0, 5).map((t) => {
              const statusIcon = t.status === "completed" ? "✓" : t.status === "in_progress" ? "◐" : "○";
              const statusColor = t.status === "completed" ? "text-green-600" : t.status === "in_progress" ? "text-orange-500" : "text-gray-400";
              return (
                <li key={t.id} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <span className={`flex-shrink-0 ${statusColor}`}>{statusIcon}</span>
                  <span className={`truncate ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}>
                    {t.title}
                  </span>
                </li>
              );
            })}
            {visibleTasks.length > 5 && (
              <li className="text-[10px] sm:text-xs text-gray-400 pl-4">
                +{visibleTasks.length - 5} more
              </li>
            )}
          </ul>
        );
      })()}

      {/* Task: Substep progress bar */}
      {level === "tasks" && task.substeps && task.substeps.length > 0 && (() => {
        const done = task.substeps.filter((s) => s.status === "completed").length;
        const total = task.substeps.length;
        const pct = Math.round((done / total) * 100);
        return (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 mb-0.5">
              <span>{done}/{total} substeps</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-brand-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Task: List substep names */}
      {level === "tasks" && task.substeps && task.substeps.length > 0 && (() => {
        const visibleSubsteps = columnStatus === "in_progress"
          ? task.substeps.filter((s) => s.status !== "completed")
          : task.substeps;
        if (visibleSubsteps.length === 0) return null;
        return (
          <ul className="mb-2 space-y-0.5">
            {visibleSubsteps.slice(0, 4).map((s) => {
              const statusIcon = s.status === "completed" ? "✓" : s.status === "in_progress" ? "◐" : "○";
              const statusColor = s.status === "completed" ? "text-green-600" : s.status === "in_progress" ? "text-orange-500" : "text-gray-400";
              return (
                <li key={s.id} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <span className={`flex-shrink-0 ${statusColor}`}>{statusIcon}</span>
                  <span className={`truncate ${s.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}>
                    {s.title}
                  </span>
                </li>
              );
            })}
            {visibleSubsteps.length > 4 && (
              <li className="text-[10px] sm:text-xs text-gray-400 pl-4">
                +{visibleSubsteps.length - 4} more
              </li>
            )}
          </ul>
        );
      })()}

      {/* Metadata badges */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
        {/* Goal: Show task count */}
        {level === "goals" && goal.tasks && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-brand-light/40 text-brand-primary rounded-full">
            {goal.tasks.length} tasks
          </span>
        )}

        {/* Task: Show priority */}
        {level === "tasks" && task.priority && (
          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded-full ${
              task.priority === "critical"
                ? "bg-red-100 text-red-700"
                : task.priority === "high"
                ? "bg-orange-100 text-orange-700"
                : task.priority === "medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {task.priority}
          </span>
        )}

        {/* Task: Show phase */}
        {level === "tasks" && task.phase && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
            {task.phase}
          </span>
        )}

        {/* Task: Show step number */}
        {level === "tasks" && task.stepNumber && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
            Step {task.stepNumber}
          </span>
        )}

        {/* Task: Show due date */}
        {level === "tasks" && task.dueDate && (() => {
          const due = new Date(task.dueDate);
          due.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isOverdue = due < today && task.status !== "completed";
          return (
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
              {isOverdue && "⚠ "}
              {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          );
        })()}

        {/* Substep: Show due date */}
        {level === "substeps" && substep.dueDate && (() => {
          const due = new Date(substep.dueDate);
          due.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isOverdue = due < today && substep.status !== "completed";
          return (
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
              {isOverdue && "⚠ "}
              {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          );
        })()}

        {/* Task: Show cost (estimated vs actual) */}
        {level === "tasks" && (task.estimatedCost || task.actualCost) && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
            {task.actualCost != null && task.estimatedCost != null
              ? `$${task.actualCost}/$${task.estimatedCost}`
              : `$${task.actualCost ?? task.estimatedCost}`}
          </span>
        )}

        {/* Substep: Show cost */}
        {level === "substeps" && (substep.cost != null || substep.estimatedCost != null) && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
            {substep.cost != null && substep.estimatedCost != null
              ? `$${substep.cost}/$${substep.estimatedCost}`
              : `$${substep.cost ?? substep.estimatedCost}`}
          </span>
        )}

        {/* Task: Show tags */}
        {level === "tasks" && task.tags && task.tags.length > 0 && task.tags.map((tag) => (
          <span key={tag} className="px-1.5 sm:px-2 py-0.5 bg-brand-light text-brand-primary rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* Task: Documents needed */}
      {level === "tasks" && task.documentsNeeded && (
        <div className="mt-1.5 text-[10px] sm:text-xs text-gray-500 flex items-start gap-1">
          <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="line-clamp-1">{task.documentsNeeded}</span>
        </div>
      )}

      {/* Notes preview */}
      {(task.notes || substep.notes) && (
        <div className="mt-1.5 text-[10px] sm:text-xs text-gray-400 italic line-clamp-1">
          {task.notes || substep.notes}
        </div>
      )}

      {/* Timestamps */}
      {(level === "tasks" || level === "substeps") && (item as Task).startedAt && (
        <div className="mt-1.5 text-[10px] text-gray-400 flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Started {new Date((item as Task).startedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {(item as Task).completedAt && (
            <> · Done {new Date((item as Task).completedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
          )}
        </div>
      )}

      {/* Archive button — only in Done column */}
      {columnStatus === "completed" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive?.();
          }}
          className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-600 transition-colors"
          title={(item as Task).isArchived ? "Unarchive" : "Archive"}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span>{(item as Task).isArchived ? "Unarchive" : "Archive"}</span>
        </button>
      )}

      {/* Drag indicator — top-left corner */}
      <div className="absolute top-1.5 left-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>
    </div>
  );
}
