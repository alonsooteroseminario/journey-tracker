"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface HeaderProps {
  totalProgress?: number;
  currentStreak?: number;
  onNewGoalClick?: () => void;
  showNewGoalButton?: boolean;
}

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/board", label: "Board", icon: "📊" },
  { href: "/feed", label: "Feed", icon: "📰" },
  { href: "/templates", label: "Templates", icon: "📋" },
  { href: "/marketplace", label: "Marketplace", icon: "🏪" },
];

export function Header({
  totalProgress,
  currentStreak = 0,
  onNewGoalClick,
  showNewGoalButton = true,
}: HeaderProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href) ?? false;
  };

  const isAuthenticated = isLoaded && !!user;
  const profileName = user?.fullName || user?.firstName || "";
  const profileImage = user?.imageUrl;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* Top Row: Logo, Stats, Actions */}
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-lg sm:text-2xl">🚀</span>
              <h1 className="text-sm sm:text-xl font-bold text-gray-800">
                <span className="hidden sm:inline">Journey Tracker</span>
                <span className="sm:hidden">Journey</span>
              </h1>
            </Link>
          </div>

          {/* Right: Stats & Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Progress & Streak */}
            {isAuthenticated && totalProgress !== undefined && (
              <div className="hidden md:flex items-center gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-sm sm:text-base font-bold text-blue-600">
                    {totalProgress}%
                  </div>
                  <div className="text-xs text-gray-500">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-base font-bold text-orange-500 flex items-center gap-1 justify-center">
                    {currentStreak > 0 && <span>🔥</span>}
                    {currentStreak}
                  </div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
              </div>
            )}

            {isAuthenticated ? (
              <>
                {/* Friends Button */}
                <Link
                  href="/friends"
                  className="p-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded hover:opacity-90 transition-all font-medium flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Friends</span>
                </Link>

                {/* Profile */}
                <Link
                  href="/profile"
                  className="group relative flex items-center gap-1 p-0.5 sm:p-1 rounded-full hover:bg-gray-100 transition-all"
                  title="Go to Profile"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={profileName}
                      className="w-6 h-6 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200 group-hover:border-blue-400 transition-all"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-[10px] sm:text-sm border border-transparent group-hover:border-blue-400 transition-all">
                      {profileName ? profileName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <span className="hidden lg:block text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {profileName}
                  </span>
                </Link>

                {/* New Goal Button */}
                {showNewGoalButton && onNewGoalClick && pathname === "/" && (
                  <button
                    onClick={onNewGoalClick}
                    className="p-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:opacity-90 transition-all font-medium flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="hidden sm:inline">New Goal</span>
                  </button>
                )}
              </>
            ) : (
              /* Unauthenticated: Sign In / Sign Up */
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-3 py-1.5 text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-3 py-1.5 text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:opacity-90 transition-all font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Always-Visible Tab Bar — icons only on mobile, labels on sm+ */}
        <div className="mt-2 sm:mt-3 border-t border-gray-200 pt-2 sm:pt-3">
          <div className="flex gap-1 sm:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg sm:text-lg">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
