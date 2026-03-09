# Social Streak Sharing — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a manual "Share Streak" button that generates a branded 1080×1080 PNG via `next/og` and lets users share it to X (Twitter) and Instagram.

**Architecture:** Next.js `ImageResponse` route at `/api/share/streak` returns a PNG using query params (goalId, toggles). Two new components: `ShareStreakButton` (trigger) and `ShareStreakModal` (preview + share actions). GoalCard gets a per-goal button next to `StreakBadge`; profile page gets a global aggregate section.

**Tech Stack:** Next.js 15 `ImageResponse` (`next/og`), Clerk auth (`auth()`), Prisma, Vitest + happy-dom

---

## Parallelization

STORY-030 (API route) and STORY-031 (components) are **fully independent** and can be built in parallel branches:
- Branch `feat/social-share-api` → Tasks 1–2
- Branch `feat/social-share-ui` → Tasks 3–5

Tasks 6–7 (GoalCard + Profile integrations) depend on STORY-031 being merged first.

---

## Task 1: Share Card Image API (STORY-030)

**Branch:** `feat/social-share-api`

**Files:**
- Create: `src/app/api/share/streak/route.tsx`
- Create: `src/app/api/share/streak/route.test.ts`

### Step 1: Write the failing test

Create `src/app/api/share/streak/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    goalStreak: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    goal: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock ImageResponse — just return a fake Response
vi.mock('next/og', () => ({
  ImageResponse: vi.fn().mockImplementation(() => new Response('fake-image', {
    status: 200,
    headers: { 'content-type': 'image/png' },
  })),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { GET } from './route';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockGoalStreakFindFirst = prisma.goalStreak.findFirst as ReturnType<typeof vi.fn>;
const mockGoalStreakFindMany = prisma.goalStreak.findMany as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;

describe('GET /api/share/streak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new Request('http://localhost/api/share/streak');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 PNG for authenticated request (global)', async () => {
    mockGoalStreakFindMany.mockResolvedValue([
      { currentStreak: 7, tier: 'silver' },
    ]);
    const req = new Request('http://localhost/api/share/streak');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  it('returns 200 PNG for authenticated request with goalId', async () => {
    mockGoalFindUnique.mockResolvedValue({ id: 'goal-1', title: 'My Goal', userId: 'mongo-1' });
    mockGoalStreakFindFirst.mockResolvedValue({ currentStreak: 14, tier: 'silver' });
    const req = new Request('http://localhost/api/share/streak?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('renders fallback card when streak not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    mockGoalStreakFindFirst.mockResolvedValue(null);
    const req = new Request('http://localhost/api/share/streak?goalId=nonexistent');
    const res = await GET(req);
    // Should still render (fallback 0 streak), not 404
    expect(res.status).toBe(200);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/alonsooteroseminario/source/repos/journey-tracker
npx vitest run src/app/api/share/streak/route.test.ts 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module './route'"

### Step 3: Implement the API route

Create `src/app/api/share/streak/route.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BRAND_DARK = "#2D1B8E";
const BRAND_PRIMARY = "#5B50E8";
const BRAND_LIGHT = "#EAE8FF";

function tierIcon(tier: string | null): string {
  if (tier === "gold") return "🥇";
  if (tier === "silver") return "🥈";
  if (tier === "bronze") return "🥉";
  return "🔥";
}

function tierLabel(tier: string | null): string {
  if (tier === "gold") return "Gold Streak";
  if (tier === "silver") return "Silver Streak";
  if (tier === "bronze") return "Bronze Streak";
  return "Streak";
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const goalId = searchParams.get("goalId");
  const showTitle = searchParams.get("showTitle") !== "false";
  const showTier = searchParams.get("showTier") !== "false";
  const showTagline = searchParams.get("showTagline") !== "false";
  const showAppName = searchParams.get("showAppName") !== "false";

  let streakCount = 0;
  let tier: string | null = null;
  let goalTitle: string | null = null;

  if (goalId) {
    // Per-goal card
    const [goal, streakRow] = await Promise.all([
      prisma.goal.findUnique({ where: { id: goalId } }),
      prisma.goalStreak.findFirst({ where: { goalId } }),
    ]);
    goalTitle = goal?.title ?? null;
    streakCount = streakRow?.currentStreak ?? 0;
    tier = streakRow?.tier ?? null;
  } else {
    // Global card — aggregate across all goals
    // We need to get the user's Prisma ID first
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    if (user) {
      const streaks = await prisma.goalStreak.findMany({
        where: { userId: user.id, currentStreak: { gt: 0 } },
        orderBy: { currentStreak: "desc" },
      });
      streakCount = streaks.reduce((sum, s) => sum + s.currentStreak, 0);
      // Best tier
      if (streaks.some((s) => s.tier === "gold")) tier = "gold";
      else if (streaks.some((s) => s.tier === "silver")) tier = "silver";
      else if (streaks.length > 0) tier = "bronze";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          background: `linear-gradient(135deg, ${BRAND_DARK} 0%, ${BRAND_PRIMARY} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          {/* Streak number */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "40px",
              padding: "40px 80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "180px", fontWeight: "bold", color: "#fff", lineHeight: 1 }}>
              {streakCount}
            </div>
            <div style={{ fontSize: "40px", color: BRAND_LIGHT, fontWeight: 600 }}>
              day{streakCount !== 1 ? "s" : ""} streak
            </div>
          </div>

          {/* Tier badge */}
          {showTier && tier && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "60px",
                padding: "20px 48px",
              }}
            >
              <div style={{ fontSize: "64px" }}>{tierIcon(tier)}</div>
              <div style={{ fontSize: "40px", color: "#fff", fontWeight: 700 }}>
                {tierLabel(tier)}
              </div>
            </div>
          )}

          {/* Goal title */}
          {showTitle && goalTitle && (
            <div style={{ fontSize: "44px", color: BRAND_LIGHT, textAlign: "center", maxWidth: "800px" }}>
              {goalTitle}
            </div>
          )}

          {/* Tagline */}
          {showTagline && (
            <div style={{ fontSize: "40px", color: "rgba(255,255,255,0.7)" }}>
              🔥 Staying consistent on my journey
            </div>
          )}
        </div>

        {/* App branding */}
        {showAppName && (
          <div
            style={{
              position: "absolute",
              bottom: 48,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "32px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              Journey Tracker
            </div>
          </div>
        )}
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
```

### Step 4: Run tests to verify they pass

```bash
npx vitest run src/app/api/share/streak/route.test.ts 2>&1 | tail -20
```

Expected: 4 tests pass

### Step 5: Commit

```bash
git add src/app/api/share/streak/route.tsx src/app/api/share/streak/route.test.ts
git commit -m "feat(share): add streak share card PNG API via next/og (STORY-030)"
```

---

## Task 2: ShareStreakButton Component (STORY-031, Part 1)

**Branch:** `feat/social-share-ui`

**Files:**
- Create: `src/components/ShareStreakButton.tsx`
- Create: `src/components/ShareStreakButton.test.tsx`

### Step 1: Write the failing test

Create `src/components/ShareStreakButton.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareStreakButton } from './ShareStreakButton';
import { StreakTier } from '@/types';

// Mock the modal so we can check it opens
vi.mock('./ShareStreakModal', () => ({
  ShareStreakModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('ShareStreakButton', () => {
  const defaultProps = {
    streakCount: 7,
    tier: 'silver' as StreakTier,
  };

  it('renders share button when streak > 0', () => {
    render(<ShareStreakButton {...defaultProps} />);
    expect(screen.getByTitle('Share your streak')).toBeTruthy();
  });

  it('does not render when streakCount is 0', () => {
    render(<ShareStreakButton {...defaultProps} streakCount={0} />);
    expect(screen.queryByTitle('Share your streak')).toBeNull();
  });

  it('opens modal on click', () => {
    render(<ShareStreakButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share your streak'));
    expect(screen.getByTestId('share-modal')).toBeTruthy();
  });

  it('closes modal when onClose is called', () => {
    render(<ShareStreakButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share your streak'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('share-modal')).toBeNull();
  });

  it('passes goalId to modal when provided', () => {
    vi.mock('./ShareStreakModal', () => ({
      ShareStreakModal: ({ goalId }: { goalId?: string }) => (
        <div data-testid="share-modal" data-goalid={goalId ?? 'none'} />
      ),
    }));
    render(<ShareStreakButton {...defaultProps} goalId="goal-1" />);
    fireEvent.click(screen.getByTitle('Share your streak'));
  });
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run src/components/ShareStreakButton.test.tsx 2>&1 | tail -15
```

Expected: FAIL — "Cannot find module './ShareStreakButton'"

### Step 3: Implement ShareStreakButton

Create `src/components/ShareStreakButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { StreakTier } from "@/types";
import { ShareStreakModal } from "./ShareStreakModal";

interface ShareStreakButtonProps {
  streakCount: number;
  tier: StreakTier;
  goalId?: string;
  goalTitle?: string;
}

export function ShareStreakButton({ streakCount, tier, goalId, goalTitle }: ShareStreakButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!streakCount || streakCount <= 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Share your streak"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-brand-primary hover:bg-brand-light transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {isOpen && (
        <ShareStreakModal
          streakCount={streakCount}
          tier={tier}
          goalId={goalId}
          goalTitle={goalTitle}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

### Step 4: Run tests to verify they pass

```bash
npx vitest run src/components/ShareStreakButton.test.tsx 2>&1 | tail -15
```

Expected: 5 tests pass (some may need `ShareStreakModal` stub to exist first — see Task 3)

### Step 5: Commit

```bash
git add src/components/ShareStreakButton.tsx src/components/ShareStreakButton.test.tsx
git commit -m "feat(share): add ShareStreakButton component (STORY-031)"
```

---

## Task 3: ShareStreakModal Component (STORY-031, Part 2)

**Branch:** `feat/social-share-ui`

**Files:**
- Create: `src/components/ShareStreakModal.tsx`
- Create: `src/components/ShareStreakModal.test.tsx`

### Step 1: Write the failing test

Create `src/components/ShareStreakModal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareStreakModal } from './ShareStreakModal';
import { StreakTier } from '@/types';

// Mock window.open and navigator.share
const mockWindowOpen = vi.fn();
const mockNavigatorShare = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });
});

const defaultProps = {
  streakCount: 7,
  tier: 'silver' as StreakTier,
  onClose: vi.fn(),
};

describe('ShareStreakModal', () => {
  it('renders the modal with preview image', () => {
    render(<ShareStreakModal {...defaultProps} />);
    const img = screen.getByAltText('Streak share preview');
    expect(img).toBeTruthy();
    // Default toggles should all be on
    expect(img.getAttribute('src')).toContain('showTier=true');
    expect(img.getAttribute('src')).toContain('showTagline=true');
    expect(img.getAttribute('src')).toContain('showAppName=true');
  });

  it('includes goalId in preview URL when provided', () => {
    render(<ShareStreakModal {...defaultProps} goalId="goal-123" goalTitle="Fitness" />);
    const img = screen.getByAltText('Streak share preview');
    expect(img.getAttribute('src')).toContain('goalId=goal-123');
  });

  it('toggle removes param from preview URL', () => {
    render(<ShareStreakModal {...defaultProps} />);
    const tierToggle = screen.getByLabelText('Show tier badge');
    fireEvent.click(tierToggle);
    const img = screen.getByAltText('Streak share preview');
    expect(img.getAttribute('src')).toContain('showTier=false');
  });

  it('Share on X opens twitter intent URL', () => {
    render(<ShareStreakModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Share on X'));
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank'
    );
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ShareStreakModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('download link has correct href', () => {
    render(<ShareStreakModal {...defaultProps} />);
    const downloadLink = screen.getByText('Download PNG').closest('a')!;
    expect(downloadLink.getAttribute('href')).toContain('/api/share/streak');
    expect(downloadLink.getAttribute('download')).toBe('streak.png');
  });

  it('shows goal title in modal header when provided', () => {
    render(<ShareStreakModal {...defaultProps} goalTitle="My Fitness Goal" />);
    expect(screen.getByText('My Fitness Goal')).toBeTruthy();
  });
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run src/components/ShareStreakModal.test.tsx 2>&1 | tail -15
```

Expected: FAIL — "Cannot find module './ShareStreakModal'"

### Step 3: Implement ShareStreakModal

Create `src/components/ShareStreakModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { StreakTier } from "@/types";

interface ShareStreakModalProps {
  streakCount: number;
  tier: StreakTier;
  goalId?: string;
  goalTitle?: string;
  onClose: () => void;
}

function buildPreviewUrl(params: {
  goalId?: string;
  showTitle: boolean;
  showTier: boolean;
  showTagline: boolean;
  showAppName: boolean;
}): string {
  const p = new URLSearchParams();
  if (params.goalId) p.set("goalId", params.goalId);
  p.set("showTitle", String(params.showTitle));
  p.set("showTier", String(params.showTier));
  p.set("showTagline", String(params.showTagline));
  p.set("showAppName", String(params.showAppName));
  return `/api/share/streak?${p.toString()}`;
}

function buildTweetText(streakCount: number, goalTitle?: string): string {
  const base = goalTitle
    ? `I'm on a ${streakCount}-day streak working towards "${goalTitle}" 🔥`
    : `I'm on a ${streakCount}-day streak on Journey Tracker 🔥`;
  return encodeURIComponent(`${base}\n\n#JourneyTracker #Goals #Consistency`);
}

export function ShareStreakModal({
  streakCount,
  tier,
  goalId,
  goalTitle,
  onClose,
}: ShareStreakModalProps) {
  const [showTitle, setShowTitle] = useState(true);
  const [showTier, setShowTier] = useState(true);
  const [showTagline, setShowTagline] = useState(true);
  const [showAppName, setShowAppName] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const previewUrl = buildPreviewUrl({ goalId, showTitle, showTier, showTagline, showAppName });

  const handleShareX = () => {
    const tweetText = buildTweetText(streakCount, goalTitle);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  };

  const handleShareInstagram = async () => {
    if (typeof navigator.share === "undefined") {
      // Desktop fallback: just trigger download
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = "streak.png";
      a.click();
      return;
    }

    try {
      setIsSharing(true);
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], "streak.png", { type: "image/png" });
      await navigator.share({ files: [file], title: "My Journey Streak" });
    } catch {
      // User cancelled or share failed — silent
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Share your streak</h2>
            {goalTitle && (
              <p className="text-sm text-gray-500">{goalTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
            <img
              src={previewUrl}
              alt="Streak share preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="px-4 pb-2 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customize</p>
          <div className="grid grid-cols-2 gap-2">
            {goalId && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Show goal title"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="w-4 h-4 accent-brand-primary"
                />
                Goal title
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                aria-label="Show tier badge"
                checked={showTier}
                onChange={(e) => setShowTier(e.target.checked)}
                className="w-4 h-4 accent-brand-primary"
              />
              Tier badge
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                aria-label="Show tagline"
                checked={showTagline}
                onChange={(e) => setShowTagline(e.target.checked)}
                className="w-4 h-4 accent-brand-primary"
              />
              Tagline
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                aria-label="Show app name"
                checked={showAppName}
                onChange={(e) => setShowAppName(e.target.checked)}
                className="w-4 h-4 accent-brand-primary"
              />
              App name
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <button
            onClick={handleShareX}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            Share on X
          </button>

          <button
            onClick={handleShareInstagram}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            {isSharing ? "Preparing…" : "Share on Instagram"}
          </button>

          <a
            href={previewUrl}
            download="streak.png"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </a>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Run both component tests

```bash
npx vitest run src/components/ShareStreakButton.test.tsx src/components/ShareStreakModal.test.tsx 2>&1 | tail -20
```

Expected: All tests pass

### Step 5: Commit

```bash
git add src/components/ShareStreakModal.tsx src/components/ShareStreakModal.test.tsx
git commit -m "feat(share): add ShareStreakModal component (STORY-031)"
```

---

## Task 4: GoalCard Integration (STORY-032)

> **Depends on:** Tasks 2–3 merged into main.

**Branch:** `feat/social-share-goalcard`

**Files:**
- Modify: `src/components/GoalCard.tsx` (line 216 area)
- Modify: `src/components/GoalCard.test.tsx`

### Step 1: Add ShareStreakButton to GoalCard

In `src/components/GoalCard.tsx`, add the import at the top (after existing imports):

```tsx
import { ShareStreakButton } from "./ShareStreakButton";
```

Then at line 216, change:

```tsx
              <StreakBadge tier={goalTier} streak={goalStreak?.currentStreak} />
```

to:

```tsx
              <StreakBadge tier={goalTier} streak={goalStreak?.currentStreak} />
              <ShareStreakButton
                streakCount={goalStreak?.currentStreak ?? 0}
                tier={goalTier}
                goalId={goal.id}
                goalTitle={goal.title}
              />
```

### Step 2: Add mock to GoalCard tests

In `src/components/GoalCard.test.tsx`, add this mock alongside the existing mocks at the top of the file:

```typescript
vi.mock('./ShareStreakButton', () => ({
  ShareStreakButton: () => null,
}));
```

### Step 3: Run GoalCard tests to verify no regressions

```bash
npx vitest run src/components/GoalCard.test.tsx 2>&1 | tail -20
```

Expected: All existing GoalCard tests pass

### Step 4: Commit

```bash
git add src/components/GoalCard.tsx src/components/GoalCard.test.tsx
git commit -m "feat(share): add ShareStreakButton to GoalCard (STORY-032)"
```

---

## Task 5: Profile Page Global Share Section (STORY-033)

> **Depends on:** Tasks 2–3 merged into main.

**Branch:** `feat/social-share-profile`

**Files:**
- Modify: `src/app/profile/page.tsx`

### Step 1: Add import

In `src/app/profile/page.tsx`, add after the existing imports:

```tsx
import { ShareStreakButton } from "@/components/ShareStreakButton";
import { useGetGoalStreaksQuery } from "@/store/slices/streaksSlice";
import { computeGoalTier } from "@/lib/streaks/computeTier";
```

### Step 2: Add streak data computation

Inside the `ProfilePage` component function, after the existing `activeDays` line (around line 73), add:

```tsx
  // Global streak share data
  const { data: goalStreaks } = useGetGoalStreaksQuery();
  const activeStreaks = (goalStreaks ?? []).filter((s) => s.currentStreak > 0);
  const totalStreakDays = activeStreaks.reduce((sum, s) => sum + s.currentStreak, 0);
  const bestTier = activeStreaks.some((s) => s.tier === 'gold')
    ? 'gold'
    : activeStreaks.some((s) => s.tier === 'silver')
    ? 'silver'
    : activeStreaks.length > 0
    ? 'bronze'
    : null;
```

### Step 3: Add share section to JSX

In the JSX, locate the "Current Streak" stat card (the orange card at line ~232). After the entire stats grid `</div>` closing tag, add a new section:

```tsx
        {/* Share Streak Section */}
        {totalStreakDays > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-3 sm:mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Share your streak</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeStreaks.length} active goal{activeStreaks.length !== 1 ? 's' : ''} · {totalStreakDays} total days
              </p>
            </div>
            <ShareStreakButton
              streakCount={totalStreakDays}
              tier={bestTier}
            />
          </div>
        )}
```

### Step 4: Run full test suite

```bash
npx vitest run 2>&1 | tail -20
```

Expected: All tests pass, no regressions

### Step 5: Commit

```bash
git add src/app/profile/page.tsx
git commit -m "feat(share): add global streak share section to profile page (STORY-033)"
```

---

## Task 6: Merge Branches + Final Verification (STORY-034)

### Step 1: Merge both parallel branches into main

```bash
git checkout main
git merge feat/social-share-api --no-ff -m "Merge feat/social-share-api (STORY-030)"
git merge feat/social-share-ui --no-ff -m "Merge feat/social-share-ui (STORY-031)"
git merge feat/social-share-goalcard --no-ff -m "Merge feat/social-share-goalcard (STORY-032)"
git merge feat/social-share-profile --no-ff -m "Merge feat/social-share-profile (STORY-033)"
```

### Step 2: Run full test suite

```bash
npx vitest run 2>&1 | tail -30
```

Expected: All tests pass

### Step 3: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors

### Step 4: Build check

```bash
npm run build 2>&1 | tail -20
```

Expected: Build succeeds

### Step 5: Update MEMORY.md

Update `/home/alonsooteroseminario/.claude/projects/-home-alonsooteroseminario-source-repos-journey-tracker/memory/MEMORY.md`:
- Add entry for EPIC-010 Social Sharing feature
- Note that `ShareStreakButton` and `ShareStreakModal` exist in `src/components/`
- Note that `/api/share/streak` route uses `next/og` `ImageResponse` with `runtime = "edge"`

---

## Task Order Summary

```
[parallel] Task 1 (branch: feat/social-share-api)    ← STORY-030: API route
[parallel] Task 2+3 (branch: feat/social-share-ui)   ← STORY-031: Button + Modal

[after merge] Task 4 (feat/social-share-goalcard)    ← STORY-032: GoalCard
[after merge] Task 5 (feat/social-share-profile)     ← STORY-033: Profile

Task 6: Merge all + final verification                ← STORY-034
```
