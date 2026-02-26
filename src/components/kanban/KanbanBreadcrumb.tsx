"use client";

interface KanbanBreadcrumbProps {
  level: "goals" | "tasks" | "substeps";
  goalName?: string;
  taskName?: string;
  onNavigate: (level: "goals" | "tasks") => void;
}

export function KanbanBreadcrumb({ level, goalName, taskName, onNavigate }: KanbanBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
      <button
        onClick={() => onNavigate("goals")}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
          level === "goals"
            ? "bg-brand-light text-brand-primary font-semibold"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        🎯 All Goals
      </button>

      {(level === "tasks" || level === "substeps") && goalName && (
        <>
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button
            onClick={() => onNavigate("tasks")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
              level === "tasks"
                ? "bg-brand-light text-brand-primary font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 {goalName}
          </button>
        </>
      )}

      {level === "substeps" && taskName && (
        <>
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-brand-light text-brand-primary font-semibold rounded-lg">
            ✓ {taskName}
          </span>
        </>
      )}
    </nav>
  );
}
