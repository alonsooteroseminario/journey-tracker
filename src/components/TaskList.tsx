"use client";

import { useState } from "react";
import { Task, Substep } from "@/types";
import { TaskMiniCard } from "./TaskMiniCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string, description?: string) => void;
  onAddSubstep: (taskId: string, title: string, description?: string) => void;
  onUpdateSubstep: (taskId: string, substepId: string, updates: Partial<Substep>) => void;
  onToggleSubstep: (taskId: string, substepId: string) => void;
  onDeleteSubstep: (taskId: string, substepId: string) => void;
  onReorderTasks?: (tasks: Task[]) => void;
}

export function TaskList({
  tasks,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onAddSubstep,
  onUpdateSubstep,
  onToggleSubstep,
  onDeleteSubstep,
  onReorderTasks,
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderTasks) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = [...tasks];
        const [movedTask] = newTasks.splice(oldIndex, 1);
        newTasks.splice(newIndex, 0, movedTask);

        // Update order property
        const reorderedTasks = newTasks.map((t, index) => ({
          ...t,
          order: index + 1,
        }));

        onReorderTasks(reorderedTasks);
      }
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), newTaskDescription.trim() || undefined);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "cards"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Cards
            </span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </span>
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {completedTasks.length}/{tasks.length} complete
        </span>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            To Do ({pendingTasks.length})
          </h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pendingTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={viewMode === "cards" ? "space-y-3" : "space-y-1"}>
                {pendingTasks.map((task) => (
                  <TaskMiniCard
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(task.id)}
                    onUpdate={(updates) => onUpdateTask(task.id, updates)}
                    onDelete={() => onDeleteTask(task.id)}
                    onAddSubstep={(title, desc) => onAddSubstep(task.id, title, desc)}
                    onUpdateSubstep={(substepId, updates) => onUpdateSubstep(task.id, substepId, updates)}
                    onToggleSubstep={(substepId) => onToggleSubstep(task.id, substepId)}
                    onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, substepId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Task Form */}
      {isAdding ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleAddTask();
              }
              if (e.key === "Escape") {
                setIsAdding(false);
              }
            }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTask();
              }
              if (e.key === "Escape") {
                setIsAdding(false);
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Task
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Task
        </button>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                showCompleted ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Completed ({completedTasks.length})
          </button>
          {showCompleted && (
            <div className={viewMode === "cards" ? "space-y-3" : "space-y-1"}>
              {completedTasks.map((task) => (
                <TaskMiniCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task.id)}
                  onUpdate={(updates) => onUpdateTask(task.id, updates)}
                  onDelete={() => onDeleteTask(task.id)}
                  onAddSubstep={(title, desc) => onAddSubstep(task.id, title, desc)}
                  onUpdateSubstep={(substepId, updates) => onUpdateSubstep(task.id, substepId, updates)}
                  onToggleSubstep={(substepId) => onToggleSubstep(task.id, substepId)}
                  onDeleteSubstep={(substepId) => onDeleteSubstep(task.id, substepId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-lg">No tasks yet</p>
          <p className="text-sm">Add your first task to get started!</p>
        </div>
      )}
    </div>
  );
}
