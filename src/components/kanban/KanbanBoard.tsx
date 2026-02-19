"use client";

import { useState, useMemo } from "react";
import { useGoalsCRUD } from "@/hooks/useGoalsCRUD";
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

export function KanbanBoard() {
  const [drillDown, setDrillDown] = useState<DrillDownContext>({ level: "goals" });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "overdue" | "today" | "week">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    goals,
    goalsLoading,
    toggleTask,
    toggleSubstep,
    updateTask,
    updateSubstep,
    updateGoal,
  } = useGoalsCRUD(
    () => {}, // logActivity
    () => {}  // triggerStreakUpdate
  );

  // Get current view data based on drill-down level
  const viewData: Array<Goal | Task | Substep> = useMemo(() => {
    if (drillDown.level === "goals") {
      return goals as Array<Goal | Task | Substep>;
    } else if (drillDown.level === "tasks" && drillDown.goalId) {
      const goal = goals.find((g) => g.id === drillDown.goalId);
      return (goal?.tasks || []) as Array<Goal | Task | Substep>;
    } else if (drillDown.level === "substeps" && drillDown.goalId && drillDown.taskId) {
      const goal = goals.find((g) => g.id === drillDown.goalId);
      const task = goal?.tasks.find((t) => t.id === drillDown.taskId);
      return (task?.substeps || []) as Array<Goal | Task | Substep>;
    }
    return [];
  }, [goals, drillDown]);

  // Apply filters
  const filteredData = useMemo(() => {
    let data = viewData;

    // Search filter
    if (searchTerm) {
      data = data.filter((item: any) =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter (only for tasks)
    if (priorityFilter !== "all" && drillDown.level === "tasks") {
      data = data.filter((item: any) => item.priority === priorityFilter);
    }

    // Date filter (only for tasks with dueDate)
    if (dateFilter !== "all" && drillDown.level === "tasks") {
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
  }, [viewData, searchTerm, dateFilter, priorityFilter, drillDown.level]);

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
    const item = filteredData.find((d: any) => d.id === itemId);
    if (!item) return;

    // Update based on drill-down level
    if (drillDown.level === "goals") {
      // Goals don't have status - skip for now
      return;
    }

    // Check if status hasn't changed (only for tasks/substeps)
    if ('status' in item && item.status === newStatus) return;

    if (drillDown.level === "tasks" && drillDown.goalId) {
      updateTask(drillDown.goalId, itemId, { status: newStatus });
    } else if (drillDown.level === "substeps" && drillDown.goalId && drillDown.taskId) {
      updateSubstep(drillDown.goalId, drillDown.taskId, itemId, { status: newStatus });
    }
  };

  const handleDrillDown = (itemId: string) => {
    if (drillDown.level === "goals") {
      setDrillDown({ level: "tasks", goalId: itemId });
    } else if (drillDown.level === "tasks") {
      setDrillDown({ level: "substeps", goalId: drillDown.goalId, taskId: itemId });
    }
  };

  const handleBreadcrumbClick = (level: ViewLevel) => {
    if (level === "goals") {
      setDrillDown({ level: "goals" });
    } else if (level === "tasks") {
      setDrillDown({ level: "tasks", goalId: drillDown.goalId });
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
      {/* Breadcrumb */}
      <KanbanBreadcrumb
        level={drillDown.level}
        goalName={contextNames.goals}
        taskName={contextNames.tasks}
        onNavigate={handleBreadcrumbClick}
      />

      {/* Filters */}
      <KanbanFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        showDateFilter={drillDown.level === "tasks"}
        showPriorityFilter={drillDown.level === "tasks"}
      />

      {/* Kanban Columns */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KanbanColumn
            title="Not Started"
            status="not_started"
            items={columns.notStarted}
            level={drillDown.level}
            onDrillDown={handleDrillDown}
          />
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            items={columns.inProgress}
            level={drillDown.level}
            onDrillDown={handleDrillDown}
          />
          <KanbanColumn
            title="Done"
            status="completed"
            items={columns.completed}
            level={drillDown.level}
            onDrillDown={handleDrillDown}
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
              : drillDown.level === "goals"
              ? "Create a goal to get started"
              : "No items in this view"}
          </p>
        </div>
      )}
    </div>
  );
}
