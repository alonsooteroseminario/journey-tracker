import React from "react";
import type { TaskData } from "./types";

interface KanbanCardProps {
  task: TaskData;
  sz: (n: number) => number;
  isCompact?: boolean;
}

const getBorderColor = (task: TaskData): string => {
  if (task.status === "done") return "#16a34a";
  if (task.priority === "high" || task.priority === "critical") return "#dc2626";
  if (task.priority === "medium") return "#d97706";
  if (task.priority === "low") return "#16a34a";
  return "transparent";
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  sz,
  isCompact = false,
}) => {
  const isDone = task.status === "done";
  const padding = isCompact ? sz(8) : sz(12);
  const titleSize = isCompact ? sz(12) : sz(14);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: sz(8),
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderLeft: `${sz(4)}px solid ${getBorderColor(task)}`,
        padding,
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: sz(6),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: sz(8),
        }}
      >
        {/* Checkbox */}
        {isDone ? (
          <span style={{ fontSize: sz(14), color: "#16a34a" }}>✅</span>
        ) : (
          <div
            style={{
              width: sz(14),
              height: sz(14),
              borderRadius: "50%",
              border: `${sz(2)}px solid #9ca3af`,
              flexShrink: 0,
            }}
          />
        )}

        {/* Title */}
        <span
          style={{
            fontSize: titleSize,
            color: "#111827",
            textDecoration: isDone ? "line-through" : "none",
            lineHeight: 1.3,
          }}
        >
          {task.title}
        </span>
      </div>

      {task.substeps !== undefined && task.substeps > 0 && (
        <span
          style={{
            fontSize: sz(12),
            color: "#9ca3af",
            paddingLeft: sz(22),
          }}
        >
          {task.substeps} substeps
        </span>
      )}
    </div>
  );
};
