"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PromptChunk } from "@/types";

interface ComposeChunkRowProps {
  chunk: PromptChunk;
  onRemove: () => void;
}

export function ComposeChunkRow({ chunk, onRemove }: ComposeChunkRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chunk.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white transition-all"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Title */}
      <span className="flex-1 text-sm text-gray-700 truncate">{chunk.title}</span>

      {/* Remove from Compose */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
        title="Remove from Compose"
        aria-label="Remove from Compose"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
