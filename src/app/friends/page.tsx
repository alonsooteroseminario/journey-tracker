"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoals } from "@/hooks/useGoals";
import { Friend } from "@/types";
import { generateId, getToday } from "@/lib/storage";

export default function FriendsPage() {
  const router = useRouter();
  const {
    profile,
    streak,
    friends,
    goals,
    invitations,
    isLoaded,
    addFriend,
    removeFriend,
    createInvitation,
    addSocialShare,
  } = useGoals();

  const [inviteCode, setInviteCode] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading friends...</p>
        </div>
      </div>
    );
  }

  const completedGoals = goals.filter(g => g.tasks.every(t => t.completed)).length;
  const totalGoals = goals.length;

  const myStats = {
    totalGoals: totalGoals,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completedGoals: completedGoals,
    completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
  };

  const handleAddFriend = () => {
    if (!inviteCode.trim()) return;

    // In a real app, this would verify the code with a backend
    // For now, we'll create a demo friend
    const newFriend: Friend = {
      id: generateId(),
      profileId: inviteCode,
      name: `Friend (${inviteCode.substring(0, 4)})`,
      currentStreak: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(Math.random() * 50) + 10,
      totalGoals: Math.floor(Math.random() * 10) + 1,
      completedGoals: Math.floor(Math.random() * 5),
      addedDate: getToday(),
    };

    addFriend(newFriend);
    setInviteCode("");
  };

  const handleGenerateInvite = async () => {
    const invitation = await createInvitation();
    setGeneratedInvite(invitation.code);
    setShowInviteModal(true);
  };

  const handleShareInvite = (platform: string) => {
    if (!generatedInvite) return;
    
    const message = `Join me on Journey Tracker! Use code: ${generatedInvite}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';

    addSocialShare(platform as any, message);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const copyInviteCode = () => {
    if (generatedInvite) {
      navigator.clipboard.writeText(generatedInvite);
      alert('Invite code copied to clipboard!');
    }
  };

  const sendEncouragement = (friendName: string) => {
    alert(`Encouragement sent to ${friendName}! 💪 Keep going!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-1.5 sm:px-4 py-1 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-1 sm:gap-3">
                <span className="text-lg sm:text-2xl md:text-3xl">👥</span>
                <div>
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-800">Friends Comparison</h1>
                  <p className="text-[10px] sm:text-sm text-gray-500">Motivate each other to succeed</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateInvite}
              className="px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25 flex items-center gap-1 sm:gap-2"
            >
              <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline text-xs sm:text-base">Invite Friend</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-1.5 sm:px-4 py-2 sm:py-8">
        {/* Add Friend Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 sm:p-6 mb-3 sm:mb-6">
          <h2 className="text-sm sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
            <span>➕</span>
            Add a Friend
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter friend's invite code"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            />
            <button
              onClick={handleAddFriend}
              disabled={!inviteCode.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add Friend
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💡 Ask your friend for their invite code, or generate one to share with them!
          </p>
        </div>

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6 md:p-12 text-center">
            <div className="text-4xl sm:text-6xl md:text-8xl mb-3 sm:mb-6">👥</div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">
              No friends added yet
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-8 text-xs sm:text-base md:text-lg">
              Add friends to compare your progress and motivate each other!
            </p>
            <button
              onClick={handleGenerateInvite}
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25 text-xs sm:text-base md:text-lg"
            >
              Generate Invite Code
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-6">
            {friends.map((friend) => {
              const friendCompletionRate = friend.totalGoals > 0
                ? Math.round((friend.completedGoals / friend.totalGoals) * 100)
                : 0;

              const isAhead = {
                streak: friend.currentStreak > myStats.currentStreak,
                goals: friend.totalGoals > myStats.totalGoals,
                completed: friend.completedGoals > myStats.completedGoals,
                longest: friend.longestStreak > myStats.longestStreak,
                completionRate: friendCompletionRate > myStats.completionRate,
              };

              return (
                <div key={friend.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all group">
                  {/* Clickable Header Section */}
                  <Link href={`/friends/${friend.id}`} className="block p-2 sm:p-6 pb-2 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                      {/* Friend Avatar */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-lg sm:text-2xl font-bold overflow-hidden group-hover:scale-105 transition-transform">
                        {friend.profileImage ? (
                          <img src={friend.profileImage} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          friend.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-sm sm:text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                          {friend.name}
                        </h3>
                        <p className="text-gray-600 text-[10px] sm:text-sm">
                          Friends since {new Date(friend.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {/* View Profile Indicator */}
                      <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* Non-clickable comparison section */}
                  <div className="px-2 sm:px-6 pb-1 sm:pb-2">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Click to view full profile</p>
                  </div>

                  {/* Comparison Grid */}
                  <div className="px-2 sm:px-6 pb-2 sm:pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-2 sm:mb-4">
                    {/* Current Streak */}
                    <div className={`text-center p-2 sm:p-4 rounded-xl ${isAhead.streak ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50'}`}>
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">Current Streak</p>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <p className={`text-lg sm:text-2xl font-bold ${isAhead.streak ? 'text-orange-600' : 'text-gray-700'}`}>
                          {friend.currentStreak}
                        </p>
                        <span className="text-gray-400 text-[10px] sm:text-sm">vs</span>
                        <p className={`text-lg sm:text-2xl font-bold ${!isAhead.streak ? 'text-blue-600' : 'text-gray-500'}`}>
                          {myStats.currentStreak}
                        </p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {isAhead.streak ? "They're ahead! 🏃" : 
                         friend.currentStreak < myStats.currentStreak ? "You're ahead! 🎉" : "Tied! 🤝"}
                      </p>
                    </div>

                    {/* Total Goals */}
                    <div className={`text-center p-2 sm:p-4 rounded-xl ${isAhead.goals ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}`}>
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">Total Goals</p>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <p className={`text-lg sm:text-2xl font-bold ${isAhead.goals ? 'text-orange-600' : 'text-gray-700'}`}>
                          {friend.totalGoals}
                        </p>
                        <span className="text-gray-400 text-[10px] sm:text-sm">vs</span>
                        <p className={`text-lg sm:text-2xl font-bold ${!isAhead.goals ? 'text-blue-600' : 'text-gray-500'}`}>
                          {myStats.totalGoals}
                        </p>
                      </div>
                    </div>

                    {/* Completed Goals */}
                    <div className={`text-center p-2 sm:p-4 rounded-xl ${isAhead.completed ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">Completed</p>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <p className={`text-lg sm:text-2xl font-bold ${isAhead.completed ? 'text-orange-600' : 'text-gray-700'}`}>
                          {friend.completedGoals}
                        </p>
                        <span className="text-gray-400 text-[10px] sm:text-sm">vs</span>
                        <p className={`text-lg sm:text-2xl font-bold ${!isAhead.completed ? 'text-blue-600' : 'text-gray-500'}`}>
                          {myStats.completedGoals}
                        </p>
                      </div>
                    </div>

                    {/* Longest Streak */}
                    <div className={`text-center p-2 sm:p-4 rounded-xl ${isAhead.longest ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50'}`}>
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">Longest Streak</p>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <p className={`text-lg sm:text-2xl font-bold ${isAhead.longest ? 'text-orange-600' : 'text-gray-700'}`}>
                          {friend.longestStreak}
                        </p>
                        <span className="text-gray-400 text-[10px] sm:text-sm">vs</span>
                        <p className={`text-lg sm:text-2xl font-bold ${!isAhead.longest ? 'text-blue-600' : 'text-gray-500'}`}>
                          {myStats.longestStreak}
                        </p>
                      </div>
                    </div>

                    {/* Completion Rate */}
                    <div className={`text-center p-2 sm:p-4 rounded-xl ${isAhead.completionRate ? 'bg-cyan-50 border-2 border-cyan-300' : 'bg-gray-50'}`}>
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">Completion Rate</p>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <p className={`text-lg sm:text-2xl font-bold ${isAhead.completionRate ? 'text-orange-600' : 'text-gray-700'}`}>
                          {friendCompletionRate}%
                        </p>
                        <span className="text-gray-400 text-[10px] sm:text-sm">vs</span>
                        <p className={`text-lg sm:text-2xl font-bold ${!isAhead.completionRate ? 'text-blue-600' : 'text-gray-500'}`}>
                          {myStats.completionRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <button
                      onClick={() => sendEncouragement(friend.name)}
                      className="px-2 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-1 sm:gap-2 text-[10px] sm:text-base"
                    >
                      <span>💬</span>
                      <span className="hidden sm:inline">Send Encouragement</span>
                      <span className="sm:hidden">Encourage</span>
                    </button>
                    <button
                      onClick={() => alert(`Challenge sent to ${friend.name}! 🔥`)}
                      className="px-2 sm:px-4 py-1 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-1 sm:gap-2 text-[10px] sm:text-base"
                    >
                      <span>🔥</span>
                      <span className="hidden sm:inline">Challenge Streak</span>
                      <span className="sm:hidden">Challenge</span>
                    </button>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Motivational Banner */}
        <div className="mt-4 sm:mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-3 sm:p-8 text-center shadow-lg">
          <h3 className="text-sm sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Keep Each Other Motivated! 💪</h3>
          <p className="text-purple-100 text-xs sm:text-base md:text-lg mb-2 sm:mb-4">
            Friends who track together, achieve together.
          </p>
          <p className="text-purple-100">
            Share your progress, celebrate wins, and support each other on the journey to success!
          </p>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && generatedInvite && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Invite Code</h2>
            
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-center">
              <p className="text-white text-sm mb-2">Share this code with your friend:</p>
              <p className="text-4xl font-bold text-white tracking-wider">{generatedInvite}</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={copyInviteCode}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>📋</span>
                Copy Invite Code
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleShareInvite('twitter')}
                  className="px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
                >
                  𝕏
                </button>
                <button
                  onClick={() => handleShareInvite('facebook')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  📘
                </button>
                <button
                  onClick={() => handleShareInvite('whatsapp')}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  💬
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
