"use client";

import { StreakData } from "@/types";
import { getToday } from "@/lib/storage";

interface StreakCounterProps {
  streak: StreakData;
  hasCompletedToday: boolean;
}

export function StreakCounter({ streak, hasCompletedToday }: StreakCounterProps) {
  const isActive = hasCompletedToday;
  const today = getToday();
  
  // Generate last 7 days for the mini calendar
  const getLast7Days = () => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      // Get the day name (S, M, T, W, T, F, S)
      const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
      const dayName = dayNames[date.getDay()];
      
      // Get the date number
      const dateNum = date.getDate();
      
      const hasActivity = streak.streakHistory.includes(dateStr);
      const isCurrentDay = dateStr === today;
      
      days.push({
        date: dateStr,
        dayName,
        dateNum,
        hasActivity,
        isCurrentDay,
      });
    }
    return days;
  };

  const days = getLast7Days();

  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-1.5 sm:p-4 border border-orange-100 shadow-sm">
      {/* Main Streak Display */}
      <div className="flex items-center justify-center gap-1 sm:gap-3 mb-1 sm:mb-4">
        {/* Fire Icon */}
        <div
          className={`relative flex-shrink-0 ${
            isActive ? "animate-bounce-subtle" : "opacity-50 grayscale"
          }`}
        >
          <div
            className={`text-lg sm:text-4xl ${
              isActive ? "animate-glow rounded-full" : ""
            }`}
          >
            {streak.currentStreak > 0 ? "🔥" : "💤"}
          </div>
          {isActive && streak.currentStreak >= 7 && (
            <div className="absolute -top-1 -right-1 text-[10px] sm:text-lg animate-bounce">
              ⭐
            </div>
          )}
        </div>

        {/* Streak Number */}
        <div className="text-center">
          <div
            className={`text-base sm:text-3xl font-black ${
              isActive
                ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                : "text-gray-400"
            }`}
          >
            {streak.currentStreak}
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Streak
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`text-center mb-1 sm:mb-3 py-0.5 px-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {isActive ? (
          <span className="flex items-center justify-center gap-0.5">
            <span>✓</span>
            <span className="hidden sm:inline">Task done today!</span>
            <span className="sm:hidden">Done!</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-0.5">
            <span>⚡</span>
            <span className="hidden sm:inline">Complete a task!</span>
            <span className="sm:hidden">Do task!</span>
          </span>
        )}
      </div>

      {/* 7-Day Calendar - Ultra Compact Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-2 sm:mb-4">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex flex-col items-center p-0.5 sm:p-2 rounded transition-all min-w-0 ${
              day.isCurrentDay
                ? "bg-orange-100 ring-1 ring-orange-400"
                : day.hasActivity
                ? "bg-green-100"
                : "bg-gray-100"
            }`}
          >
            {/* Day Letter */}
            <span className="text-[10px] sm:text-sm text-gray-500 font-medium leading-none">
              {day.dayName}
            </span>
            
            {/* Activity Indicator */}
            <div
              className={`w-4 h-4 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mt-0.5 sm:mt-1 ${
                day.hasActivity
                  ? "bg-gradient-to-br from-orange-400 to-yellow-400"
                  : "bg-gray-200"
              }`}
            >
              {day.hasActivity ? (
                <span className="text-[10px] sm:text-base">🔥</span>
              ) : (
                <span className={`text-[8px] sm:text-xs font-medium ${day.isCurrentDay ? "text-orange-600" : "text-gray-400"}`}>
                  {day.dateNum}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Longest Streak */}
      <div className="flex justify-between items-center text-xs border-t border-orange-100 pt-1.5 sm:pt-3">
        <span className="text-gray-600">Longest</span>
        <span className="font-bold text-orange-600 flex items-center gap-0.5">
          <span className="text-xs sm:text-sm">🏆</span>
          <span>{streak.longestStreak}d</span>
        </span>
      </div>

      {/* Motivational Message */}
      {streak.currentStreak > 0 && (
        <div className="mt-1.5 sm:mt-3 text-center text-xs text-gray-600 italic">
          {streak.currentStreak >= 30
            ? "🎉 Unstoppable!"
            : streak.currentStreak >= 14
            ? "🌟 Two weeks!"
            : streak.currentStreak >= 7
            ? "💪 One week!"
            : streak.currentStreak >= 3
            ? "🚀 Keep going!"
            : "🌱 Great start!"}
        </div>
      )}
    </div>
  );
}
