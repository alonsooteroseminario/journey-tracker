"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/types";

interface NavigationProps {
  profile: UserProfile;
  currentStreak: number;
}

export function Navigation({ profile, currentStreak }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/board", label: "Board", icon: "📊" },
    { href: "/goals", label: "My Goals", icon: "🎯" },
    { href: "/feed", label: "Feed", icon: "📰" },
    { href: "/templates", label: "Templates", icon: "📋" },
    { href: "/marketplace", label: "Marketplace", icon: "🏪" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 min-h-[48px]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🚀</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Journey Tracker
                </h1>
              </div>
            </Link>

            {/* Navigation Links - Desktop Only */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 min-h-[48px] rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* User Info & Streak */}
            <div className="flex items-center gap-4">
              {/* Streak Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full min-h-[40px]">
                <span className="text-lg">🔥</span>
                <span className="font-bold text-orange-700">{currentStreak}</span>
                <span className="text-xs text-orange-600">day streak</span>
              </div>

              {/* Profile Avatar - Increased Touch Target */}
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1.5 sm:p-2 min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] rounded-full hover:bg-gray-100 transition-colors"
              >
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:block text-sm font-medium text-gray-700">
                  {profile.name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Fixed Bottom (Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[56px] min-h-[52px] rounded-lg transition-all ${
                isActive(item.href)
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 active:bg-gray-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
