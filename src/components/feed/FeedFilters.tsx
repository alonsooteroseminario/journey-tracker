"use client";

type FilterType =
  | "all"
  | "goals"
  | "tasks"
  | "substeps"
  | "streaks"
  | "social"
  | "notes_costs";

interface FeedFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

// Map filter categories to activity types
export const FILTER_TYPE_MAP: Record<FilterType, string[]> = {
  all: [],
  goals: ["goal_created", "goal_updated", "goal_deleted", "goal_shared", "goal_published", "goal_forked"],
  tasks: ["task_created", "task_updated", "task_deleted", "task_completed", "task_status_changed"],
  substeps: ["substep_created", "substep_updated", "substep_deleted"],
  streaks: ["streak_milestone", "streak_at_risk"],
  social: ["friend_added", "friend_changed", "profile_updated"],
  notes_costs: ["note_added", "note_updated", "cost_added", "cost_updated"],
};

const FILTERS: { value: FilterType; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📰" },
  { value: "goals", label: "Goals", icon: "🎯" },
  { value: "tasks", label: "Tasks", icon: "✅" },
  { value: "substeps", label: "Substeps", icon: "🔹" },
  { value: "streaks", label: "Streaks", icon: "🔥" },
  { value: "social", label: "Social", icon: "👥" },
  { value: "notes_costs", label: "Notes & Costs", icon: "💰" },
];

export function FeedFilters({
  activeFilter,
  onFilterChange,
}: FeedFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
            whitespace-nowrap transition-all duration-200
            ${
              activeFilter === filter.value
                ? "bg-brand-primary text-white shadow-md scale-105"
                : "bg-surface text-text-secondary border border-border-strong hover:border-brand-primary hover:text-brand-primary"
            }
          `}
        >
          <span>{filter.icon}</span>
          <span className="hidden sm:inline">{filter.label}</span>
        </button>
      ))}
    </div>
  );
}
