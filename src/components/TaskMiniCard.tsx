"use client";

import { useState } from "react";
import { Task, Substep, TASK_STATUS_CONFIG } from "@/types";
import { SubstepCard } from "./SubstepCard";
import { EditTaskModal } from "./EditTaskModal";
import { formatCurrency } from "@/lib/storage";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { canDelete, canEdit, canAddChild, canReorder, getLockLevel, cycleLock, LockLevel } from "@/lib/locks/lockGuards";
import { taskToMarkdown } from "@/lib/clipboard/taskToMarkdown";
import { useUndoToast } from "@/components/undo/UndoToastProvider";

interface TaskMiniCardProps {
  task: Task;
  onToggle: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onAddSubstep: (title: string, description?: string) => void;
  onUpdateSubstep: (substepId: string, updates: Partial<Substep>) => void;
  onToggleSubstep: (substepId: string) => void;
  onDeleteSubstep: (substepId: string) => void;
  isDragging?: boolean;
  onUpdateLock?: (lockLevel: LockLevel) => void;
  onRestore?: () => void;
}

export function TaskMiniCard({
  task,
  onToggle,
  onUpdate,
  onDelete,
  onAddSubstep,
  onUpdateSubstep,
  onToggleSubstep,
  onDeleteSubstep,
  isDragging,
  onUpdateLock,
  onRestore,
}: TaskMiniCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSubstep, setIsAddingSubstep] = useState(false);
  const [newSubstepTitle, setNewSubstepTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const { showUndoToast } = useUndoToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(taskToMarkdown(task));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    if (!canDelete(task)) return;
    onDelete();
    showUndoToast({
      message: `Task "${task.title}" deleted`,
      onUndo: onRestore ?? (() => {}),
    });
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // Drag and drop for substeps
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const substeps = task.substeps || [];
      const oldIndex = substeps.findIndex((s) => s.id === active.id);
      const newIndex = substeps.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSubsteps = [...substeps];
        const [movedItem] = newSubsteps.splice(oldIndex, 1);
        newSubsteps.splice(newIndex, 0, movedItem);

        // Update order property
        const reorderedSubsteps = newSubsteps.map((s, index) => ({
          ...s,
          order: index + 1,
        }));

        onUpdate({ substeps: reorderedSubsteps });
      }
    }
  };

  const substeps = task.substeps || [];
  const completedSubsteps = substeps.filter((s) => s.status === 'completed').length;
  const hasSubsteps = substeps.length > 0;
  const substepProgress = hasSubsteps ? (completedSubsteps / substeps.length) * 100 : 0;

  // Calculate costs - cumulative tracking
  const taskEstimatedCost = task.estimatedCost || 0;
  const taskActualCost = task.actualCost || 0;
  
  // Sum up substep costs
  const substepEstimatedCost = substeps.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
  const substepActualCost = substeps.reduce((sum, s) => sum + (s.cost || 0), 0);
  
  // Total costs
  const totalEstimatedCost = taskEstimatedCost + substepEstimatedCost;
  const totalActualCost = taskActualCost + substepActualCost;
  
  // Calculate how much has been spent on completed items
  const completedSubstepsCost = substeps
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.cost || s.estimatedCost || 0), 0);
  const spentSoFar = task.status === 'completed' ? totalActualCost : completedSubstepsCost;
  
  const hasCost = totalEstimatedCost > 0 || totalActualCost > 0;

  const priorityStyles = {
    low: "border-l-gray-300",
    medium: "border-l-brand-primary",
    high: "border-l-orange-400",
    critical: "border-l-red-500",
  };

  const handleAddSubstep = () => {
    if (newSubstepTitle.trim()) {
      onAddSubstep(newSubstepTitle.trim());
      setNewSubstepTitle("");
      setIsAddingSubstep(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all ${
          task.status === 'completed'
            ? "border-l-green-500 bg-green-50/50"
            : task.status === 'in_progress'
            ? "border-l-orange-500 bg-orange-50/30"
            : priorityStyles[task.priority || "medium"]
        }`}
      >
        {/* Main Card Header */}
        <div className="p-2 sm:p-4">
          <div className="flex items-start gap-1.5 sm:gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...(canReorder(task) ? listeners : {})}
              className="cursor-grab active:cursor-grabbing flex-shrink-0 p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 mt-0.5"
              title="Drag to reorder task"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Status Button */}
            <button
              onClick={onToggle}
              role="button"
              aria-label={`Toggle task "${task.title}" status`}
              title={TASK_STATUS_CONFIG[task.status || 'not_started']?.label || 'Toggle status'}
              className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                task.status === 'completed'
                  ? "bg-green-500 border-green-500 text-white"
                  : task.status === 'in_progress'
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-gray-300 hover:border-green-500 hover:bg-green-50"
              }`}
            >
              {task.status === 'completed' && (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {task.status === 'in_progress' && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {task.stepNumber && (
                  <span className="px-1.5 py-0.5 bg-brand-light text-brand-primary text-[10px] sm:text-xs font-mono font-bold rounded">
                    {task.stepNumber}
                  </span>
                )}
                {getLockLevel(task) === 'soft' && (
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Soft locked">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0v4m-4 8v-4m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
                {getLockLevel(task) === 'hard' && (
                  <svg className="w-3 h-3 text-brand-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Hard locked">
                    <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8V6a3 3 0 10-6 0v3h6zm-3 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
                <h4
                  className={`text-xs sm:text-base font-medium ${
                    task.status === 'completed' ? "text-gray-500 line-through" : "text-gray-800"
                  }`}
                >
                  {task.title}
                </h4>
              </div>

              {/* Quick Info */}
              <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                {hasCost && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs rounded-full">
                    <span>💰</span>
                    {totalActualCost > 0 ? formatCurrency(totalActualCost) : formatCurrency(totalEstimatedCost)}
                    {spentSoFar > 0 && spentSoFar !== totalActualCost && (
                      <span className="text-emerald-600 font-semibold">
                        ({formatCurrency(spentSoFar)} spent)
                      </span>
                    )}
                  </span>
                )}
                {hasSubsteps && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-light/40 text-brand-primary text-[10px] sm:text-xs rounded-full">
                    <span>📋</span>
                    {completedSubsteps}/{substeps.length} substeps
                  </span>
                )}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] sm:text-xs rounded-full">
                    <span>📅</span>
                    {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                {task.priority && task.priority !== "medium" && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full ${
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
              </div>

              {/* Substep Progress Bar */}
              {hasSubsteps && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: `${substepProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={handleCopy}
                className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                  copied ? "text-green-500 bg-green-50" : "text-gray-400 hover:text-brand-primary hover:bg-brand-light"
                }`}
                title={copied ? "Copied!" : "Copy as Markdown"}
              >
                {copied ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => onUpdateLock?.(cycleLock(getLockLevel(task)))}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors"
                title={`Lock: ${getLockLevel(task)}`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0v4m-4 8v-4m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={!canEdit(task)}
                className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                  canEdit(task)
                    ? "text-gray-400 hover:text-brand-primary hover:bg-brand-light"
                    : "text-gray-400 opacity-40 cursor-not-allowed"
                }`}
                title={canEdit(task) ? "Edit" : "Locked"}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete(task)}
                className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                  canDelete(task)
                    ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    : "text-gray-400 opacity-40 cursor-not-allowed"
                }`}
                title={canDelete(task) ? "Delete" : "Locked"}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-2 sm:px-4 pb-2 sm:pb-4 border-t border-gray-100 pt-2 sm:pt-3 space-y-2 sm:space-y-3">
            {/* Cost Tracking Section */}
            {hasCost && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-2 sm:p-3">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h5 className="text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-1">
                    <span>💰</span>
                    Cost Tracking
                  </h5>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                  <div className="bg-white/60 rounded p-1.5 sm:p-2">
                    <p className="text-gray-600 mb-0.5">Estimated</p>
                    <p className="text-emerald-700 font-bold text-sm sm:text-base">
                      {formatCurrency(totalEstimatedCost)}
                    </p>
                  </div>
                  <div className="bg-white/60 rounded p-1.5 sm:p-2">
                    <p className="text-gray-600 mb-0.5">Actual Spent</p>
                    <p className="text-emerald-700 font-bold text-sm sm:text-base">
                      {formatCurrency(totalActualCost)}
                    </p>
                  </div>
                  <div className="bg-white/60 rounded p-1.5 sm:p-2 col-span-2">
                    <p className="text-gray-600 mb-0.5">Spent on Completed Items</p>
                    <p className="text-brand-primary font-bold text-sm sm:text-base">
                      {formatCurrency(spentSoFar)}
                    </p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary rounded-full transition-all"
                        style={{
                          width: `${totalEstimatedCost > 0 ? (spentSoFar / totalEstimatedCost) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {task.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs font-medium text-yellow-800 mb-0.5">Notes:</p>
                <p className="text-xs sm:text-sm text-yellow-700">{task.notes}</p>
              </div>
            )}

            {/* Documents Needed */}
            {task.documentsNeeded && task.documentsNeeded !== "None" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs font-medium text-amber-800 mb-0.5">Documents Needed:</p>
                <p className="text-xs sm:text-sm text-amber-700">{task.documentsNeeded}</p>
              </div>
            )}

            {/* Substeps Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <h5 className="text-xs sm:text-sm font-semibold text-gray-700">Substeps</h5>
                {canAddChild(task) && (
                  <button
                    onClick={() => setIsAddingSubstep(true)}
                    className="text-[10px] sm:text-xs text-brand-primary hover:text-brand-secondary font-medium flex items-center gap-0.5 sm:gap-1"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Substep
                  </button>
                )}
              </div>

              {/* Substeps List with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={substeps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {substeps.map((substep) => (
                      <SubstepCard
                        key={substep.id}
                        substep={substep}
                        onToggle={() => onToggleSubstep(substep.id)}
                        onUpdate={(updates) => onUpdateSubstep(substep.id, updates)}
                        onDelete={() => onDeleteSubstep(substep.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Substep Form */}
              {isAddingSubstep && (
                <div className="mt-1.5 sm:mt-2 flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={newSubstepTitle}
                    onChange={(e) => setNewSubstepTitle(e.target.value)}
                    placeholder="Enter substep..."
                    className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubstep();
                      if (e.key === "Escape") {
                        setIsAddingSubstep(false);
                        setNewSubstepTitle("");
                      }
                    }}
                  />
                  <button
                    onClick={handleAddSubstep}
                    disabled={!newSubstepTitle.trim()}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingSubstep(false);
                      setNewSubstepTitle("");
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {substeps.length === 0 && !isAddingSubstep && (
                <p className="text-xs sm:text-sm text-gray-400 text-center py-1.5 sm:py-2">
                  No substeps yet. Break this task into smaller steps!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditTaskModal
        task={task}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onUpdate}
      />
    </>
  );
}
