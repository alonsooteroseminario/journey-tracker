"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  canDelete,
  canEdit,
  canAddChild,
  getLockLevel,
  cycleLock,
  LockLevel,
} from "@/lib/locks/lockGuards";
import { useUndoToast } from "@/components/undo/UndoToastProvider";
import { mergeChunks } from "@/lib/prompts/mergeChunks";
import {
  selectComposeRefs,
  replaceWithGroup,
  appendGroup,
} from "@/store/slices/composeSlice";
import {
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useDuplicateGroupMutation,
  useRestoreGroupMutation,
  useCreateChunkMutation,
  useUpdateChunkMutation,
  useDeleteChunkMutation,
  useDuplicateChunkMutation,
  useRestoreChunkMutation,
  useReorderChunksMutation,
} from "@/store/slices/promptsSlice";
import { ChunkRow } from "./ChunkRow";
import {
  addChunk as addChunkToCompose,
  removeChunk as removeChunkFromCompose,
} from "@/store/slices/composeSlice";
import type { PromptGroup, PromptChunk } from "@/types";

interface GroupCardProps {
  group: PromptGroup;
}

export function GroupCard({ group }: GroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [isAddingChunk, setIsAddingChunk] = useState(false);
  const [newChunkTitle, setNewChunkTitle] = useState("");
  const [copiedMerge, setCopiedMerge] = useState(false);

  const dispatch = useDispatch();
  const composeRefs = useSelector(selectComposeRefs);
  const { showUndoToast } = useUndoToast();

  const [updateGroup] = useUpdateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const [duplicateGroup] = useDuplicateGroupMutation();
  const [restoreGroup] = useRestoreGroupMutation();
  const [createChunk] = useCreateChunkMutation();
  const [updateChunk] = useUpdateChunkMutation();
  const [deleteChunk] = useDeleteChunkMutation();
  const [duplicateChunk] = useDuplicateChunkMutation();
  const [restoreChunk] = useRestoreChunkMutation();
  const [reorderChunksMutation] = useReorderChunksMutation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lockLevel = getLockLevel(group);
  const deleteDisabled = !canDelete(group);
  const editDisabled = !canEdit(group);
  const addChunkDisabled = !canAddChild(group);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleComposeClick = () => {
    const chunkIds = group.chunks.map((c) => c.id);
    if (composeRefs.length === 0) {
      dispatch(replaceWithGroup(chunkIds));
    } else {
      setShowComposeDialog(true);
    }
  };

  const handleCopyMerged = async () => {
    const text = mergeChunks(group.chunks);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedMerge(true);
    setTimeout(() => setCopiedMerge(false), 1500);
  };

  const handleDeleteGroup = () => {
    if (!canDelete(group)) return;
    deleteGroup(group.id);
    showUndoToast({
      message: `Group "${group.title}" deleted`,
      onUndo: () =>
        restoreGroup({
          walletId: group.walletId,
          title: group.title,
          description: group.description,
          lockLevel: group.lockLevel ?? null,
          chunks: group.chunks.map((c) => ({
            title: c.title,
            content: c.content,
            lockLevel: c.lockLevel ?? null,
          })),
        }),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = group.chunks.map((c) => c.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const newOrder = [...ids];
    const [moved] = newOrder.splice(oldIdx, 1);
    newOrder.splice(newIdx, 0, moved);
    reorderChunksMutation({ groupId: group.id, orderedIds: newOrder });
  };

  const handleAddChunk = () => {
    if (!newChunkTitle.trim()) return;
    createChunk({ groupId: group.id, title: newChunkTitle.trim(), content: "" });
    setNewChunkTitle("");
    setIsAddingChunk(false);
  };

  const makeChunkHandlers = (chunk: PromptChunk) => ({
    onUpdate: (patch: Partial<PromptChunk>) => updateChunk({ id: chunk.id, patch }),
    onDelete: () => deleteChunk(chunk.id),
    onDuplicate: () => duplicateChunk(chunk.id),
    onUpdateLock: (lvl: LockLevel) => updateChunk({ id: chunk.id, patch: { lockLevel: lvl } }),
    onRestore: () =>
      restoreChunk({
        groupId: group.id,
        title: chunk.title,
        content: chunk.content,
        lockLevel: chunk.lockLevel ?? null,
      }),
    onAddToCompose: () => dispatch(addChunkToCompose(chunk.id)),
    onRemoveFromCompose: () => dispatch(removeChunkFromCompose(chunk.id)),
  });

  return (
    <div ref={setNodeRef} style={style} className="bg-surface rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        {/* Group drag handle */}
        <button
          {...attributes}
          {...(lockLevel !== "hard" ? listeners : {})}
          className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-secondary"
          title="Drag to reorder group"
          aria-label="Drag to reorder group"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Expand / Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-text-muted hover:text-text-secondary transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Lock badge */}
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

        {/* Title */}
        <span className="flex-1 font-medium text-text-primary text-sm truncate">{group.title}</span>
        <span className="text-xs text-text-muted">{group.chunks.length} chunks</span>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Compose group */}
          <button
            onClick={handleComposeClick}
            className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
            title="Compose group"
            aria-label="Compose group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>

          {/* Copy merged */}
          <button
            onClick={handleCopyMerged}
            className={`p-1 rounded transition-colors ${copiedMerge ? "text-green-500 bg-green-50" : "text-text-muted hover:text-brand-primary hover:bg-brand-light"}`}
            title={copiedMerge ? "Copied!" : "Copy merged"}
            aria-label={copiedMerge ? "Copied!" : "Copy merged"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Lock cycle */}
          <button
            onClick={() => updateGroup({ id: group.id, patch: { lockLevel: cycleLock(lockLevel) } })}
            className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
            title={`Lock: ${lockLevel}`}
            aria-label={`Lock: ${lockLevel}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => duplicateGroup(group.id)}
            className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
            title="Duplicate group"
            aria-label="Duplicate group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={handleDeleteGroup}
            disabled={deleteDisabled}
            className={`p-1 rounded transition-colors ${deleteDisabled ? "text-text-muted opacity-40 cursor-not-allowed" : "text-text-muted hover:text-red-500 hover:bg-red-50"}`}
            title={deleteDisabled ? "Locked" : "Delete group"}
            aria-label={deleteDisabled ? "Locked" : "Delete group"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compose dialog */}
      {showComposeDialog && (
        <div className="mx-3 mb-3 p-3 bg-brand-light border border-brand-primary/20 rounded-lg text-sm">
          <p className="text-text-secondary mb-2">Compose already has items. What would you like to do?</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-brand-primary text-white rounded-md text-xs hover:bg-brand-secondary"
              onClick={() => { dispatch(replaceWithGroup(group.chunks.map((c) => c.id))); setShowComposeDialog(false); }}
            >
              Replace
            </button>
            <button
              className="px-3 py-1 border border-brand-primary text-brand-primary rounded-md text-xs hover:bg-brand-light"
              onClick={() => { dispatch(appendGroup(group.chunks.map((c) => c.id))); setShowComposeDialog(false); }}
            >
              Append
            </button>
            <button
              className="px-3 py-1 text-text-secondary hover:bg-surface-hover rounded-md text-xs"
              onClick={() => setShowComposeDialog(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expanded: chunk list + add form */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border pt-3 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={group.chunks.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {group.chunks.map((chunk) => {
                const composeIds = composeRefs.map((r) => r.chunkId);
                return (
                  <ChunkRow
                    key={chunk.id}
                    chunk={chunk}
                    isInCompose={composeIds.includes(chunk.id)}
                    {...makeChunkHandlers(chunk)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

          {group.chunks.length === 0 && !isAddingChunk && (
            <p className="text-xs text-text-muted text-center py-2">No chunks yet. Add one below.</p>
          )}

          {/* Add chunk form */}
          {isAddingChunk ? (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={newChunkTitle}
                onChange={(e) => setNewChunkTitle(e.target.value)}
                placeholder="Chunk title…"
                className="flex-1 px-3 py-1.5 text-sm border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddChunk();
                  if (e.key === "Escape") { setIsAddingChunk(false); setNewChunkTitle(""); }
                }}
              />
              <button
                onClick={handleAddChunk}
                disabled={!newChunkTitle.trim()}
                className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setIsAddingChunk(false); setNewChunkTitle(""); }}
                className="px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            !addChunkDisabled && (
              <button
                onClick={() => setIsAddingChunk(true)}
                className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-secondary font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Chunk
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
