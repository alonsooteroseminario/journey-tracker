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
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 sm:p-6 border border-orange-100 shadow-lg">
      {/* Main Streak Display */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Fire Icon */}
        <div
          className={`relative flex-shrink-0 ${
            isActive ? "animate-bounce-subtle" : "opacity-50 grayscale"
          }`}
        >
          <div
            className={`text-4xl sm:text-5xl md:text-6xl ${
              isActive ? "animate-glow rounded-full" : ""
            }`}
          >
            {streak.currentStreak > 0 ? "🔥" : "💤"}
          </div>
          {isActive && streak.currentStreak >= 7 && (
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-lg sm:text-2xl animate-bounce">
              ⭐
            </div>
          )}
        </div>

        {/* Streak Number */}
        <div className="text-center">
          <div
            className={`text-3xl sm:text-4xl md:text-5xl font-black ${
              isActive
                ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                : "text-gray-400"
            }`}
          >
            {streak.currentStreak}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Day Streak
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`text-center mb-4 py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium ${
          isActive
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {isActive ? (
          <span className="flex items-center justify-center gap-1">
            <span>✓</span>
            <span className="hidden sm:inline">You&apos;ve completed a task today! Keep it up!</span>
            <span className="sm:hidden">Task completed today!</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1">
            <span>⚡</span>
            <span className="hidden sm:inline">Complete a task to {streak.currentStreak > 0 ? "keep your streak" : "start your streak"}!</span>
            <span className="sm:hidden">{streak.currentStreak > 0 ? "Keep your streak!" : "Start your streak!"}</span>
          </span>
        )}
      </div>

      {/* 7-Day Calendar - Fully Responsive Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition-all min-w-0 ${
              day.isCurrentDay
                ? "bg-orange-100 ring-2 ring-orange-400"
                : day.hasActivity
                ? "bg-green-100"
                : "bg-gray-100"
            }`}
          >
            {/* Day Letter */}
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-none">
              {day.dayName}
            </span>
            
            {/* Activity Indicator */}
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mt-1 text-xs sm:text-sm ${
                day.hasActivity
                  ? "bg-gradient-to-br from-orange-400 to-yellow-400"
                  : "bg-gray-200"
              }`}
            >
              {day.hasActivity ? (
                <span className="text-sm sm:text-base">🔥</span>
              ) : (
                <span className={`text-[10px] sm:text-xs font-medium ${day.isCurrentDay ? "text-orange-600" : "text-gray-400"}`}>
                  {day.dateNum}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Longest Streak */}
      <div className="flex justify-between items-center text-xs sm:text-sm border-t border-orange-100 pt-3 sm:pt-4">
        <span className="text-gray-600">Longest Streak</span>
        <span className="font-bold text-orange-600 flex items-center gap-1">
          <span>🏆</span>
          <span>{streak.longestStreak} days</span>
        </span>
      </div>

      {/* Motivational Message */}
      {streak.currentStreak > 0 && (
        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-600 italic">
          {streak.currentStreak >= 30
            ? "🎉 Incredible! You're unstoppable!"
            : streak.currentStreak >= 14
            ? "🌟 Two weeks strong! Amazing dedication!"
            : streak.currentStreak >= 7
            ? "💪 A whole week! You're building a habit!"
            : streak.currentStreak >= 3
            ? "🚀 3 days and counting! Keep the momentum!"
            : "🌱 Great start! Every journey begins with a single step."}
        </div>
      )}
    </div>
  );
}
