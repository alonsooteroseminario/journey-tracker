"use client";

type ViewLevel = "goals" | "tasks" | "substeps";

interface KanbanFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: "all" | "overdue" | "today" | "week";
  onDateFilterChange: (value: "all" | "overdue" | "today" | "week") => void;
  priorityFilter: "all" | "low" | "medium" | "high" | "critical";
  onPriorityFilterChange: (value: "all" | "low" | "medium" | "high" | "critical") => void;
  showDateFilter: boolean;
  showPriorityFilter: boolean;
  viewLevel: ViewLevel;
  onViewLevelChange: (level: ViewLevel) => void;
  doneToday: boolean;
  onDoneTodayChange: (val: boolean) => void;
  showArchived?: boolean;
  onShowArchivedChange?: (val: boolean) => void;
}

export function KanbanFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  showDateFilter,
  showPriorityFilter,
  viewLevel,
  onViewLevelChange,
  doneToday,
  onDoneTodayChange,
  showArchived,
  onShowArchivedChange,
}: KanbanFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* View Level Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {([
            { value: "goals" as ViewLevel, label: "Goals", icon: "🎯" },
            { value: "tasks" as ViewLevel, label: "Tasks", icon: "📋" },
            { value: "substeps" as ViewLevel, label: "Substeps", icon: "✓" },
          ]).map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onViewLevelChange(value)}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewLevel === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="sm:hidden">{icon}</span>
              <span className="hidden sm:inline">{icon} {label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-0 sm:min-w-[200px]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Done Today chip */}
        <button
          onClick={() => onDoneTodayChange(!doneToday)}
          className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            doneToday
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="sm:hidden">Today</span>
          <span className="hidden sm:inline">Done Today</span>
        </button>

        {/* Date Filter */}
        {showDateFilter && (
          <div className="flex items-center gap-2">
            <label className="hidden sm:inline text-sm font-medium text-gray-700">Due:</label>
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
            </select>
          </div>
        )}

        {/* Priority Filter */}
        {showPriorityFilter && (
          <div className="flex items-center gap-2">
            <label className="hidden sm:inline text-sm font-medium text-gray-700">Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {(searchTerm || dateFilter !== "all" || priorityFilter !== "all" || doneToday) && (
          <button
            onClick={() => {
              onSearchChange("");
              onDateFilterChange("all");
              onPriorityFilterChange("all");
              onDoneTodayChange(false);
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}

        {/* Show Archived toggle */}
        <button
          onClick={() => onShowArchivedChange?.(!showArchived)}
          className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            showArchived
              ? "bg-amber-100 text-amber-700 border-amber-300"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
          title={showArchived ? "Showing archived only" : "Show archived items"}
        >
          <span className="sm:hidden">{"\uD83D\uDCE6"}</span>
          <span className="hidden sm:inline">{"\uD83D\uDCE6"} {showArchived ? "Archived Only" : "Archived"}</span>
        </button>
      </div>
    </div>
  );
}
