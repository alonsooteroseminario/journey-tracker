"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoals } from "@/hooks/useGoals";
import { UserProfile } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, streak, goals, isLoaded, updateProfile } = useGoals();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [imagePreview, setImagePreview] = useState(profile.profileImage || "");

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setEditedProfile({ ...editedProfile, profileImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setImagePreview(profile.profileImage || "");
    setIsEditing(false);
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => 
    g.tasks.every(t => t.completed)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header with Back Button */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
              <p className="text-sm text-gray-500">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              {isEditing ? (
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors overflow-hidden border-4 border-gray-300 group-hover:border-blue-400">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl mb-1 block">📸</span>
                        <span className="text-xs text-gray-600">Upload</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 shadow-lg group-hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </label>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold overflow-hidden border-4 border-white shadow-lg">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editedProfile.email || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  {profile.email && (
                    <p className="text-gray-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {profile.email}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-gray-600 text-sm mb-1">Member Since</p>
            <p className="text-xl font-bold text-gray-900">
              {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-sm p-6 text-center text-white">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-orange-100 text-sm mb-1">Current Streak</p>
            <p className="text-3xl font-bold">{streak.currentStreak}</p>
            <p className="text-xs text-orange-100">days</p>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-sm p-6 text-center text-white">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-purple-100 text-sm mb-1">Longest Streak</p>
            <p className="text-3xl font-bold">{streak.longestStreak}</p>
            <p className="text-xs text-purple-100">days</p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl shadow-sm p-6 text-center text-white">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-blue-100 text-sm mb-1">Goals</p>
            <p className="text-3xl font-bold">{totalGoals}</p>
            <p className="text-xs text-blue-100">{completedGoals} completed</p>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Share Your Progress 🚀</h2>
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
