"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Goal, Task, Substep } from "@/types";

interface KanbanCardProps {
  item: Goal | Task | Substep;
  level: "goals" | "tasks" | "substeps";
  onDrillDown: () => void;
}

export function KanbanCard({ item, level, onDrillDown }: KanbanCardProps) {
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
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">
          {item.title}
        </h4>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown();
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description || substep.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {/* Goal: Show task count */}
        {level === "goals" && goal.tasks && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            {goal.tasks.length} tasks
          </span>
        )}

        {/* Task: Show substep count */}
        {level === "tasks" && task.substeps && task.substeps.length > 0 && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            {task.substeps.filter((s) => s.status === "completed").length}/{task.substeps?.length || 0} substeps
          </span>
        )}

        {/* Task: Show priority */}
        {level === "tasks" && task.priority && task.priority !== "medium" && (
          <span
            className={`px-2 py-0.5 rounded-full ${
              task.priority === "critical"
                ? "bg-red-100 text-red-700"
                : task.priority === "high"
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {task.priority}
          </span>
        )}

        {/* Task: Show due date */}
        {level === "tasks" && task.dueDate && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}

        {/* Task/Substep: Show cost */}
        {(level === "tasks" && (task.estimatedCost || task.actualCost)) && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
            ${task.actualCost || task.estimatedCost}
          </span>
        )}
        {level === "substeps" && substep.cost && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
            ${substep.cost}
          </span>
        )}
      </div>

      {/* Drag indicator */}
      <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-center gap-1 text-gray-400">
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
    </div>
  );
}
