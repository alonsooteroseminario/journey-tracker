"use client";

import { useMemo } from "react";
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
} from "@dnd-kit/sortable";
import {
  selectComposeRefs,
  toggleChunk,
  removeChunk,
  clearCompose,
  reorderChunks as reorderComposeOrder,
} from "@/store/slices/composeSlice";
import { useListWalletsQuery } from "@/store/slices/promptsSlice";
import { mergeChunks } from "@/lib/prompts/mergeChunks";
import { ComposeChunkRow } from "./ComposeChunkRow";
import { MergedPreview } from "./MergedPreview";
import type { PromptChunk } from "@/types";

export function ComposeDrawer() {
  const dispatch = useDispatch();
  const refs = useSelector(selectComposeRefs);
  const { data: wallets = [] } = useListWalletsQuery();

  const chunkMap = useMemo(() => {
    const map = new Map<string, PromptChunk>();
    wallets.forEach((w) =>
      w.groups.forEach((g) => g.chunks.forEach((c) => map.set(c.id, c)))
    );
    return map;
  }, [wallets]);

  const includedChunks = useMemo(
    () =>
      refs
        .filter((r) => r.included)
        .map((r) => chunkMap.get(r.chunkId))
        .filter((c): c is PromptChunk => c !== undefined),
    [refs, chunkMap]
  );

  const mergedText = mergeChunks(includedChunks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = refs.map((r) => r.chunkId);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const newOrder = [...ids];
    const [moved] = newOrder.splice(oldIdx, 1);
    newOrder.splice(newIdx, 0, moved);
    dispatch(reorderComposeOrder(newOrder));
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Compose{refs.length > 0 ? ` (${refs.length})` : ""}
        </h3>
        {refs.length > 0 && (
          <button
            onClick={() => dispatch(clearCompose())}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Clear compose"
          >
            Clear
          </button>
        )}
      </div>

      {/* Compose chunk list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {refs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Add chunks here to build your final prompt.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={refs.map((r) => r.chunkId)} strategy={verticalListSortingStrategy}>
              {refs.map((ref) => {
                const chunk = chunkMap.get(ref.chunkId);
                if (!chunk) return null;
                return (
                  <ComposeChunkRow
                    key={ref.chunkId}
                    chunk={chunk}
                    included={ref.included}
                    onToggleInclude={() => dispatch(toggleChunk(ref.chunkId))}
                    onRemove={() => dispatch(removeChunk(ref.chunkId))}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Merged preview */}
      <div className="p-3 border-t border-gray-100">
        <MergedPreview text={mergedText} onCopy={() => {}} />
      </div>
    </div>
  );
}
