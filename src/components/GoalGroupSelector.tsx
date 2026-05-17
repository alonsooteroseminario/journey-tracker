"use client";

import { useState, useRef, useEffect } from "react";
import { useGetGroupsQuery } from "@/store/slices/groupsSlice";

interface GoalGroupSelectorProps {
  goalId: string;
  currentGroupId?: string;
  onGroupChange: (goalId: string, groupId: string | null) => void;
}

export function GoalGroupSelector({
  goalId,
  currentGroupId,
  onGroupChange,
}: GoalGroupSelectorProps) {
  const { data: groups = [] } = useGetGroupsQuery();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (groups.length === 0) return null;

  const currentGroup = groups.find((g) => g.id === currentGroupId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors hover:bg-surface-hover border border-border"
        title="Assign to group"
      >
        {currentGroup ? (
          <>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentGroup.color }}
            />
            <span className="truncate max-w-[60px] sm:max-w-[80px]">{currentGroup.name}</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-text-muted">Group</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-surface rounded-lg shadow-lg border border-border z-20 min-w-[140px] py-1">
          {/* No group option */}
          <button
            onClick={() => {
              onGroupChange(goalId, null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-muted flex items-center gap-2 ${
              !currentGroupId ? "font-medium text-text-primary" : "text-text-secondary"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-border-strong" />
            None
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                onGroupChange(goalId, group.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-muted flex items-center gap-2 ${
                currentGroupId === group.id ? "font-medium text-text-primary" : "text-text-secondary"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
