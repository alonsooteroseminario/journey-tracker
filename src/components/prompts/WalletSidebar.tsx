"use client";

import { useState } from "react";
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
import { useCreateWalletMutation, useReorderWalletsMutation } from "@/store/slices/promptsSlice";
import { WalletRow } from "./WalletRow";
import type { PromptWallet } from "@/types";

interface WalletSidebarProps {
  wallets: PromptWallet[];
  selectedWalletId: string | null;
  onSelect: (id: string) => void;
}

export function WalletSidebar({ wallets, selectedWalletId, onSelect }: WalletSidebarProps) {
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [createWallet] = useCreateWalletMutation();
  const [reorderWallets] = useReorderWalletsMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = wallets.map((w) => w.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const newOrder = [...ids];
    const [moved] = newOrder.splice(oldIdx, 1);
    newOrder.splice(newIdx, 0, moved);
    reorderWallets(newOrder);
  };

  const handleAddWallet = async () => {
    if (!newTitle.trim()) return;
    const result = await createWallet({ title: newTitle.trim() });
    setNewTitle("");
    setIsAddingWallet(false);
    if ("data" in result && result.data) {
      onSelect(result.data.id);
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-surface-muted">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Wallets</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={wallets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            {wallets.map((wallet) => (
              <WalletRow
                key={wallet.id}
                wallet={wallet}
                isSelected={wallet.id === selectedWalletId}
                onSelect={() => onSelect(wallet.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {wallets.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">No wallets yet</p>
        )}
      </div>

      <div className="p-2 border-t border-border">
        {isAddingWallet ? (
          <div className="space-y-1.5">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Wallet name…"
              className="w-full px-2 py-1.5 text-sm border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              autoFocus
              aria-label="New wallet name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddWallet();
                if (e.key === "Escape") { setIsAddingWallet(false); setNewTitle(""); }
              }}
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleAddWallet}
                disabled={!newTitle.trim()}
                className="flex-1 px-2 py-1 text-xs bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setIsAddingWallet(false); setNewTitle(""); }}
                className="px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingWallet(true)}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm text-brand-primary hover:text-brand-secondary hover:bg-brand-light/50 rounded-lg transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Wallet
          </button>
        )}
      </div>
    </div>
  );
}
