"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useGoals } from "@/hooks/useGoals";
import { UserProfile } from "@/types";
import { Calendar } from "@/components/Calendar";
import { EmailPreferencesPanel } from "@/components/EmailPreferencesPanel";
import { FeedPreferencesPanel } from "@/components/FeedPreferencesPanel";
import { Header } from "@/components/Header";

export default function ProfilePage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { profile, streak, goals, isLoaded, updateProfile, activityLog } = useGoals();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  // Get actual user info from Clerk
  const displayName = clerkUser?.fullName || clerkUser?.firstName || profile.name;
  const displayEmail = clerkUser?.primaryEmailAddress?.emailAddress || profile.email;
  const displayImage = clerkUser?.imageUrl || profile.profileImage;

  // Sync editedProfile when profile loads from API
  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  if (!isLoaded || !clerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g =>
    g.tasks.every(t => t.status === "completed")
  ).length;

  // Calculate additional stats
  const totalTasks = goals.reduce((sum, g) => sum + g.tasks.length, 0);
  const completedTasks = goals.reduce(
    (sum, g) => sum + g.tasks.filter((t) => t.status === "completed").length,
    0
  );
  const totalSubsteps = goals.reduce(
    (sum, g) => sum + g.tasks.reduce((ts, t) => ts + (t.substeps?.length || 0), 0),
    0
  );
  const completedSubsteps = goals.reduce(
    (sum, g) => sum + g.tasks.reduce((ts, t) => ts + (t.substeps?.filter(s => s.status === "completed").length || 0), 0),
    0
  );
  const activeGoals = totalGoals - completedGoals;
  const activeDays = streak.streakHistory.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header
        totalProgress={undefined}
        currentStreak={streak.currentStreak}
        showNewGoalButton={false}
      />

      <main className="max-w-4xl mx-auto px-1.5 sm:px-4 py-2 sm:py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 sm:p-8 mb-3 sm:mb-6">
          <div className="flex flex-col md:flex-row items-start gap-2 sm:gap-6">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold overflow-hidden border-2 sm:border-4 border-white shadow-lg">
                {displayImage ? (
                  <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-2 sm:space-y-4">
                  {/* Account Info (Read-only, managed by Clerk) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="mb-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-sm sm:text-base text-gray-900">{displayName}</p>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-sm sm:text-base text-gray-900">{displayEmail}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Name and email are managed through your account settings.{" "}
                      <a
                        href={clerkUser?.organizationMemberships && clerkUser.organizationMemberships.length > 0 ? undefined : "/user"}
                        onClick={(e) => {
                          if (clerkUser) {
                            e.preventDefault();
                            // Open Clerk's user profile modal
                            window.open(`https://accounts.${window.location.hostname}/user`, '_blank');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Manage account
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editedProfile.bio || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editedProfile.location || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-base sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{displayName}</h1>
                  {displayEmail && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {displayEmail}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-gray-700 mb-4 italic">"{profile.bio}"</p>
                  )}
                  {profile.location && (
                    <p className="text-gray-600 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </p>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6 text-center">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">📅</div>
            <p className="text-gray-600 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Member Since</p>
            <p className="text-xs sm:text-lg font-bold text-gray-900">
              {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🔥</div>
            <p className="text-orange-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Current Streak</p>
            <p className="text-base sm:text-2xl font-bold">{streak.currentStreak}</p>
            <p className="text-[10px] sm:text-xs text-orange-100">days</p>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">⭐</div>
            <p className="text-purple-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Longest Streak</p>
            <p className="text-base sm:text-2xl font-bold">{streak.longestStreak}</p>
            <p className="text-[10px] sm:text-xs text-purple-100">days</p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🎯</div>
            <p className="text-blue-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Goals</p>
            <p className="text-base sm:text-2xl font-bold">{totalGoals}</p>
            <p className="text-[10px] sm:text-xs text-blue-100">{completedGoals} completed</p>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">✅</div>
            <p className="text-green-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Tasks</p>
            <p className="text-base sm:text-2xl font-bold">{completedTasks}</p>
            <p className="text-[10px] sm:text-xs text-green-100">of {totalTasks} total</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">📝</div>
            <p className="text-indigo-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Substeps</p>
            <p className="text-base sm:text-2xl font-bold">{completedSubsteps}</p>
            <p className="text-[10px] sm:text-xs text-indigo-100">of {totalSubsteps} total</p>
          </div>

          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🚀</div>
            <p className="text-pink-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Active Goals</p>
            <p className="text-base sm:text-2xl font-bold">{activeGoals}</p>
            <p className="text-[10px] sm:text-xs text-pink-100">in progress</p>
          </div>

          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-sm p-2 sm:p-6 text-center text-white">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">📆</div>
            <p className="text-amber-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Active Days</p>
            <p className="text-base sm:text-2xl font-bold">{activeDays}</p>
            <p className="text-[10px] sm:text-xs text-amber-100">total</p>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 sm:p-6 mb-3 sm:mb-6">
          <h2 className="text-xs sm:text-lg font-bold text-gray-800 mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
            <span className="text-base sm:text-xl">📅</span>
            Activity Calendar
          </h2>
          <Calendar
            streakHistory={streak.streakHistory}
            activityLog={activityLog}
          />
        </div>

        {/* Email Preferences */}
        <div className="mb-6">
          <EmailPreferencesPanel />
        </div>

        {/* Feed Visibility Preferences */}
        <div className="mb-6">
          <FeedPreferencesPanel />
        </div>

        {/* Share Section */}

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-3 sm:p-8 text-white">
          <div className="text-center mb-3 sm:mb-6">
            <h2 className="text-xs sm:text-xl font-bold mb-1 sm:mb-2">Share Your Progress 🚀</h2>
            <p className="text-blue-100">
              Show your friends your amazing {streak.currentStreak} day streak and motivate them!
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 ${streak.currentStreak} day streak on Journey Tracker! Join me in achieving your goals! 🎯`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition-all"
            >
              <div className="text-2xl mb-1">𝕏</div>
              <div className="text-sm font-medium">Twitter</div>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition-all"
            >
              <div className="text-2xl mb-1">📘</div>
              <div className="text-sm font-medium">Facebook</div>
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition-all"
            >
              <div className="text-2xl mb-1">💼</div>
              <div className="text-sm font-medium">LinkedIn</div>
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.origin : '');
                alert('Link copied to clipboard!');
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition-all"
            >
              <div className="text-2xl mb-1">🔗</div>
              <div className="text-sm font-medium">Copy Link</div>
            </button>
          </div>

          <p className="text-center text-sm text-blue-100">
            Sharing your progress helps you stay accountable and inspires others! 💪
          </p>
        </div>
      </main>
    </div>
  );
}
