"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGoals } from "@/hooks/useGoals";
import { ProgressBar } from "@/components/ProgressBar";
import { StreakData } from "@/types";
import { getToday } from "@/lib/storage";
import { useGetTemplatesQuery } from "@/store/slices/templatesSlice";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateDetailModal } from "@/components/templates/TemplateDetailModal";
import type { GoalTemplate } from "@/types";

export default function FriendProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { friends, profile, streak, goals, isLoaded } = useGoals();
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);

  // Fetch all templates (friend's templates will be filtered below)
  const { data: allTemplates } = useGetTemplatesQuery({ includeOwn: false, visibility: "all" });
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading friend profile...</p>
        </div>
      </div>
    );
  }

  const friend = friends.find(f => f.id === params.friendId);
  
  if (!friend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Friend Not Found</h2>
          <p className="text-gray-600 mb-6">This friend doesn't exist in your list.</p>
          <button
            onClick={() => router.push("/friends")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium"
          >
            Back to Friends
          </button>
        </div>
      </div>
    );
  }

  // My stats for comparison
  const myStats = {
    totalGoals: goals.length,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completedGoals: goals.filter(g => g.tasks.every(t => t.completed)).length,
  };

  // Get friend's actual goals from sharedData or create personalized mock data
  const getFriendGoals = () => {
    // Personalized goals based on friend ID with sample tasks
    const goalsByFriend: Record<string, any[]> = {
      "friend-001": [ // Alex Johnson - Marathon Runner
        {
          title: "Run a Marathon",
          progress: 68,
          totalTasks: 25,
          completedTasks: 17,
          category: "Fitness",
          description: "Training for Vancouver Marathon 2026",
          tasks: [
            { title: "Build base mileage (20km/week)", completed: true },
            { title: "Complete first 10km race", completed: true },
            { title: "Increase to 40km/week", completed: true },
            { title: "Complete half marathon", completed: true },
            { title: "Strength training routine", completed: true },
            { title: "Practice race-day nutrition", completed: false },
            { title: "Complete 30km long run", completed: false },
            { title: "Taper week before marathon", completed: false },
          ]
        }
      ],
      "friend-002": [ // Maria Garcia - Language Learner
        {
          title: "Learn Japanese",
          progress: 15,
          totalTasks: 40,
          completedTasks: 6,
          category: "Language",
          description: "N5 JLPT certification by end of year",
          tasks: [
            { title: "Master Hiragana alphabet", completed: true },
            { title: "Master Katakana alphabet", completed: true },
            { title: "Learn 100 basic kanji", completed: true },
            { title: "Complete N5 grammar course", completed: false },
            { title: "Practice with language partner", completed: true },
            { title: "Watch 10 anime episodes (Japanese subs)", completed: true },
            { title: "Learn 500 vocabulary words", completed: true },
            { title: "Take practice JLPT N5 test", completed: false },
          ]
        }
      ],
      "friend-003": [ // David Chen - Author
        {
          title: "Write a Novel",
          progress: 100,
          totalTasks: 30,
          completedTasks: 30,
          category: "Writing",
          description: "Completed 80,000 word sci-fi novel! 🎉",
          tasks: [
            { title: "Outline plot structure", completed: true },
            { title: "Develop main characters", completed: true },
            { title: "Write first draft (50,000 words)", completed: true },
            { title: "Expand to 80,000 words", completed: true },
            { title: "First round of edits", completed: true },
            { title: "Second round of edits", completed: true },
            { title: "Beta reader feedback", completed: true },
            { title: "Final polish", completed: true },
          ]
        }
      ],
      "friend-004": [ // Sarah Williams - Musician
        {
          title: "Master Guitar",
          progress: 45,
          totalTasks: 20,
          completedTasks: 9,
          category: "Music",
          description: "Learning fingerstyle and advanced chords",
          tasks: [
            { title: "Learn basic open chords", completed: true },
            { title: "Master barre chords", completed: true },
            { title: "Learn fingerpicking patterns", completed: true },
            { title: "Play 5 beginner songs", completed: true },
            { title: "Learn 'Blackbird' by The Beatles", completed: true },
            { title: "Master jazz chord voicings", completed: false },
            { title: "Learn blues scale improvisation", completed: false },
            { title: "Record first original song", completed: false },
          ]
        }
      ],
    };

    return goalsByFriend[friend.id] || [];
  };

  const getFriendActivity = () => {
    const activitiesByFriend: Record<string, any[]> = {
      "friend-001": [ // Alex - Marathon Runner
        { date: "3 hours ago", action: "Completed 10km morning run 🏃‍♂️" },
        { date: "Yesterday", action: "Finished strength training session" },
        { date: "2 days ago", action: "Hit personal best: 5km in 22 minutes!" },
        { date: "4 days ago", action: "Completed weekly goal: 50km total distance" },
        { date: "6 days ago", action: "Started new training phase: Speed work" },
      ],
      "friend-002": [ // Maria - Japanese Learner
        { date: "1 hour ago", action: "Completed 20 new kanji flashcards 📝" },
        { date: "5 hours ago", action: "Practiced conversation with language partner" },
        { date: "Yesterday", action: "Watched anime with Japanese subtitles" },
        { date: "2 days ago", action: "Finished Hiragana mastery quiz (95%!)" },
        { date: "3 days ago", action: "Achieved 3-day study streak! 🔥" },
      ],
      "friend-003": [ // David - Completed Novel
        { date: "8 days ago", action: "🎉 COMPLETED GOAL: Write a Novel!" },
        { date: "9 days ago", action: "Finished final chapter revisions" },
        { date: "12 days ago", action: "Sent manuscript to beta readers" },
        { date: "15 days ago", action: "Completed all 30 chapters!" },
        { date: "20 days ago", action: "Reached 80,000 words milestone" },
      ],
      "friend-004": [ // Sarah - Guitar
        { date: "2 hours ago", action: "Practiced fingerpicking for 45 minutes 🎸" },
        { date: "Yesterday", action: "Mastered 'Blackbird' by The Beatles!" },
        { date: "2 days ago", action: "Learned 3 new jazz chords" },
        { date: "3 days ago", action: "Recorded practice session for review" },
        { date: "5 days ago", action: "Achieved 21-day practice streak! 🔥" },
      ],
    };

    return activitiesByFriend[friend.id] || [];
  };

  const friendMockGoals = getFriendGoals();
  const friendMockActivity = getFriendActivity();

  // Create friend's streak data from their sharedData or fallback to their stats
  const getFriendStreakData = (): StreakData => {
    if (friend.sharedData?.streak) {
      return friend.sharedData.streak;
    }
    // Fallback: create basic streak data from friend's stats
    return {
      currentStreak: friend.currentStreak,
      longestStreak: friend.longestStreak,
      lastActivityDate: friend.currentStreak > 0 ? getToday() : null,
      streakHistory: [], // Empty if no shared data
    };
  };

  const friendStreak = getFriendStreakData();

  // Generate last 7 days for friend's streak calendar
  const getFriendLast7Days = () => {
    const days = [];
    const now = new Date();
    const today = getToday();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
      const dayName = dayNames[date.getDay()];
      const dateNum = date.getDate();
      
      const hasActivity = friendStreak.streakHistory.includes(dateStr);
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

  const friendLast7Days = getFriendLast7Days();
  const hasCompletedToday = friendStreak.streakHistory.includes(getToday());

  // Filter templates shared by this friend
  const friendTemplates = allTemplates?.filter(t => t.authorId === friend.id) || [];

  const sendEncouragement = () => {
    alert(`Encouragement sent to ${friend.name}! 💪\n\n"Keep up the great work! You're doing amazing!"`);
  };

  const challengeStreak = () => {
    alert(`Streak challenge sent to ${friend.name}! 🔥\n\n"I challenge you to maintain your streak for 7 more days!"`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/friends")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Friends"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{friend.name}'s Profile</h1>
              <p className="text-sm text-gray-500">View their progress and achievements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Friend Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-5xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {friend.profileImage ? (
                  <img src={friend.profileImage} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                  friend.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Friend Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{friend.name}</h2>
              <p className="text-gray-600 mb-4">
                Friends since {new Date(friend.addedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={sendEncouragement}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                >
                  <span>💬</span>
                  Send Encouragement
                </button>
                <button
                  onClick={challengeStreak}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
                >
                  <span>🔥</span>
                  Challenge Streak
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Stats Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Current Streak */}
            <div className={`text-center p-4 rounded-xl ${friend.currentStreak > myStats.currentStreak ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-600 mb-2">Current Streak</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className={`text-2xl font-bold ${friend.currentStreak > myStats.currentStreak ? 'text-orange-600' : 'text-gray-700'}`}>
                  {friend.currentStreak}
                </p>
                <span className="text-gray-400 text-sm">vs</span>
                <p className={`text-2xl font-bold ${friend.currentStreak <= myStats.currentStreak ? 'text-blue-600' : 'text-gray-500'}`}>
                  {myStats.currentStreak}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {friend.currentStreak > myStats.currentStreak ? `${friend.name} is ahead! 🏃` : 
                 friend.currentStreak < myStats.currentStreak ? "You're ahead! 🎉" : "Tied! 🤝"}
              </p>
            </div>

            {/* Total Goals */}
            <div className={`text-center p-4 rounded-xl ${friend.totalGoals > myStats.totalGoals ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-600 mb-2">Total Goals</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className={`text-2xl font-bold ${friend.totalGoals > myStats.totalGoals ? 'text-orange-600' : 'text-gray-700'}`}>
                  {friend.totalGoals}
                </p>
                <span className="text-gray-400 text-sm">vs</span>
                <p className={`text-2xl font-bold ${friend.totalGoals <= myStats.totalGoals ? 'text-blue-600' : 'text-gray-500'}`}>
                  {myStats.totalGoals}
                </p>
              </div>
            </div>

            {/* Completed Goals */}
            <div className={`text-center p-4 rounded-xl ${friend.completedGoals > myStats.completedGoals ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-600 mb-2">Completed</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className={`text-2xl font-bold ${friend.completedGoals > myStats.completedGoals ? 'text-orange-600' : 'text-gray-700'}`}>
                  {friend.completedGoals}
                </p>
                <span className="text-gray-400 text-sm">vs</span>
                <p className={`text-2xl font-bold ${friend.completedGoals <= myStats.completedGoals ? 'text-blue-600' : 'text-gray-500'}`}>
                  {myStats.completedGoals}
                </p>
              </div>
            </div>

            {/* Longest Streak */}
            <div className={`text-center p-4 rounded-xl ${friend.longestStreak > myStats.longestStreak ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-600 mb-2">Longest Streak</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className={`text-2xl font-bold ${friend.longestStreak > myStats.longestStreak ? 'text-orange-600' : 'text-gray-700'}`}>
                  {friend.longestStreak}
                </p>
                <span className="text-gray-400 text-sm">vs</span>
                <p className={`text-2xl font-bold ${friend.longestStreak <= myStats.longestStreak ? 'text-blue-600' : 'text-gray-500'}`}>
                  {myStats.longestStreak}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Friend's Streak Calendar */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100 shadow-lg mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔥</span>
            {friend.name}'s Streak
          </h3>

          {/* Main Streak Display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div
              className={`relative flex-shrink-0 ${
                hasCompletedToday ? "animate-bounce-subtle" : friendStreak.currentStreak > 0 ? "" : "opacity-50 grayscale"
              }`}
            >
              <div className="text-5xl md:text-6xl">
                {friendStreak.currentStreak > 0 ? "🔥" : "💤"}
              </div>
              {friendStreak.currentStreak >= 7 && (
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                  ⭐
                </div>
              )}
            </div>

            <div className="text-center">
              <div
                className={`text-4xl md:text-5xl font-black ${
                  friendStreak.currentStreak > 0
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                    : "text-gray-400"
                }`}
              >
                {friendStreak.currentStreak}
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Day Streak
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div
            className={`text-center mb-4 py-2 px-4 rounded-full text-sm font-medium ${
              hasCompletedToday
                ? "bg-green-100 text-green-700"
                : friendStreak.currentStreak > 0
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {hasCompletedToday ? (
              <span className="flex items-center justify-center gap-1">
                <span>✓</span>
                <span>{friend.name} completed a task today!</span>
              </span>
            ) : friendStreak.currentStreak > 0 ? (
              <span className="flex items-center justify-center gap-1">
                <span>⏳</span>
                <span>{friend.name} hasn't completed a task today yet</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <span>💤</span>
                <span>{friend.name}'s streak ended - send them encouragement!</span>
              </span>
            )}
          </div>

          {/* 7-Day Calendar */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {friendLast7Days.map((day) => (
              <div
                key={day.date}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  day.isCurrentDay
                    ? "bg-orange-100 ring-2 ring-orange-400"
                    : day.hasActivity
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <span className="text-xs text-gray-500 font-medium">
                  {day.dayName}
                </span>
                
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                    day.hasActivity
                      ? "bg-gradient-to-br from-orange-400 to-yellow-400"
                      : "bg-gray-200"
                  }`}
                >
                  {day.hasActivity ? (
                    <span className="text-base">🔥</span>
                  ) : (
                    <span className={`text-xs font-medium ${day.isCurrentDay ? "text-orange-600" : "text-gray-400"}`}>
                      {day.dateNum}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Longest Streak */}
          <div className="flex justify-between items-center text-sm border-t border-orange-100 pt-4">
            <span className="text-gray-600">Longest Streak</span>
            <span className="font-bold text-orange-600 flex items-center gap-1">
              <span>🏆</span>
              <span>{friendStreak.longestStreak} days</span>
            </span>
          </div>

          {/* Motivational Message */}
          {friendStreak.currentStreak > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600 italic">
              {friendStreak.currentStreak >= 30
                ? `${friend.name} is unstoppable! 🎉`
                : friendStreak.currentStreak >= 14
                ? `Two weeks strong! Amazing! 🌟`
                : friendStreak.currentStreak >= 7
                ? `A whole week streak! 💪`
                : friendStreak.currentStreak >= 3
                ? `Building momentum! 🚀`
                : `Great start! 🌱`}
            </div>
          )}
        </div>

        {/* Their Goals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span>
            {friend.name}'s Goals
          </h3>
          <div className="space-y-4">
            {friendMockGoals.map((goal, index) => {
              const isExpanded = expandedGoals.has(index);
              const toggleExpand = () => {
                const newExpanded = new Set(expandedGoals);
                if (isExpanded) {
                  newExpanded.delete(index);
                } else {
                  newExpanded.add(index);
                }
                setExpandedGoals(newExpanded);
              };

              return (
                <div key={index} className="border border-gray-200 rounded-lg hover:border-purple-300 transition-colors overflow-hidden">
                  {/* Goal Header - Clickable */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={toggleExpand}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                        <button
                          className="text-gray-400 hover:text-gray-600 transition-transform"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        goal.progress === 100 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {goal.progress}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{goal.category}</p>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{goal.completedTasks}/{goal.totalTasks} tasks completed</span>
                        <span className="text-purple-600 font-medium">
                          {isExpanded ? 'Click to collapse' : 'Click to view tasks'}
                        </span>
                      </div>
                      <ProgressBar progress={goal.progress} size="sm" />
                    </div>
                  </div>

                  {/* Expandable Task List */}
                  {isExpanded && goal.tasks && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Tasks:</h5>
                      <div className="space-y-2">
                        {goal.tasks.map((task: any, taskIndex: number) => (
                          <div 
                            key={taskIndex}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${
                              task.completed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              task.completed 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {task.completed ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-xs">{taskIndex + 1}</span>
                              )}
                            </div>
                            <span className={`flex-1 text-sm ${
                              task.completed 
                                ? 'text-gray-600 line-through' 
                                : 'text-gray-800'
                            }`}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared Templates */}
        {friendTemplates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span>📋</span>
              {friend.name}'s Shared Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {friendTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => setSelectedTemplate(template)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚡</span>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {friendMockActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-2">Great progress, {friend.name}! 🌟</h3>
          <p className="text-purple-100">
            Keep pushing forward! Your consistency is inspiring!
          </p>
        </div>
      </main>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
