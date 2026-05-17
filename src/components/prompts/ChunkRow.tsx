"use client";

import { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { canDelete, canEdit, getLockLevel, cycleLock, LockLevel } from "@/lib/locks/lockGuards";
import { useUndoToast } from "@/components/undo/UndoToastProvider";
import type { PromptChunk } from "@/types";

interface ChunkRowProps {
  chunk: PromptChunk;
  isInCompose: boolean;
  onUpdate: (patch: Partial<PromptChunk>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateLock: (lockLevel: LockLevel) => void;
  onRestore: () => void;
  onAddToCompose: () => void;
  onRemoveFromCompose: () => void;
}

export function ChunkRow({
  chunk,
  isInCompose,
  onUpdate,
  onDelete,
  onDuplicate,
  onUpdateLock,
  onRestore,
  onAddToCompose,
  onRemoveFromCompose,
}: ChunkRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chunk.title);
  const [editContent, setEditContent] = useState(chunk.content);
  const [copied, setCopied] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showUndoToast } = useUndoToast();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chunk.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lockLevel = getLockLevel(chunk);
  const editDisabled = !canEdit(chunk);
  const deleteDisabled = !canDelete(chunk);
  const reorderAllowed = lockLevel !== "hard";

  const handleBlur = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (editTitle.trim()) onUpdate({ title: editTitle.trim(), content: editContent });
    }, 600);
  };

  const handleSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (!editTitle.trim()) return;
    onUpdate({ title: editTitle.trim(), content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setEditTitle(chunk.title);
    setEditContent(chunk.content);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chunk.title);
    } catch {
      const el = document.createElement("textarea");
      el.value = chunk.title;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    if (!canDelete(chunk)) return;
    onDelete();
    showUndoToast({
      message: `Chunk "${chunk.title}" deleted`,
      onUndo: onRestore,
    });
  };

  if (isEditing) {
    return (
      <div className="bg-brand-light dark:bg-brand-dark/30 border border-brand-light dark:border-brand-dark/50 rounded-lg p-3 space-y-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-3 py-1.5 text-sm border border-border-strong rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          placeholder="Chunk title"
          autoFocus
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleBlur}
          rows={6}
          className="w-full px-3 py-1.5 text-sm font-mono border border-border-strong rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-y"
          placeholder="Prompt content…"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!editTitle.trim()}
            className="px-3 py-1 text-sm bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-text-secondary hover:bg-surface-hover rounded-md"
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
      className="group flex items-center gap-2 p-2 rounded-lg bg-surface-muted border border-border hover:bg-surface-hover transition-all"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...(reorderAllowed ? listeners : {})}
        className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {lockLevel === "soft" && (
            <svg className="w-3 h-3 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Soft locked">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
          {lockLevel === "hard" && (
            <svg className="w-3 h-3 text-brand-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Hard locked">
              <path d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V11a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm-3 5a3 3 0 116 0v3H9V6zm3 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
          )}
          <p className="text-sm text-text-secondary break-words">{chunk.title}</p>
        </div>
        {chunk.content && (
          <p className="text-xs text-text-muted mt-1 whitespace-pre-wrap break-words">{chunk.content}</p>
        )}
      </div>

      {/* Hover Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Copy title */}
        <button
          onClick={handleCopy}
          className={`p-1 rounded transition-colors ${copied ? "text-green-500 bg-green-50" : "text-text-muted hover:text-brand-primary hover:bg-brand-light"}`}
          title={copied ? "Copied!" : "Copy title"}
          aria-label={copied ? "Copied!" : "Copy title"}
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

        {/* Add to / Remove from Compose */}
        <button
          onClick={isInCompose ? onRemoveFromCompose : onAddToCompose}
          className={`p-1 rounded transition-colors ${isInCompose ? "text-brand-primary bg-brand-light" : "text-text-muted hover:text-brand-primary hover:bg-brand-light"}`}
          title={isInCompose ? "Remove from Compose" : "Add to Compose"}
          aria-label={isInCompose ? "Remove from Compose" : "Add to Compose"}
        >
          {isInCompose ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>

        {/* Edit */}
        <button
          onClick={() => { if (!editDisabled) setIsEditing(true); }}
          disabled={editDisabled}
          className={`p-1 rounded transition-colors ${editDisabled ? "text-text-muted opacity-40 cursor-not-allowed" : "text-text-muted hover:text-brand-primary hover:bg-brand-light"}`}
          title={editDisabled ? "Locked" : "Edit"}
          aria-label={editDisabled ? "Locked" : "Edit"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Lock cycle */}
        <button
          onClick={() => onUpdateLock(cycleLock(lockLevel))}
          className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
          title={`Lock: ${lockLevel}`}
          aria-label={`Lock: ${lockLevel}`}
        >
          {lockLevel === "hard" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
          title="Duplicate"
          aria-label="Duplicate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleteDisabled}
          className={`p-1 rounded transition-colors ${deleteDisabled ? "text-text-muted opacity-40 cursor-not-allowed" : "text-text-muted hover:text-red-500 hover:bg-red-50"}`}
          title={deleteDisabled ? "Locked" : "Delete"}
          aria-label={deleteDisabled ? "Locked" : "Delete"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
