"use client";

type FilterType =
  | "all"
  | "streak_milestone"
  | "goal_created"
  | "task_completed";

interface FeedFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FILTERS: { value: FilterType; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📰" },
  { value: "streak_milestone", label: "Streaks", icon: "🔥" },
  { value: "goal_created", label: "Goals", icon: "🎯" },
  { value: "task_completed", label: "Tasks", icon: "✅" },
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
                ? "bg-blue-600 text-white shadow-md scale-105"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:text-blue-600"
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
