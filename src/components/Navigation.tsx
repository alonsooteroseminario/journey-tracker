"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/types";
import { ThemeToggle } from "./theme/ThemeToggle";

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
    { href: "/wallet", label: "Prompts Wallet", icon: "💼" },
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
      <nav className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 min-h-[48px]">
              <img
                src="/brand-icon.png"
                alt="Journey Tracker"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-brand-primary">
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
                      ? "bg-brand-light text-brand-primary"
                      : "text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* User Info & Streak */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Streak Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full min-h-[40px]">
                <span className="text-lg">🔥</span>
                <span className="font-bold text-orange-700 dark:text-orange-300">{currentStreak}</span>
                <span className="text-xs text-orange-600 dark:text-orange-400">day streak</span>
              </div>

              {/* Profile Avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1.5 sm:p-2 min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] rounded-full hover:bg-surface-hover transition-colors"
              >
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:block text-sm font-medium text-text-primary">
                  {profile.name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Fixed Bottom (Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50 shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[56px] min-h-[52px] rounded-lg transition-all ${
                isActive(item.href)
                  ? "bg-brand-light text-brand-primary"
                  : "text-text-secondary active:bg-surface-hover"
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
