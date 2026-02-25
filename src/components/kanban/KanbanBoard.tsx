"use client";

import { useState, useMemo, useCallback } from "react";
import { useGoalsCRUD } from "@/hooks/useGoalsCRUD";
import { useStreakData } from "@/hooks/useStreakData";
import { Goal, Task, Substep, TaskStatus } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanBreadcrumb } from "./KanbanBreadcrumb";
import { KanbanFilters } from "./KanbanFilters";
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from "@dnd-kit/core";

type ViewLevel = "goals" | "tasks" | "substeps";

interface DrillDownContext {
  level: ViewLevel;
  goalId?: string;
  taskId?: string;
}

// Augmented item carrying parent IDs for flat views
type FlatItem = (Goal | Task | Substep) & { _goalId?: string; _taskId?: string };

export function KanbanBoard() {
  const [drillDown, setDrillDown] = useState<DrillDownContext>({ level: "goals" });
  const [viewLevel, setViewLevel] = useState<ViewLevel>("goals");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "overdue" | "today" | "week">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Collapsible columns — persisted in localStorage
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("kanban-collapsed-columns");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleColumnCollapse = useCallback((status: string) => {
    setCollapsedColumns((prev) => {
      const next = { ...prev, [status]: !prev[status] };
      try { localStorage.setItem("kanban-collapsed-columns", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const { triggerStreakUpdate, logActivity } = useStreakData();

  const {
    goals,
    goalsLoading,
    toggleTask,
    toggleSubstep,
    updateTask,
    updateSubstep,
    updateGoal,
  } = useGoalsCRUD(logActivity, triggerStreakUpdate);

  // Determine effective level: viewLevel filter takes priority over drill-down
  const effectiveLevel = viewLevel !== "goals" ? viewLevel : drillDown.level;

  // Get current view data based on effective level
  const viewData: Array<FlatItem> = useMemo(() => {
    // Flat "all tasks" view
    if (viewLevel === "tasks") {
      return goals.flatMap((g) =>
        (g.tasks || []).map((t) => ({ ...t, _goalId: g.id } as FlatItem))
      );
    }

    // Flat "all substeps" view
    if (viewLevel === "substeps") {
      return goals.flatMap((g) =>
        (g.tasks || []).flatMap((t) =>
          (t.substeps || []).map((s) => ({ ...s, _goalId: g.id, _taskId: t.id } as FlatItem))
        )
      );
    }

    // Goals view (with drill-down)
    if (drillDown.level === "goals") {
      return goals.map((g) => {
        const tasks = g.tasks || [];
        let status: TaskStatus = "not_started";
        if (tasks.length > 0) {
          const allCompleted = tasks.every((t) => (t.status || "not_started") === "completed");
          const anyStarted = tasks.some((t) => (t.status || "not_started") !== "not_started");
          if (allCompleted) status = "completed";
          else if (anyStarted) status = "in_progress";
        }
        return { ...g, status } as FlatItem;
      });
    } else if (drillDown.level === "tasks" && drillDown.goalId) {
      const goal = goals.find((g) => g.id === drillDown.goalId);
      return ((goal?.tasks || []) as FlatItem[]).map((t) => ({ ...t, _goalId: drillDown.goalId } as FlatItem));
    } else if (drillDown.level === "substeps" && drillDown.goalId && drillDown.taskId) {
      const goal = goals.find((g) => g.id === drillDown.goalId);
      const task = goal?.tasks.find((t) => t.id === drillDown.taskId);
      return ((task?.substeps || []) as FlatItem[]).map((s) => ({ ...s, _goalId: drillDown.goalId, _taskId: drillDown.taskId } as FlatItem));
    }
    return [];
  }, [goals, drillDown, viewLevel]);

  // Apply filters
  const filteredData = useMemo(() => {
    let data = viewData;

    // Hide archived items unless toggle is on
    if (!showArchived) {
      data = data.filter((item: any) => !item.isArchived);
    }

    // Search filter
    if (searchTerm) {
      data = data.filter((item: any) =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter (only for tasks)
    if (priorityFilter !== "all" && effectiveLevel === "tasks") {
      data = data.filter((item: any) => item.priority === priorityFilter);
    }

    // Date filter (only for tasks with dueDate)
    if (dateFilter !== "all" && effectiveLevel === "tasks") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      data = data.filter((item: any) => {
        if (!item.dueDate) return false;
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dateFilter === "overdue") return dueDate < today;
        if (dateFilter === "today") return dueDate.getTime() === today.getTime();
        if (dateFilter === "week") return dueDate >= today && dueDate <= weekFromNow;
        return true;
      });
    }

    return data;
  }, [viewData, searchTerm, dateFilter, priorityFilter, effectiveLevel, showArchived]);

  // Group by status
  const columns = useMemo(() => {
    const notStarted = filteredData.filter((item: any) => item.status === "not_started");
    const inProgress = filteredData.filter((item: any) => item.status === "in_progress");
    const completed = filteredData.filter((item: any) => item.status === "completed");

    return { notStarted, inProgress, completed };
  }, [filteredData]);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the item being dragged
    const item = filteredData.find((d: any) => d.id === itemId) as FlatItem | undefined;
    if (!item) return;

    // Goals don't have a persisted status — skip
    if (effectiveLevel === "goals") return;

    // Check if status hasn't changed
    if ('status' in item && item.status === newStatus) return;

    if (effectiveLevel === "tasks") {
      const goalId = item._goalId || drillDown.goalId;
      if (goalId) updateTask(goalId, itemId, { status: newStatus });
    } else if (effectiveLevel === "substeps") {
      const goalId = item._goalId || drillDown.goalId;
      const taskId = item._taskId || drillDown.taskId;
      if (goalId && taskId) updateSubstep(goalId, taskId, itemId, { status: newStatus });
    }
  };

  const handleArchive = useCallback((itemId: string) => {
    const item = filteredData.find((d: any) => d.id === itemId) as FlatItem | undefined;
    if (!item) return;

    const isArchived = !(item as any).isArchived;
    const archiveUpdates = {
      isArchived,
      archivedAt: isArchived ? new Date().toISOString() : undefined,
    };

    if (effectiveLevel === "tasks" || (effectiveLevel === "goals" && drillDown.level === "tasks")) {
      const goalId = item._goalId || drillDown.goalId;
      if (goalId) updateTask(goalId, itemId, archiveUpdates);
    } else if (effectiveLevel === "substeps" || (effectiveLevel === "goals" && drillDown.level === "substeps")) {
      const goalId = item._goalId || drillDown.goalId;
      const taskId = item._taskId || drillDown.taskId;
      if (goalId && taskId) updateSubstep(goalId, taskId, itemId, archiveUpdates);
    }
  }, [filteredData, effectiveLevel, drillDown, updateTask, updateSubstep]);

  const handleDrillDown = (itemId: string) => {
    if (effectiveLevel === "goals") {
      // When in flat tasks/substeps mode, drill-down from goals level doesn't apply
      // but when in goals drill-down mode, navigate into that goal's tasks
      setViewLevel("goals"); // ensure we're in drill-down mode
      setDrillDown({ level: "tasks", goalId: itemId });
    } else if (effectiveLevel === "tasks") {
      // Find the parent goalId from the flat item metadata
      const item = filteredData.find((d: any) => d.id === itemId) as FlatItem | undefined;
      const goalId = item?._goalId || drillDown.goalId;
      if (goalId) {
        setViewLevel("goals"); // switch back to drill-down mode
        setDrillDown({ level: "substeps", goalId, taskId: itemId });
      }
    }
  };

  const handleBreadcrumbClick = (level: ViewLevel) => {
    setViewLevel("goals"); // breadcrumb always returns to drill-down mode
    if (level === "goals") {
      setDrillDown({ level: "goals" });
    } else if (level === "tasks") {
      setDrillDown({ level: "tasks", goalId: drillDown.goalId });
    }
  };

  const handleViewLevelChange = (level: ViewLevel) => {
    setViewLevel(level);
    if (level !== "goals") {
      // Reset drill-down when switching to flat views
      setDrillDown({ level: "goals" });
    }
  };

  // Get context names for breadcrumb
  const contextNames = useMemo(() => {
    const names: { goals?: string; tasks?: string } = {};

    if (drillDown.goalId) {
      const goal = goals.find((g) => g.id === drillDown.goalId);
      names.goals = goal?.title || "Unknown Goal";
    }

    if (drillDown.taskId && drillDown.goalId) {
      const goal = goals.find((g) => g.id === drillDown.goalId);
      const task = goal?.tasks.find((t) => t.id === drillDown.taskId);
      names.tasks = task?.title || "Unknown Task";
    }

    return names;
  }, [drillDown, goals]);

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb — only show when in drill-down mode (not flat view) */}
      {viewLevel === "goals" && (
        <KanbanBreadcrumb
          level={drillDown.level}
          goalName={contextNames.goals}
          taskName={contextNames.tasks}
          onNavigate={handleBreadcrumbClick}
        />
      )}

      {/* Filters */}
      <KanbanFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        showDateFilter={effectiveLevel === "tasks"}
        showPriorityFilter={effectiveLevel === "tasks"}
        viewLevel={viewLevel}
        onViewLevelChange={handleViewLevelChange}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      {/* Kanban Columns */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
          <KanbanColumn
            title="Not Started"
            status="not_started"
            items={columns.notStarted}
            level={effectiveLevel}
            onDrillDown={handleDrillDown}
            isCollapsed={!!collapsedColumns["not_started"]}
            onToggleCollapse={toggleColumnCollapse}
          />
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            items={columns.inProgress}
            level={effectiveLevel}
            onDrillDown={handleDrillDown}
            isCollapsed={!!collapsedColumns["in_progress"]}
            onToggleCollapse={toggleColumnCollapse}
          />
          <KanbanColumn
            title="Done"
            status="completed"
            items={columns.completed}
            level={effectiveLevel}
            onDrillDown={handleDrillDown}
            onArchive={handleArchive}
            isCollapsed={!!collapsedColumns["completed"]}
            onToggleCollapse={toggleColumnCollapse}
          />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500 opacity-90">
              {filteredData.find((d: any) => d.id === activeId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600">No items found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || dateFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your filters"
              : effectiveLevel === "goals"
              ? "Create a goal to get started"
              : `No ${effectiveLevel} found`}
          </p>
        </div>
      )}
    </div>
  );
}
