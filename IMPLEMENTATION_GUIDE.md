# Social Features Implementation Guide

## ✅ Completed So Far

### 1. Data Types & Storage (DONE)
- Added `UserProfile`, `Friend`, `FriendSharedData`, `Invitation`, `SocialShare` types
- Updated `AppState` to include:
  - `profile: UserProfile`
  - `friends: Friend[]`
  - `invitations: Invitation[]`
  - `socialShares: SocialShare[]`
- Updated storage.ts with default profile data
- Updated useGoals hook to expose profile, friends, invitations, socialShares

### 2. Navigation Component (DONE)
- Created `src/components/Navigation.tsx`
- Features:
  - Top navigation bar with logo
  - Links to: Dashboard, My Goals, Friends, Profile
  - User avatar with profile image support
  - Streak badge display
  - Mobile-responsive bottom navigation

### 3. Dashboard Page Structure (DONE)
- Created `src/app/dashboard_new.tsx`
- Features:
  - Welcome message with user's name
  - 4 stat cards: Total Goals, Current Streak, Overall Progress, Completion Rate
  - Streak counter display
  - Quick action buttons
  - Recent goals grid (shows up to 6 goals)
  - Links to all other pages

---

## 📋 TODO: Complete Implementation

### Step 1: Replace main page with dashboard
```bash
# Rename current page to backup
mv src/app/page.tsx src/app/page_old.tsx

# Use new dashboard as main page
mv src/app/dashboard_new.tsx src/app/page.tsx
```

### Step 2: Create Profile Page (`src/app/profile/page.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { Navigation } from "@/components/Navigation";
import { UserProfile } from "@/types";

export default function ProfilePage() {
  const { profile, streak, updateProfile, isLoaded } = useGoals();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [imagePreview, setImagePreview] = useState(profile.profileImage || "");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation profile={profile} currentStreak={streak.currentStreak} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              {isEditing ? (
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📸</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2">
                    <span>✏️</span>
                  </div>
                </label>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className="text-2xl font-bold border-b-2 border-blue-500 focus:outline-none w-full"
                  />
                  <input
                    type="email"
                    value={editedProfile.email || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    placeholder="Email"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    value={editedProfile.bio || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={editedProfile.location || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    placeholder="Location"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  {profile.email && <p className="text-gray-600 mb-2">{profile.email}</p>}
                  {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
                  {profile.location && (
                    <p className="text-gray-600 mb-4">📍 {profile.location}</p>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Member Since</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Current Streak</p>
            <p className="text-2xl font-bold text-orange-600">🔥 {streak.currentStreak} days</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Longest Streak</p>
            <p className="text-2xl font-bold text-purple-600">⭐ {streak.longestStreak} days</p>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">Share Your Progress</h2>
          <p className="text-gray-600 mb-4">
            Show your friends your amazing streak and motivate them!
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              📱 Share to Twitter
            </button>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              📸 Share to Instagram
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              💬 Copy Link
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Step 3: Add updateProfile function to useGoals hook

```typescript
// In useGoals.ts, add:

const updateProfile = useCallback((updates: Partial<UserProfile>) => {
  setState((prev) => ({
    ...prev,
    profile: {
      ...prev.profile,
      ...updates,
    },
  }));
}, []);

// Add to return object:
return {
  // ... existing returns
  updateProfile,
}
```

### Step 4: Create Goals Page (`src/app/goals/page.tsx`)

Simply copy the existing page.tsx content but wrap with Navigation component.

### Step 5: Create Friends Comparison Page (`src/app/friends/page.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { Navigation } from "@/components/Navigation";
import { Friend } from "@/types";
import { ProgressBar } from "@/components/ProgressBar";

export default function FriendsPage() {
  const { profile, streak, friends, goals, addFriend, removeFriend, isLoaded } = useGoals();
  const [inviteCode, setInviteCode] = useState("");

  const myStats = {
    totalGoals: goals.length,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completedGoals: goals.filter(g => g.tasks.every(t => t.completed)).length,
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation profile={profile} currentStreak={streak.currentStreak} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Friends Comparison 👥</h1>

        {/* Add Friend Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add a Friend</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter friend's invite code"
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Add Friend
            </button>
          </div>
        </div>

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No friends added yet
            </h3>
            <p className="text-gray-500">
              Add friends to compare your progress and motivate each other!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div key={friend.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {friend.profileImage ? (
                      <img src={friend.profileImage} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      friend.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{friend.name}</h3>
                    <p className="text-gray-600 text-sm">Added {new Date(friend.addedDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Current Streak */}
                  <div className="text-center p-4 rounded-lg bg-orange-50">
                    <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-orange-600">{friend.currentStreak}</p>
                      <span className="text-gray-400">vs</span>
                      <p className="text-2xl font-bold text-blue-600">{myStats.currentStreak}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {friend.currentStreak > myStats.currentStreak ? "They're ahead! 🏃" : 
                       friend.currentStreak < myStats.currentStreak ? "You're ahead! 🎉" : "Tied! 🤝"}
                    </p>
                  </div>

                  {/* Total Goals */}
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <p className="text-sm text-gray-600 mb-1">Total Goals</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-orange-600">{friend.totalGoals}</p>
                      <span className="text-gray-400">vs</span>
                      <p className="text-2xl font-bold text-blue-600">{myStats.totalGoals}</p>
                    </div>
                  </div>

                  {/* Completed Goals */}
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-sm text-gray-600 mb-1">Completed Goals</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-orange-600">{friend.completedGoals}</p>
                      <span className="text-gray-400">vs</span>
                      <p className="text-2xl font-bold text-blue-600">{myStats.completedGoals}</p>
                    </div>
                  </div>

                  {/* Longest Streak */}
                  <div className="text-center p-4 rounded-lg bg-purple-50">
                    <p className="text-sm text-gray-600 mb-1">Longest Streak</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-orange-600">{friend.longestStreak}</p>
                      <span className="text-gray-400">vs</span>
                      <p className="text-2xl font-bold text-blue-600">{myStats.longestStreak}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    💬 Send Encouragement
                  </button>
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    🔥 Challenge Streak
                  </button>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motivational Message */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-2">Keep Each Other Motivated! 💪</h3>
          <p className="text-purple-100">
            Friends who track together, achieve together. Share your progress and celebrate wins!
          </p>
        </div>
      </main>
    </div>
  );
}
```

### Step 6: Add Friend Management Functions to useGoals

```typescript
// In useGoals.ts:

const addFriend = useCallback((friend: Friend) => {
  setState((prev) => ({
    ...prev,
    friends: [...prev.friends, friend],
  }));
}, []);

const removeFriend = useCallback((friendId: string) => {
  setState((prev) => ({
    ...prev,
    friends: prev.friends.filter((f) => f.id !== friendId),
  }));
}, []);

// Add to return
```

### Step 7: Social Media Sharing Component

Create `src/components/SocialShareButtons.tsx`:

```typescript
"use client";

import { useState } from "react";
import { UserProfile, StreakData } from "@/types";

interface SocialShareButtonsProps {
  profile: UserProfile;
  streak: StreakData;
  onShare: (platform: string) => void;
}

export function SocialShareButtons({ profile, streak, onShare }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = `🔥 ${streak.currentStreak} day streak on Journey Tracker! Join me in achieving your goals! 🎯`;
  
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const platforms = [
    {
      name: 'Twitter',
      icon: '𝕏',
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-600 hover:bg-green-700',
      url: `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`,
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Share Your Streak!</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {platforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onShare(platform.name.toLowerCase())}
            className={`flex flex-col items-center justify-center p-4 rounded-lg text-white transition-colors ${platform.color}`}
          >
            <span className="text-2xl mb-1">{platform.icon}</span>
            <span className="text-sm font-medium">{platform.name}</span>
          </a>
        ))}
      </div>

      <button
        onClick={copyToClipboard}
        className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
      >
        {copied ? '✅ Link Copied!' : '🔗 Copy Share Link'}
      </button>
    </div>
  );
}
```

### Step 8: Streak Reminder Notification

Add to `useGoals.ts`:

```typescript
// Check for streak reminder
useEffect(() => {
  if (!isLoaded) return;

  const checkStreakReminder = () => {
    const now = new Date();
    const lastReminder = state.lastSocialShareReminder;
    
    // If haven't shared in 7 days and have streak > 3, remind
    if (state.streak.currentStreak >= 3) {
      if (!lastReminder || getDaysDifference(lastReminder, getToday()) >= 7) {
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Share Your Progress! 🔥', {
            body: `You have a ${state.streak.currentStreak} day streak! Share it on social media to inspire others!`,
            icon: '/icon-192x192.png',
          });
        }

        setState((prev) => ({
          ...prev,
          lastSocialShareReminder: getToday(),
        }));
      }
    }
  };

  checkStreakReminder();
}, [isLoaded, state.streak.currentStreak]);
```

---

## 📌 Summary

**Completed:**
1. ✅ User profile data structure
2. ✅ Navigation component with profile avatar
3. ✅ Dashboard overview page
4. ✅ Updated useGoals to expose profile & social data

**To Complete:**
1. Replace main page.tsx with dashboard
2. Create Profile page with image upload
3. Add updateProfile function
4. Create Goals list page
5. Create Friends comparison page
6. Add friend management functions
7. Create social sharing component
8. Add streak reminder notifications

**Benefits of This System:**
- 🎯 Dashboard shows quick overview
- 👤 Profile page for personalization
- 👥 Friends page for motivation & competition
- 📱 Social sharing to build accountability
- 🔔 Reminders to maintain engagement
- 🔥 Streak system keeps users motivated

All the code is provided above - just copy the sections into the appropriate files and test!
