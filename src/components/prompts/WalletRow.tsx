"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { canDelete, getLockLevel, cycleLock, LockLevel } from "@/lib/locks/lockGuards";
import { useUndoToast } from "@/components/undo/UndoToastProvider";
import {
  useUpdateWalletMutation,
  useDeleteWalletMutation,
  useDuplicateWalletMutation,
  useRestoreWalletMutation,
} from "@/store/slices/promptsSlice";
import type { PromptWallet } from "@/types";

interface WalletRowProps {
  wallet: PromptWallet;
  isSelected: boolean;
  onSelect: () => void;
}

export function WalletRow({ wallet, isSelected, onSelect }: WalletRowProps) {
  const { showUndoToast } = useUndoToast();
  const [updateWallet] = useUpdateWalletMutation();
  const [deleteWallet] = useDeleteWalletMutation();
  const [duplicateWallet] = useDuplicateWalletMutation();
  const [restoreWallet] = useRestoreWalletMutation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: wallet.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lockLevel = getLockLevel(wallet);
  const deleteDisabled = !canDelete(wallet);
  const totalChunks = wallet.groups.reduce((n, g) => n + g.chunks.length, 0);

  const handleDelete = () => {
    if (!canDelete(wallet)) return;
    deleteWallet(wallet.id);
    showUndoToast({
      message: `Wallet "${wallet.title}" deleted`,
      onUndo: () =>
        restoreWallet({
          title: wallet.title,
          icon: wallet.icon,
          description: wallet.description,
          lockLevel: wallet.lockLevel ?? null,
          groups: wallet.groups.map((g) => ({
            title: g.title,
            description: g.description,
            lockLevel: g.lockLevel ?? null,
            chunks: g.chunks.map((c) => ({
              title: c.title,
              content: c.content,
              lockLevel: c.lockLevel ?? null,
            })),
          })),
        }),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "bg-brand-light border border-brand-primary/30"
          : "hover:bg-surface-hover border border-transparent"
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...(lockLevel !== "hard" ? listeners : {})}
        className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Drag to reorder"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Icon */}
      <span className="text-lg flex-shrink-0">{wallet.icon ?? "💼"}</span>

      {/* Title + count */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? "text-brand-primary" : "text-text-secondary"}`}>
          {wallet.title}
        </p>
        {totalChunks > 0 && (
          <p className="text-xs text-text-muted">{totalChunks} chunks</p>
        )}
      </div>

      {/* Hover actions */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock */}
        <button
          onClick={() =>
            updateWallet({ id: wallet.id, patch: { lockLevel: cycleLock(lockLevel) as LockLevel } })
          }
          className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
          title={`Lock: ${lockLevel}`}
          aria-label={`Lock: ${lockLevel}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Duplicate */}
        <button
          onClick={() => duplicateWallet(wallet.id)}
          className="p-1 text-text-muted hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
          title="Duplicate wallet"
          aria-label="Duplicate wallet"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleteDisabled}
          className={`p-1 rounded transition-colors ${
            deleteDisabled
              ? "text-text-muted opacity-40 cursor-not-allowed"
              : "text-text-muted hover:text-red-500 hover:bg-red-50"
          }`}
          title={deleteDisabled ? "Locked" : "Delete wallet"}
          aria-label={deleteDisabled ? "Locked" : "Delete wallet"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
