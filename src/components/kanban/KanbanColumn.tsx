"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { TaskStatus } from "@/types";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  items: any[];
  level: "goals" | "tasks" | "substeps";
  onDrillDown: (itemId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (status: string) => void;
}

export function KanbanColumn({ title, status, items, level, onDrillDown, isCollapsed, onToggleCollapse }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const columnColors = {
    not_started: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      header: "bg-gray-100 text-gray-700",
      hoverBorder: "border-gray-400",
    },
    in_progress: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      header: "bg-orange-100 text-orange-700",
      hoverBorder: "border-orange-400",
    },
    completed: {
      bg: "bg-green-50",
      border: "border-green-200",
      header: "bg-green-100 text-green-700",
      hoverBorder: "border-green-400",
    },
  };

  const colors = columnColors[status];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 transition-all ${colors.bg} ${
        isOver ? colors.hoverBorder : colors.border
      } ${isOver ? "shadow-lg" : ""}`}
    >
      {/* Column Header */}
      <div
        className={`px-2 sm:px-4 py-2 sm:py-3 rounded-t-lg ${isCollapsed ? "rounded-b-lg" : ""} ${colors.header} font-semibold flex items-center justify-between text-sm sm:text-base cursor-pointer select-none`}
        onClick={() => onToggleCollapse?.(status)}
      >
        <div className="flex items-center gap-1.5">
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>{title}</span>
        </div>
        <span className="text-xs sm:text-sm font-normal opacity-75">
          {items.length}
        </span>
      </div>

      {/* Column Body — hidden when collapsed */}
      {!isCollapsed && (
        <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-h-[200px] sm:min-h-[400px]">
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                level={level}
                onDrillDown={() => onDrillDown(item.id)}
              />
            ))}
          </SortableContext>

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Drag items here
            </div>
          )}
        </div>
      )}
    </div>
  );
}
