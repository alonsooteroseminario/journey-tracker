"use client";

import { useState, useMemo } from "react";
import { CalendarDay, ActivityLogEntry } from "@/types";
import { getToday, isToday } from "@/lib/storage";

interface CalendarProps {
  streakHistory: string[];
  activityLog: ActivityLogEntry[];
  onDateClick?: (date: string) => void;
}

export function Calendar({ streakHistory, activityLog, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = getToday();

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayActivities = activityLog.filter((a) => a.date.split("T")[0] === dateStr);
      
      days.push({
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        hasActivity: streakHistory.includes(dateStr),
        tasksCompleted: dayActivities.filter((a) => a.type === "task_completed").length,
        substepsCompleted: dayActivities.filter((a) => a.type === "substep_completed").length,
        costSpent: dayActivities
          .filter((a) => a.type === "cost_added")
          .reduce((sum, a) => sum + ((a.metadata?.cost as number) || 0), 0),
        events: [],
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayActivities = activityLog.filter((a) => a.date.split("T")[0] === dateStr);
      
      days.push({
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        hasActivity: streakHistory.includes(dateStr),
        tasksCompleted: dayActivities.filter((a) => a.type === "task_completed").length,
        substepsCompleted: dayActivities.filter((a) => a.type === "substep_completed").length,
        costSpent: dayActivities
          .filter((a) => a.type === "cost_added")
          .reduce((sum, a) => sum + ((a.metadata?.cost as number) || 0), 0),
        events: [],
      });
    }

    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateStr = date.toISOString().split("T")[0];
      const dayActivities = activityLog.filter((a) => a.date.split("T")[0] === dateStr);
      
      days.push({
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        hasActivity: streakHistory.includes(dateStr),
        tasksCompleted: dayActivities.filter((a) => a.type === "task_completed").length,
        substepsCompleted: dayActivities.filter((a) => a.type === "substep_completed").length,
        costSpent: dayActivities
          .filter((a) => a.type === "cost_added")
          .reduce((sum, a) => sum + ((a.metadata?.cost as number) || 0), 0),
        events: [],
      });
    }

    return days;
  }, [currentDate, streakHistory, activityLog, today]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return calendarDays.find((d) => d.date === selectedDate);
  }, [selectedDate, calendarDays]);

  const selectedDayActivities = useMemo(() => {
    if (!selectedDate) return [];
    return activityLog.filter((a) => a.date.split("T")[0] === selectedDate);
  }, [selectedDate, activityLog]);

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(today);
  };

  // Calculate month stats
  const monthStats = useMemo(() => {
    const monthDays = calendarDays.filter((d) => d.isCurrentMonth);
    return {
      totalActiveDays: monthDays.filter((d) => d.hasActivity).length,
      totalTasks: monthDays.reduce((sum, d) => sum + d.tasksCompleted, 0),
      totalSubsteps: monthDays.reduce((sum, d) => sum + d.substepsCompleted, 0),
      totalCost: monthDays.reduce((sum, d) => sum + d.costSpent, 0),
    };
  }, [calendarDays]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📅</span> Activity Calendar
          </h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-xl font-semibold text-white">{monthName}</h4>
          <button
            onClick={goToNextMonth}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{monthStats.totalActiveDays}</div>
            <div className="text-xs text-white/70">Active Days</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{monthStats.totalTasks}</div>
            <div className="text-xs text-white/70">Tasks</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{monthStats.totalSubsteps}</div>
            <div className="text-xs text-white/70">Substeps</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">${monthStats.totalCost}</div>
            <div className="text-xs text-white/70">Spent</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={`${day.date}-${index}`}
              onClick={() => {
                setSelectedDate(day.date);
                onDateClick?.(day.date);
              }}
              className={`
                relative aspect-square p-1 rounded-lg transition-all text-sm
                ${day.isCurrentMonth ? "text-gray-800" : "text-gray-400"}
                ${day.isToday ? "ring-2 ring-indigo-500 font-bold" : ""}
                ${selectedDate === day.date ? "bg-indigo-100" : "hover:bg-gray-100"}
                ${day.hasActivity && day.isCurrentMonth ? "bg-green-50" : ""}
              `}
            >
              <span className="block">{new Date(day.date).getDate()}</span>
              {day.hasActivity && day.isCurrentMonth && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {day.tasksCompleted > 0 && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayData && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h5 className="font-semibold text-gray-800 mb-2">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h5>

          {selectedDayData.hasActivity ? (
            <div className="space-y-3">
              {/* Day Summary */}
              <div className="flex gap-3 text-sm">
                {selectedDayData.tasksCompleted > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {selectedDayData.tasksCompleted} tasks
                  </span>
                )}
                {selectedDayData.substepsCompleted > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {selectedDayData.substepsCompleted} substeps
                  </span>
                )}
                {selectedDayData.costSpent > 0 && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    ${selectedDayData.costSpent} spent
                  </span>
                )}
              </div>

              {/* Activity List */}
              {selectedDayActivities.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedDayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-white rounded-lg"
                    >
                      <span>
                        {activity.type === "task_completed" && "✅"}
                        {activity.type === "substep_completed" && "☑️"}
                        {activity.type === "cost_added" && "💰"}
                        {activity.type === "goal_created" && "🎯"}
                      </span>
                      <span className="truncate">{activity.description}</span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(activity.date).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No activity on this day</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Active Day</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Tasks Done</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 ring-2 ring-indigo-500 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
