"use client";

import { useState } from "react";
import { useGetGroupsQuery } from "@/store/slices/groupsSlice";
import { GoalGroupManager } from "./GoalGroupManager";

interface GoalGroupFilterProps {
  selectedGroupId: string | null;
  onGroupSelect: (id: string | null) => void;
}

export function GoalGroupFilter({ selectedGroupId, onGroupSelect }: GoalGroupFilterProps) {
  const { data: groups = [] } = useGetGroupsQuery();
  const [managerOpen, setManagerOpen] = useState(false);

  // Don't render if there are no groups and we're not managing
  if (groups.length === 0 && !managerOpen) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setManagerOpen(true)}
          className="text-xs sm:text-sm text-text-muted hover:text-text-secondary flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors"
          title="Create goal groups"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="hidden sm:inline">Add Groups</span>
        </button>
        <GoalGroupManager isOpen={managerOpen} onClose={() => setManagerOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {/* All chip */}
      <button
        onClick={() => onGroupSelect(null)}
        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
          selectedGroupId === null
            ? "bg-text-primary text-app"
            : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
        }`}
      >
        All
      </button>

      {/* Group chips */}
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
            selectedGroupId === group.id
              ? "text-white"
              : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
          }`}
          style={
            selectedGroupId === group.id
              ? { backgroundColor: group.color }
              : undefined
          }
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: group.color }}
          />
          {group.name}
        </button>
      ))}

      {/* Manage Groups button */}
      <button
        onClick={() => setManagerOpen(true)}
        className="p-1.5 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
        title="Manage groups"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <GoalGroupManager isOpen={managerOpen} onClose={() => setManagerOpen(false)} />
    </div>
  );
}
