"use client";

interface KanbanFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: "all" | "overdue" | "today" | "week";
  onDateFilterChange: (value: "all" | "overdue" | "today" | "week") => void;
  priorityFilter: "all" | "low" | "medium" | "high" | "critical";
  onPriorityFilterChange: (value: "all" | "low" | "medium" | "high" | "critical") => void;
  showDateFilter: boolean;
  showPriorityFilter: boolean;
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
}: KanbanFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
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

        {/* Date Filter */}
        {showDateFilter && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Due:</label>
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
            <label className="text-sm font-medium text-gray-700">Priority:</label>
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
        {(searchTerm || dateFilter !== "all" || priorityFilter !== "all") && (
          <button
            onClick={() => {
              onSearchChange("");
              onDateFilterChange("all");
              onPriorityFilterChange("all");
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
