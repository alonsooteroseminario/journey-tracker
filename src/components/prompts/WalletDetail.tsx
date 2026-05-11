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
import { useCreateGroupMutation, useReorderGroupsMutation } from "@/store/slices/promptsSlice";
import { WalletHeader } from "./WalletHeader";
import { GroupCard } from "./GroupCard";
import type { PromptWallet } from "@/types";

interface WalletDetailProps {
  wallet: PromptWallet;
}

export function WalletDetail({ wallet }: WalletDetailProps) {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  const [createGroup] = useCreateGroupMutation();
  const [reorderGroups] = useReorderGroupsMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = wallet.groups.map((g) => g.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const newOrder = [...ids];
    const [moved] = newOrder.splice(oldIdx, 1);
    newOrder.splice(newIdx, 0, moved);
    reorderGroups({ walletId: wallet.id, orderedIds: newOrder });
  };

  const handleAddGroup = () => {
    if (!newGroupTitle.trim()) return;
    createGroup({ walletId: wallet.id, title: newGroupTitle.trim() });
    setNewGroupTitle("");
    setIsAddingGroup(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <WalletHeader wallet={wallet} />

      <div className="flex-1 p-4 space-y-3">
        {wallet.groups.length === 0 && !isAddingGroup && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            Create a group to start adding prompts.
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={wallet.groups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {wallet.groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Group form */}
        {isAddingGroup ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder="Group name…"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              autoFocus
              aria-label="New group name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddGroup();
                if (e.key === "Escape") { setIsAddingGroup(false); setNewGroupTitle(""); }
              }}
            />
            <button
              onClick={handleAddGroup}
              disabled={!newGroupTitle.trim()}
              className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setIsAddingGroup(false); setNewGroupTitle(""); }}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-secondary font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Group
          </button>
        )}
      </div>
    </div>
  );
}
