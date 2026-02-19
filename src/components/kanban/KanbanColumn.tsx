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
}

export function KanbanColumn({ title, status, items, level, onDrillDown }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const columnColors = {
    not_started: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      header: "bg-gray-100 text-gray-700",
      hoverBorder: "border-gray-400",
    },
    in_progress: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      header: "bg-blue-100 text-blue-700",
      hoverBorder: "border-blue-400",
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
      <div className={`px-4 py-3 rounded-t-lg ${colors.header} font-semibold flex items-center justify-between`}>
        <span>{title}</span>
        <span className="text-sm font-normal opacity-75">
          {items.length}
        </span>
      </div>

      {/* Column Body */}
      <div className="p-3 space-y-2 min-h-[500px]">
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
    </div>
  );
}
