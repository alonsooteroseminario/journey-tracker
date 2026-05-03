"use client";

import { useState } from "react";
import { Substep, TaskStatus, TASK_STATUS_CONFIG } from "@/types";
import { formatCurrency } from "@/lib/storage";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { canDelete, canEdit, getLockLevel, cycleLock, LockLevel } from "@/lib/locks/lockGuards";
import { useUndoToast } from "@/components/undo/UndoToastProvider";

interface SubstepCardProps {
  substep: Substep;
  onToggle: () => void;
  onUpdate: (updates: Partial<Substep>) => void;
  onDelete: () => void;
  isDragging?: boolean;
  onUpdateLock?: (lockLevel: LockLevel) => void;
  onRestore?: () => void;
}

export function SubstepCard({ substep, onToggle, onUpdate, onDelete, isDragging, onUpdateLock, onRestore }: SubstepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(substep.title);
  const [editCost, setEditCost] = useState(substep.cost?.toString() || "");
  const [editNotes, setEditNotes] = useState(substep.notes || "");
  const [editStatus, setEditStatus] = useState<TaskStatus>(substep.status || "not_started");
  const [copied, setCopied] = useState(false);

  const { showUndoToast } = useUndoToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: substep.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      cost: editCost ? parseFloat(editCost) : undefined,
      notes: editNotes || undefined,
      status: editStatus,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(substep.title);
    setEditCost(substep.cost?.toString() || "");
    setEditNotes(substep.notes || "");
    setEditStatus(substep.status || "not_started");
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(substep.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    if (!canDelete(substep)) return;
    onDelete();
    showUndoToast({
      message: `Substep "${substep.title}" deleted`,
      onUndo: onRestore ?? (() => {}),
    });
  };

  const lockLevel = getLockLevel(substep);
  const editDisabled = !canEdit(substep);
  const deleteDisabled = !canDelete(substep);
  const reorderAllowed = !( lockLevel === 'hard' );

  if (isEditing) {
    return (
      <div className="bg-brand-light border border-brand-light rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          placeholder="Substep title"
          autoFocus
        />
        <div className="flex gap-1.5 sm:gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1 sm:top-1.5 text-gray-500 text-xs sm:text-sm">$</span>
            <input
              type="number"
              value={editCost}
              onChange={(e) => setEditCost(e.target.value)}
              className="w-full pl-5 sm:pl-6 pr-2 sm:pr-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Cost"
            />
          </div>
          <input
            type="text"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Notes"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="flex gap-1 sm:gap-1.5">
            {(["not_started", "in_progress", "completed"] as const).map((s) => {
              const config = TASK_STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditStatus(s)}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium transition-all ${
                    editStatus === s
                      ? s === "completed"
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : s === "in_progress"
                        ? "bg-orange-100 text-orange-700 border border-orange-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xs">{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={handleSave}
            disabled={!editTitle.trim()}
            className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-all ${
        substep.status === 'completed'
          ? "bg-green-50 border border-green-200"
          : substep.status === 'in_progress'
          ? "bg-orange-50 border border-orange-200"
          : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...(reorderAllowed ? listeners : {})}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Status Button */}
      <button
        onClick={onToggle}
        role="button"
        aria-label={`Toggle substep "${substep.title}" status`}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          substep.status === 'completed'
            ? "bg-green-500 border-green-500 text-white"
            : substep.status === 'in_progress'
            ? "bg-orange-500 border-orange-500 text-white"
            : "border-gray-300 hover:border-green-500"
        }`}
      >
        {substep.status === 'completed' && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {substep.status === 'in_progress' && (
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {/* Lock badge */}
          {lockLevel === 'soft' && (
            <svg
              className="w-3 h-3 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Soft locked"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
          {lockLevel === 'hard' && (
            <svg
              className="w-3 h-3 text-brand-primary flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="Hard locked"
            >
              <path d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V11a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm-3 5a3 3 0 116 0v3H9V6zm3 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
          )}
          <p
            className={`text-xs sm:text-sm ${
              substep.status === 'completed' ? "text-gray-500 line-through" : "text-gray-700"
            }`}
          >
            {substep.title}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
          {substep.cost !== undefined && substep.cost > 0 && (
            <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
              {formatCurrency(substep.cost)}
            </span>
          )}
          {substep.notes && (
            <span className="text-[10px] sm:text-xs text-gray-400 truncate max-w-24" title={substep.notes}>
              {substep.notes}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className={`p-1 rounded transition-colors ${
            copied
              ? "text-green-500 bg-green-50"
              : "text-gray-400 hover:text-brand-primary hover:bg-brand-light"
          }`}
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => { if (!editDisabled) setIsEditing(true); }}
          disabled={editDisabled}
          className={`p-1 rounded transition-colors ${
            editDisabled
              ? "text-gray-300 opacity-40 cursor-not-allowed"
              : "text-gray-400 hover:text-brand-primary hover:bg-brand-light"
          }`}
          title={editDisabled ? "Locked" : "Edit"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {/* Lock button */}
        <button
          onClick={() => onUpdateLock?.(cycleLock(lockLevel))}
          className="p-1 text-gray-400 hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
          title={`Lock: ${lockLevel}`}
        >
          {lockLevel === 'hard' ? (
            /* Closed padlock */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            /* Open padlock */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteDisabled}
          className={`p-1 rounded transition-colors ${
            deleteDisabled
              ? "text-gray-300 opacity-40 cursor-not-allowed"
              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}
          title={deleteDisabled ? "Locked" : "Delete"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
