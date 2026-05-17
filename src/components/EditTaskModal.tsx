"use client";

import { useState, useEffect } from "react";
import { Task, Substep, TaskStatus, TASK_STATUS_CONFIG } from "@/types";
import { formatCurrency } from "@/lib/storage";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}

export function EditTaskModal({ task, isOpen, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [actualCost, setActualCost] = useState(task.actualCost?.toString() || "");
  const [estimatedCost, setEstimatedCost] = useState(task.estimatedCost?.toString() || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [priority, setPriority] = useState<Task["priority"]>(task.priority || "medium");
  const [status, setStatus] = useState<TaskStatus>(task.status || "not_started");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setActualCost(task.actualCost?.toString() || "");
    setEstimatedCost(task.estimatedCost?.toString() || "");
    setDueDate(task.dueDate || "");
    setNotes(task.notes || "");
    setPriority(task.priority || "medium");
    setStatus(task.status || "not_started");
  }, [task]);

  const focusTrapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      actualCost: actualCost ? parseFloat(actualCost) : undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      priority,
      status,
    });
    onClose();
  };

  const priorityColors = {
    low: "bg-surface-hover text-text-secondary border-border-strong",
    medium: "bg-brand-light text-brand-primary border-brand-light",
    high: "bg-orange-100 text-orange-700 border-orange-300",
    critical: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <div
      className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
    >
      <div ref={focusTrapRef} className="bg-surface-elevated rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="edit-task-title" className="text-xl font-bold text-white">Edit Task</h2>
              {task.stepNumber && (
                <span className="text-white/80 text-sm">Step {task.stepNumber}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 transition-colors"
              aria-label="Close edit task modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-surface text-text-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none bg-surface text-text-primary"
            />
          </div>

          {/* Cost Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Estimated Cost (CAD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-text-muted">$</span>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-surface text-text-primary"
                />
              </div>
              {task.cost && (
                <p className="text-xs text-text-muted mt-1">Original: {task.cost}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Actual Cost (CAD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-text-muted">$</span>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-surface text-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-surface text-text-primary"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high", "critical"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    priority === p
                      ? priorityColors[p]
                      : "bg-surface-muted text-text-muted border-border hover:bg-surface-hover"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status <span className="text-text-muted text-xs">(Optional)</span>
            </label>
            <div className="flex gap-2">
              {(["not_started", "in_progress", "completed"] as const).map((s) => {
                const config = TASK_STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      status === s
                        ? s === "completed"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : s === "in_progress"
                          ? "bg-orange-100 text-orange-700 border-orange-300"
                          : "bg-surface-hover text-text-secondary border-border-strong"
                        : "bg-surface-muted text-text-muted border-border hover:bg-surface-hover"
                    }`}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add personal notes, reminders, or links..."
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none bg-surface text-text-primary"
            />
          </div>

          {/* Documents Needed (Read-only) */}
          {task.documentsNeeded && task.documentsNeeded !== "None" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800">Documents Needed:</p>
              <p className="text-sm text-amber-700">{task.documentsNeeded}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-muted border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-border-strong rounded-lg text-text-secondary hover:bg-surface-hover transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
