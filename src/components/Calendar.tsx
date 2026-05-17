"use client";

import { useState, useMemo } from "react";
import { CalendarDay, ActivityLogEntry } from "@/types";
import { getToday } from "@/lib/storage";

/** Format a local Date as YYYY-MM-DD without UTC conversion. */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string as a local date (not UTC). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

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
      const dateStr = toLocalDateStr(date);
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
      const dateStr = toLocalDateStr(date);
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
      const dateStr = toLocalDateStr(date);
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
    <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1">
            <span className="text-xs sm:text-sm">📅</span> <span className="hidden sm:inline">Calendar</span><span className="sm:hidden">Cal</span>
          </h3>
          <button
            onClick={goToToday}
            className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-surface/20 text-white text-xs rounded hover:bg-surface/30 transition-colors"
          >
            Now
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-1.5 sm:mt-3">
          <button
            onClick={goToPrevMonth}
            className="p-1 text-white/80 hover:text-white hover:bg-surface/10 rounded transition-colors"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-sm sm:text-lg font-semibold text-white">{monthName}</h4>
          <button
            onClick={goToNextMonth}
            className="p-1 text-white/80 hover:text-white hover:bg-surface/10 rounded transition-colors"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Month Stats - Ultra Compact Grid */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-2 sm:mt-4">
          <div className="bg-surface/10 rounded p-1 sm:p-2 text-center">
            <div className="text-sm sm:text-lg font-bold text-white">{monthStats.totalActiveDays}</div>
            <div className="text-[10px] sm:text-xs text-white/70">Days</div>
          </div>
          <div className="bg-surface/10 rounded p-1 sm:p-2 text-center">
            <div className="text-sm sm:text-lg font-bold text-white">{monthStats.totalTasks}</div>
            <div className="text-[10px] sm:text-xs text-white/70">Tasks</div>
          </div>
          <div className="bg-surface/10 rounded p-1 sm:p-2 text-center">
            <div className="text-sm sm:text-lg font-bold text-white">{monthStats.totalSubsteps}</div>
            <div className="text-[10px] sm:text-xs text-white/70">Steps</div>
          </div>
          <div className="bg-surface/10 rounded p-1 sm:p-2 text-center">
            <div className="text-sm sm:text-lg font-bold text-white">${monthStats.totalCost}</div>
            <div className="text-[10px] sm:text-xs text-white/70">$</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 sm:p-3">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div key={`${day}-${idx}`} className="text-center text-[10px] sm:text-xs font-semibold text-text-muted py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {calendarDays.map((day, index) => {
            const localDate = parseLocalDate(day.date);
            return (
              <button
                key={`${day.date}-${index}`}
                onClick={() => {
                  setSelectedDate(day.date);
                  onDateClick?.(day.date);
                }}
                className={`
                  relative aspect-square p-0.5 sm:p-1 rounded transition-all text-xs sm:text-sm
                  ${day.isCurrentMonth ? "text-text-primary" : "text-text-muted"}
                  ${day.isToday ? "ring-1 ring-indigo-500 font-bold" : ""}
                  ${selectedDate === day.date ? "bg-brand-light" : "hover:bg-surface-hover"}
                  ${day.hasActivity && day.isCurrentMonth ? "bg-green-50" : ""}
                `}
              >
                <span className="block text-[10px] sm:text-sm">{localDate.getDate()}</span>
                {day.hasActivity && day.isCurrentMonth && (
                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></span>
                    {day.tasksCompleted > 0 && (
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-brand-primary rounded-full"></span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayData && (
        <div className="border-t border-border p-2 sm:p-4 bg-surface-muted">
          <h5 className="font-semibold text-xs sm:text-base text-text-primary mb-1.5 sm:mb-2">
            {parseLocalDate(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h5>

          {selectedDayData.hasActivity ? (
            <div className="space-y-2 sm:space-y-3">
              {/* Day Summary */}
              <div className="flex gap-1.5 sm:gap-3 text-[10px] sm:text-sm">
                {selectedDayData.tasksCompleted > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-brand-light text-brand-primary rounded-full">
                    {selectedDayData.tasksCompleted} tasks
                  </span>
                )}
                {selectedDayData.substepsCompleted > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-brand-light/40 text-brand-primary rounded-full">
                    {selectedDayData.substepsCompleted} substeps
                  </span>
                )}
                {selectedDayData.costSpent > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 text-emerald-700 rounded-full">
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
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary p-1.5 sm:p-2 bg-surface rounded-lg"
                    >
                      <span>
                        {activity.type === "task_completed" && "✅"}
                        {activity.type === "substep_completed" && "☑️"}
                        {activity.type === "cost_added" && "💰"}
                        {activity.type === "goal_created" && "🎯"}
                      </span>
                      <span className="truncate">{activity.description}</span>
                      <span className="text-[10px] sm:text-xs text-text-muted ml-auto">
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
            <p className="text-xs sm:text-sm text-text-muted">No activity on this day</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="px-2 sm:px-4 pb-2 sm:pb-4 flex items-center gap-2 sm:gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
          <span className="text-[10px] sm:text-xs">Active</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-primary rounded-full"></span>
          <span className="text-[10px] sm:text-xs">Tasks</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="w-3 h-3 sm:w-4 sm:h-4 ring-1 sm:ring-2 ring-brand-primary rounded"></div>
          <span className="text-[10px] sm:text-xs">Today</span>
        </div>
      </div>
    </div>
  );
}
