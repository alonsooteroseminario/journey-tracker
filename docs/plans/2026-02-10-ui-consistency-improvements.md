# UI Consistency Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve UI consistency across the app with better card contrast, profile page enhancements, mobile stats access, and a public landing page.

**Architecture:** Conditional rendering on home route for landing/dashboard, new MobileStatsPanel component with FAB and bottom sheet, light-themed cards with proper contrast, profile page with header integration and reduced scale.

**Tech Stack:** Next.js 15, React 18, TailwindCSS, Clerk Auth, TypeScript

---

## Task 1: Fix Card Styling - Template & Marketplace Cards

**Files:**
- Modify: `src/components/templates/TemplateCard.tsx`
- Modify: `src/components/marketplace/MarketplaceGrid.tsx`

### Step 1: Update TemplateCard to light theme with proper contrast

**File: `src/components/templates/TemplateCard.tsx`**

Remove all dark mode classes and use light theme with dark text for readability:

```typescript
"use client";

import type { GoalTemplate } from "@/types";

interface TemplateCardProps {
  template: GoalTemplate;
  onClick?: () => void;
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl sm:text-4xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
            {template.title}
          </h3>
          <p className="text-sm text-gray-600">
            by {template.author?.name || "Unknown"}
          </p>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
        {/* Difficulty Badge */}
        <span
          className={`px-2.5 py-1 rounded-full font-medium text-xs ${
            difficultyColors[template.difficulty]
          }`}
        >
          {template.difficulty}
        </span>

        {/* Category */}
        {template.category && (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {template.category}
          </span>
        )}

        {/* Duration */}
        {template.estimatedDuration && (
          <span className="text-gray-600 text-xs font-medium">
            ⏱ {template.estimatedDuration}
          </span>
        )}
      </div>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md font-medium"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-500 font-medium">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-600">
        <span className="font-medium">🍴 {template.forkCount} forks</span>
        <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium">
          {template.visibility === "public" ? "🌍 Public" : "👥 Friends"}
        </span>
      </div>
    </div>
  );
}
```

### Step 2: Update MarketplaceGrid text colors

**File: `src/components/marketplace/MarketplaceGrid.tsx`**

```typescript
"use client";

import Link from "next/link";
import { TemplateCard } from "@/components/templates/TemplateCard";
import type { GoalTemplate } from "@/types";

interface MarketplaceGridProps {
  templates: GoalTemplate[];
  onTemplateClick?: (template: GoalTemplate) => void;
  isLoading?: boolean;
}

export function MarketplaceGrid({
  templates,
  isLoading,
}: MarketplaceGridProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-sm sm:text-base text-gray-700 font-medium">
          Loading templates...
        </p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl sm:text-6xl mb-4">🔍</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          No templates found
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
      {templates.map((template) => (
        <Link key={template.id} href={`/marketplace/${template.id}`}>
          <TemplateCard template={template} />
        </Link>
      ))}
    </div>
  );
}
```

### Step 3: Remove dark mode classes from templates page

**File: `src/app/templates/page.tsx`**

Replace all dark mode text color classes with light theme equivalents. Change all instances of:
- `dark:text-white` → remove (default black)
- `dark:text-gray-300` → remove
- `dark:text-gray-400` → remove
- `dark:bg-gray-800` → remove
- `dark:bg-gray-700` → remove
- `dark:border-gray-600` → remove

### Step 4: Test card rendering

Run dev server and verify:
```bash
npm run dev
```

Navigate to:
1. `/templates` - Check cards have white backgrounds, dark readable text
2. `/marketplace` - Same verification
3. Verify hover effects work (shadow + border color change)
4. Check all badges are colorful and readable

Expected: All cards have light backgrounds with good contrast against the gradient background.

### Step 5: Commit card styling fixes

```bash
git add src/components/templates/TemplateCard.tsx src/components/marketplace/MarketplaceGrid.tsx src/app/templates/page.tsx
git commit -m "fix: improve card contrast with light theme and dark text"
```

---

## Task 2: Create Mobile Stats Panel Component

**Files:**
- Create: `src/components/MobileStatsPanel.tsx`
- Create: `src/components/MobileStatsPanel.test.tsx`

### Step 1: Write test for MobileStatsPanel

**File: `src/components/MobileStatsPanel.test.tsx`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileStatsPanel } from "./MobileStatsPanel";

const mockStreak = {
  currentStreak: 5,
  longestStreak: 10,
  streakHistory: [
    { date: "2026-02-10", completed: true },
    { date: "2026-02-09", completed: true },
  ],
};

const mockActivityLog = [
  {
    id: "1",
    type: "task_completed" as const,
    timestamp: new Date().toISOString(),
    goalId: "goal-1",
    goalTitle: "Test Goal",
    taskTitle: "Test Task",
  },
];

describe("MobileStatsPanel", () => {
  it("should render FAB button", () => {
    render(
      <MobileStatsPanel
        totalProgress={50}
        completedTasks={5}
        totalTasks={10}
        totalSubsteps={20}
        goalCount={3}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    expect(fab).toBeDefined();
  });

  it("should show bottom sheet when FAB is clicked", () => {
    render(
      <MobileStatsPanel
        totalProgress={50}
        completedTasks={5}
        totalTasks={10}
        totalSubsteps={20}
        goalCount={3}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    expect(screen.getByText(/overall progress/i)).toBeDefined();
    expect(screen.getByText(/activity calendar/i)).toBeDefined();
  });

  it("should close bottom sheet when overlay is clicked", () => {
    render(
      <MobileStatsPanel
        totalProgress={50}
        completedTasks={5}
        totalTasks={10}
        totalSubsteps={20}
        goalCount={3}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    const overlay = screen.getByTestId("overlay");
    fireEvent.click(overlay);

    expect(screen.queryByText(/overall progress/i)).toBeNull();
  });

  it("should display correct stats", () => {
    render(
      <MobileStatsPanel
        totalProgress={75}
        completedTasks={15}
        totalTasks={20}
        totalSubsteps={30}
        goalCount={5}
        streak={mockStreak}
        activityLog={mockActivityLog}
      />
    );

    const fab = screen.getByRole("button", { name: /view stats/i });
    fireEvent.click(fab);

    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("15 done")).toBeDefined();
    expect(screen.getByText("5 left")).toBeDefined();
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm run test -- MobileStatsPanel.test.tsx
```

Expected: FAIL - "MobileStatsPanel is not exported"

### Step 3: Implement MobileStatsPanel component

**File: `src/components/MobileStatsPanel.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Calendar } from "./Calendar";
import { ProgressBar } from "./ProgressBar";
import { StreakCounter } from "./StreakCounter";
import type { Streak, ActivityLogEntry } from "@/types";

interface MobileStatsPanelProps {
  totalProgress: number;
  completedTasks: number;
  totalTasks: number;
  totalSubsteps: number;
  goalCount: number;
  streak: Streak;
  activityLog: ActivityLogEntry[];
}

export function MobileStatsPanel({
  totalProgress,
  completedTasks,
  totalTasks,
  totalSubsteps,
  goalCount,
  streak,
  activityLog,
}: MobileStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button - Only visible on mobile (lg:hidden) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="View stats and calendar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Bottom Sheet Overlay */}
      {isOpen && (
        <>
          {/* Dark overlay */}
          <div
            data-testid="overlay"
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto lg:hidden animate-slide-up">
            {/* Handle bar */}
            <div className="sticky top-0 bg-white pt-3 pb-2 border-b border-gray-100">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-gray-900">Stats & Activity</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Streak Counter */}
              <StreakCounter
                streak={streak}
                hasCompletedToday={activityLog.some(
                  (log) =>
                    log.type === "task_completed" &&
                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                )}
              />

              {/* Overall Progress */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Overall Progress
                </h3>
                <ProgressBar progress={totalProgress} size="md" showPercentage={true} />
                <div className="mt-3 flex justify-between text-xs text-gray-600">
                  <span>{completedTasks} done</span>
                  <span>{totalTasks - completedTasks} left</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Quick Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goals</span>
                    <span className="font-bold text-gray-800">{goalCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasks</span>
                    <span className="font-bold text-gray-800">{totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Substeps</span>
                    <span className="font-bold text-purple-600">{totalSubsteps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Done</span>
                    <span className="font-bold text-green-600">{completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-bold text-blue-600">{streak.streakHistory.length}</span>
                  </div>
                </div>
              </div>

              {/* Mini Calendar */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  Activity Calendar
                </h3>
                <Calendar
                  streakHistory={streak.streakHistory}
                  activityLog={activityLog}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
```

### Step 4: Add slide-up animation to Tailwind config

**File: `tailwind.config.ts`**

Add to the `extend` section:

```typescript
animation: {
  'slide-up': 'slideUp 0.3s ease-out',
},
keyframes: {
  slideUp: {
    '0%': { transform: 'translateY(100%)' },
    '100%': { transform: 'translateY(0)' },
  },
},
```

### Step 5: Run tests to verify they pass

```bash
npm run test -- MobileStatsPanel.test.tsx
```

Expected: All tests PASS

### Step 6: Integrate MobileStatsPanel into home page

**File: `src/app/page.tsx`**

Add import at top:
```typescript
import { MobileStatsPanel } from "@/components/MobileStatsPanel";
```

Add component before the closing `</main>` tag (around line 278):

```typescript
      {/* Mobile Stats Panel */}
      {goals.length > 0 && (
        <MobileStatsPanel
          totalProgress={totalProgress}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          totalSubsteps={totalSubsteps}
          goalCount={goals.length}
          streak={streak}
          activityLog={activityLog}
        />
      )}
```

### Step 7: Test mobile stats panel

```bash
npm run dev
```

1. Resize browser to mobile width (<1024px)
2. Verify FAB appears bottom-right
3. Click FAB - bottom sheet should slide up
4. Verify stats and calendar visible
5. Click overlay or X - sheet should close
6. Resize to desktop (>1024px) - FAB should disappear

Expected: Mobile users can access stats via FAB, desktop users see sidebar as before.

### Step 8: Commit mobile stats panel

```bash
git add src/components/MobileStatsPanel.tsx src/components/MobileStatsPanel.test.tsx src/app/page.tsx tailwind.config.ts
git commit -m "feat: add mobile stats panel with FAB and bottom sheet"
```

---

## Task 3: Update Profile Page

**Files:**
- Modify: `src/app/profile/page.tsx`

### Step 1: Add Header import and integrate with profile picture

**File: `src/app/profile/page.tsx`**

Add import:
```typescript
import { Header } from "@/components/Header";
```

Replace the current header section (lines 89-108) with:

```typescript
      <Header
        totalProgress={undefined}
        currentStreak={streak.currentStreak}
        showNewGoalButton={false}
      />
```

### Step 2: Reduce font sizes by 10-15% throughout profile page

Update text size classes in the profile page:

**Profile Card section (lines 111-246):**
- `text-lg sm:text-3xl` → `text-base sm:text-2xl` (name)
- `text-3xl sm:text-5xl` → `text-2xl sm:text-4xl` (profile initial)
- `text-2xl sm:text-4xl` → `text-xl sm:text-3xl` (upload emoji)

**Stats Grid section (lines 248-306):**
- `text-xl sm:text-3xl` → `text-lg sm:text-2xl` (stat icons)
- `text-lg sm:text-3xl` → `text-base sm:text-2xl` (stat numbers)
- `text-sm sm:text-xl` → `text-xs sm:text-lg` (member since text)

**Calendar section (lines 308-318):**
- `text-sm sm:text-xl` → `text-xs sm:text-lg` (heading)
- `text-lg sm:text-2xl` → `text-base sm:text-xl` (icon)

**Share section (lines 326-380):**
- `text-sm sm:text-2xl` → `text-xs sm:text-xl` (heading)

### Step 3: Test profile page rendering

```bash
npm run dev
```

Navigate to `/profile`:
1. Verify Header shows with profile picture (from Clerk)
2. Check all text is ~10-15% smaller
3. Verify all stats cards are readable
4. Test on mobile - everything should fit better
5. Verify editing still works

Expected: Profile page looks cleaner with better hierarchy and consistent header.

### Step 4: Commit profile page updates

```bash
git add src/app/profile/page.tsx
git commit -m "feat: integrate header with profile picture and reduce text scale"
```

---

## Task 4: Create Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/LandingPage.tsx`
- Modify: `src/middleware.ts`

### Step 1: Update middleware to make home route public

**File: `src/middleware.ts`**

Add "/" to the public routes:

```typescript
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/marketplace(.*)",
  "/api/marketplace(.*)",
]);
```

### Step 2: Create LandingPage component

**File: `src/components/LandingPage.tsx`**

```typescript
"use client";

import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <h1 className="text-xl font-bold text-gray-800">Journey Tracker</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Turn Your Goals Into
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Achievements
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8">
            Break down big goals into manageable tasks, track your daily progress,
            and build unstoppable momentum with streak tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-xl shadow-blue-500/25"
            >
              Start Free Today
            </Link>
            <Link
              href="/marketplace"
              className="w-full sm:w-auto px-8 py-4 text-lg bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold border border-gray-200 shadow-lg"
            >
              Browse Templates 🏪
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
          How Journey Tracker Works
        </h3>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
              1
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Set Your Goal</h4>
            <p className="text-gray-600">
              Choose from templates or create custom goals tailored to your journey.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
              2
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Break It Down</h4>
            <p className="text-gray-600">
              Split goals into tasks and substeps. Make the impossible feel manageable.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
              3
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Track Progress</h4>
            <p className="text-gray-600">
              Complete tasks daily to build your streak and watch your progress grow.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
              4
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Achieve More</h4>
            <p className="text-gray-600">
              Visualize analytics, share wins, and inspire others on your journey.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
          Everything You Need to Succeed
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Smart Goal Setting</h4>
            <p className="text-gray-600 text-sm">
              Create detailed goals with tasks, phases, and substeps for complete clarity.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🔥</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Streak Tracking</h4>
            <p className="text-gray-600 text-sm">
              Build momentum with daily streaks. One task per day keeps your streak alive.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Visual Analytics</h4>
            <p className="text-gray-600 text-sm">
              Charts, heatmaps, and projections help you see progress at a glance.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">📋</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Template Marketplace</h4>
            <p className="text-gray-600 text-sm">
              Fork proven goal templates from the community to kickstart your journey.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">👥</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Social Accountability</h4>
            <p className="text-gray-600 text-sm">
              Share goals with friends, cheer each other on, and stay motivated together.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h4>
            <p className="text-gray-600 text-sm">
              Get personalized insights and task suggestions from your AI coach.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h3>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of achievers tracking their goals and building unstoppable momentum.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 text-lg bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-xl"
            >
              Create Free Account
            </Link>
            <Link
              href="/marketplace"
              className="w-full sm:w-auto px-8 py-4 text-lg bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold border border-white/30"
            >
              Explore Templates
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-gray-200">
        <div className="text-center text-gray-600 text-sm">
          <p>© 2026 Journey Tracker. Built to help you achieve your goals.</p>
        </div>
      </footer>
    </div>
  );
}
```

### Step 3: Update home page with conditional rendering

**File: `src/app/page.tsx`**

Add imports at top:
```typescript
import { useUser } from "@clerk/nextjs";
import { LandingPage } from "@/components/LandingPage";
```

Wrap the entire component return with authentication check (replace the current return statement):

```typescript
  const { user, isLoaded: userLoaded } = useUser();

  // Show loading while checking auth
  if (!userLoaded || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users (existing code continues below)
```

### Step 4: Test landing page

```bash
npm run dev
```

Test flow:
1. Log out if logged in
2. Navigate to `/` - Should see landing page
3. Click "Browse Templates" - Should go to marketplace
4. Click "Get Started" - Should go to sign-up
5. Sign up/Sign in - Should see dashboard on `/`
6. Navigate away and back to `/` - Should still see dashboard

Expected: Unauthenticated users see landing, authenticated users see dashboard.

### Step 5: Run all tests

```bash
npm run test
```

Expected: All 412+ tests should pass.

### Step 6: Commit landing page

```bash
git add src/app/page.tsx src/components/LandingPage.tsx src/middleware.ts
git commit -m "feat: add public landing page with workflow explanation"
```

---

## Task 5: Final Verification & Testing

### Step 1: Run TypeScript check

```bash
npx tsc --noEmit
```

Expected: No errors (existing test file issues are pre-existing).

### Step 2: Run all tests

```bash
npm run test
```

Expected: All tests pass.

### Step 3: Visual regression testing checklist

Start dev server and test:

```bash
npm run dev
```

**Landing Page (unauthenticated):**
- [ ] Hero section renders correctly
- [ ] "How It Works" steps are clear
- [ ] Features grid displays properly
- [ ] CTA buttons work (sign-up, marketplace)
- [ ] Responsive on mobile

**Dashboard (authenticated):**
- [ ] Shows dashboard content (not landing)
- [ ] Stats sidebar visible on desktop (lg+)
- [ ] FAB visible on mobile (<lg)
- [ ] FAB opens bottom sheet with stats/calendar
- [ ] Bottom sheet closes on overlay click

**Profile Page:**
- [ ] Header shows with profile picture
- [ ] Text sizes are ~10-15% smaller
- [ ] All stats cards readable
- [ ] Edit mode still works
- [ ] Responsive on mobile

**Templates Page:**
- [ ] Cards have white backgrounds
- [ ] Text is dark and readable
- [ ] Badges are colorful (green/yellow/red)
- [ ] Hover effects work (shadow + border)
- [ ] Good contrast against gradient background

**Marketplace Page:**
- [ ] Same card improvements as templates
- [ ] Loading text is dark and readable
- [ ] Empty state text is visible
- [ ] Cards link to detail pages

### Step 4: Create summary commit

```bash
git add -A
git commit -m "docs: complete UI consistency improvements

- Light-themed cards with proper contrast
- Mobile FAB with bottom sheet for stats/calendar
- Profile page with header integration and reduced scale
- Public landing page with workflow explanation
- All 412+ tests passing"
```

---

## Summary

**Files Modified:**
- `src/components/templates/TemplateCard.tsx` - Light theme, dark text, colorful badges
- `src/components/marketplace/MarketplaceGrid.tsx` - Readable text colors
- `src/app/templates/page.tsx` - Removed dark mode classes
- `src/app/page.tsx` - Landing page conditional rendering + MobileStatsPanel
- `src/app/profile/page.tsx` - Header integration, reduced text scale
- `src/middleware.ts` - Made / public route
- `tailwind.config.ts` - Added slide-up animation

**Files Created:**
- `src/components/LandingPage.tsx` - Public landing page component
- `src/components/MobileStatsPanel.tsx` - FAB + bottom sheet for mobile
- `src/components/MobileStatsPanel.test.tsx` - Unit tests

**Key Improvements:**
1. ✅ Card contrast fixed - light backgrounds with dark text
2. ✅ Mobile stats access via FAB and bottom sheet
3. ✅ Profile page consistency with header and reduced scale
4. ✅ Public landing page explaining workflow with marketplace CTA
5. ✅ All tests passing
6. ✅ Responsive design maintained
7. ✅ No breaking changes
