# Role-Gated Prompt Wallet Release — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate Cadence by access level so free/public users get a standalone Prompt Wallet app while the admin keeps the full app.

**Architecture:** An email-allowlist helper (`hasFullAccess`) extends the existing `isAdmin` primitive in `src/lib/admin/auth.ts`. Seven full-access routes move into a `(full)` route group behind a single fail-closed guard layout. A React context seeded from the root server layout (`AccessProvider`, default `true`) lets client components branch on access level.

**Tech Stack:** Next.js 15 App Router, Clerk, Prisma + MongoDB, Redux Toolkit / RTK Query, Vitest + happy-dom, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-03-role-gated-wallet-release-design.md`

## Global Constraints

- Branch: `feat/role-gated-wallet-release`. Already created; the spec is committed at `d5736a6`.
- Run tests with `npx vitest run <path>` — **never `npm run test`**, which is watch mode and will hang.
- Baseline is 1507 tests / 1501 passing. These 6 failures pre-exist and must remain the *only* failures: `src/app/api/agent/chat/route.test.ts` (×2), title-length 400 tests in `src/app/api/prompt-wallets|prompt-groups|prompt-chunks/route.test.ts` (×3), `src/components/chat/ChatWidget.test.tsx` (×1). Do not fix them.
- `isAdmin` in `src/lib/admin/auth.ts` must not be modified — its tests assert case-*sensitive* matching.
- The `AccessProvider` context default is `true`. This is load-bearing: existing tests render components with no provider and must keep passing.
- ESLint: no `console.log` (only `warn`/`error`), no explicit `any`. Remove unused imports rather than prefixing with `_`.
- Exact env var names: `OWNER_ADMIN_EMAIL` (exists), `FULL_ACCESS_EMAILS` (new, optional).
- Exact user-facing copy: header title for free users is `Prompt Wallet` (not "Prompts Wallet" — the nav tab label keeps its existing "Prompts Wallet" text).
- `npx tsc --noEmit`: **count only `src/` errors** — pipe through `grep -v '^\.next/'`. Entries under `.next/dev/types/` are stale generated route types from an old dev-server run (they still name pre-move paths like `app/board/page.ts`) and their count drifts between 0 and ~14 depending on whether a dev server or build ran last. They are build artifacts, not source, and are NOT a regression. After excluding them the repo reports **~133 pre-existing errors**, all in test files (vitest globals absent from tsconfig, plus Prisma `User` type drift — e.g. `src/lib/admin/auth.test.ts(19,9)` predates this branch). Do NOT try to fix them. Verification means no NEW errors and none naming a file your task touched.
- Do not touch `src/middleware.ts`.
- Do not add API-route enforcement. That is an explicit out-of-scope follow-up in the spec.
- **Never run `git add -A` or `git add .`** The working tree carries unrelated
  uncommitted work (a social-assets/Instagram feature, remotion marketing
  components, brand docs). Stage only the files your task names, and run
  `git status --short` before every commit to confirm nothing else is staged.

---

### Task 1: Access primitive

**Files:**
- Modify: `src/lib/admin/auth.ts`
- Test: `src/lib/admin/auth.test.ts`

**Interfaces:**
- Consumes: existing `isAdmin(user)`, `getCurrentUser()`
- Produces: `hasFullAccess(user: User | null): boolean`, `requireFullAccess(): Promise<User>`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/admin/auth.test.ts`. Note the import on line 2 must also be updated to `import { isAdmin, requireAdmin, hasFullAccess, requireFullAccess } from "./auth";`

```ts
describe("hasFullAccess", () => {
  const mockUser = {
    id: "u1", clerkId: "clerk_123", email: "person@example.com", name: "Person",
  } as unknown as User;

  beforeEach(() => {
    delete process.env.OWNER_ADMIN_EMAIL;
    delete process.env.FULL_ACCESS_EMAILS;
  });

  it("returns false for a null user", () => {
    process.env.FULL_ACCESS_EMAILS = "person@example.com";
    expect(hasFullAccess(null)).toBe(false);
  });

  it("returns true for the admin even when the allowlist is unset", () => {
    process.env.OWNER_ADMIN_EMAIL = "person@example.com";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("returns false when neither env var is configured", () => {
    expect(hasFullAccess(mockUser)).toBe(false);
  });

  it("returns true when the email is on the allowlist", () => {
    process.env.FULL_ACCESS_EMAILS = "person@example.com";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("matches the allowlist case-insensitively", () => {
    process.env.FULL_ACCESS_EMAILS = "PERSON@EXAMPLE.COM";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("tolerates whitespace and empty entries in the list", () => {
    process.env.FULL_ACCESS_EMAILS = " ,  person@example.com , ";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("returns false for an email not on the allowlist", () => {
    process.env.FULL_ACCESS_EMAILS = "someone@example.com,other@example.com";
    expect(hasFullAccess(mockUser)).toBe(false);
  });

  it("does not treat an empty allowlist as matching everyone", () => {
    process.env.FULL_ACCESS_EMAILS = "";
    expect(hasFullAccess(mockUser)).toBe(false);
  });
});

describe("requireFullAccess", () => {
  const mockUser = {
    id: "u1", clerkId: "clerk_123", email: "person@example.com", name: "Person",
  } as unknown as User;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OWNER_ADMIN_EMAIL;
    delete process.env.FULL_ACCESS_EMAILS;
  });

  it("redirects to /sign-in when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(requireFullAccess()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("redirects to /wallet when the user lacks full access", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    await expect(requireFullAccess()).rejects.toThrow("REDIRECT:/wallet");
  });

  it("returns the user when they have full access", async () => {
    process.env.FULL_ACCESS_EMAILS = "person@example.com";
    mockGetCurrentUser.mockResolvedValue(mockUser);
    expect(await requireFullAccess()).toBe(mockUser);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/admin/auth.test.ts`
Expected: FAIL — `hasFullAccess is not a function`.

- [ ] **Step 3: Implement**

Append to `src/lib/admin/auth.ts` (leave `isAdmin` and `requireAdmin` untouched):

```ts
/**
 * Full-access users see the complete Cadence app; everyone else gets the
 * standalone Prompt Wallet. The admin always qualifies.
 *
 * FULL_ACCESS_EMAILS is a comma-separated allowlist and is optional — while
 * unset, the OWNER_ADMIN_EMAIL admin is the only full-access account.
 */
export function hasFullAccess(user: User | null): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;

  const allow = (process.env.FULL_ACCESS_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return allow.includes(user.email.toLowerCase());
}

/**
 * Server-side guard for full-access routes. Redirects free users to /wallet.
 */
export async function requireFullAccess(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!hasFullAccess(user)) {
    redirect("/wallet");
  }

  return user;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/admin/auth.test.ts`
Expected: PASS, all `isAdmin`/`requireAdmin` tests still green.

- [ ] **Step 5: Document the env var**

Add to `.env.example`, below the existing `OWNER_ADMIN_EMAIL` line:

```
# Comma-separated emails with access to the full Cadence app (beyond the admin).
# Optional — leave empty so only OWNER_ADMIN_EMAIL has full access.
FULL_ACCESS_EMAILS=
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/auth.ts src/lib/admin/auth.test.ts .env.example
git commit -m "feat(access): add hasFullAccess and requireFullAccess"
```

---

### Task 2: AccessProvider context

**Files:**
- Create: `src/components/AccessProvider.tsx`
- Test: `src/components/AccessProvider.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<AccessProvider value={boolean}>`, `useFullAccess(): boolean`

- [ ] **Step 1: Write the failing test**

Create `src/components/AccessProvider.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessProvider, useFullAccess } from './AccessProvider';

function Probe() {
  return <span>{useFullAccess() ? 'full' : 'free'}</span>;
}

describe('AccessProvider', () => {
  it('defaults to full access when no provider is present', () => {
    render(<Probe />);
    expect(screen.getByText('full')).toBeTruthy();
  });

  it('reports free access when the provider says so', () => {
    render(<AccessProvider value={false}><Probe /></AccessProvider>);
    expect(screen.getByText('free')).toBeTruthy();
  });

  it('reports full access when the provider says so', () => {
    render(<AccessProvider value={true}><Probe /></AccessProvider>);
    expect(screen.getByText('full')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/AccessProvider.test.tsx`
Expected: FAIL — cannot resolve `./AccessProvider`.

- [ ] **Step 3: Implement**

Create `src/components/AccessProvider.tsx`:

```tsx
"use client";

import { createContext, useContext } from "react";

/**
 * Whether the current user gets the full Cadence app (true) or the
 * standalone Prompt Wallet (false).
 *
 * Defaults to `true` so components rendered without a provider — which is
 * every existing unit test — behave exactly as they did before roles existed.
 */
const AccessContext = createContext(true);

export function AccessProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useFullAccess(): boolean {
  return useContext(AccessContext);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/AccessProvider.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/AccessProvider.tsx src/components/AccessProvider.test.tsx
git commit -m "feat(access): add AccessProvider context defaulting to full access"
```

---

### Task 3: Wire access through root layout and AppShell

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/AppShell.tsx`

**Interfaces:**
- Consumes: `hasFullAccess` (Task 1), `AccessProvider` (Task 2), `getCurrentUser()`
- Produces: `<AppShell fullAccess={boolean}>`; `ChatWidget` renders only when `fullAccess`

Server components are not unit-testable under happy-dom, so this task is verified by a typecheck and a build rather than a new test file. That is a deliberate gap, not an oversight.

- [ ] **Step 1: Make the root layout async and compute the flag**

In `src/app/layout.tsx`, add imports and convert the component. It is currently a *synchronous* function — the `async` keyword is a real change:

```tsx
import { getCurrentUser } from "@/lib/auth";
import { hasFullAccess } from "@/lib/admin/auth";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fullAccess = hasFullAccess(await getCurrentUser());

  return (
    <ClerkProvider>
      {/* html/head/body unchanged */}
      <AppShell fullAccess={fullAccess}>
        {children}
      </AppShell>
      {/* ... */}
    </ClerkProvider>
  );
}
```

Leave `metadata`, the `<html>`/`<head>`/`<body>` markup, `themeScript`, and all className strings exactly as they are.

- [ ] **Step 2: Accept and apply the flag in AppShell**

In `src/components/AppShell.tsx`: add the import, widen the props, wrap the tree, and gate `ChatWidget`.

```tsx
import { AccessProvider } from "@/components/AccessProvider";

export function AppShell({
  children,
  fullAccess = true,
}: {
  children: React.ReactNode;
  fullAccess?: boolean;
}) {
  // ...existing useEffect unchanged...

  return (
    <ReduxProvider>
      <ThemeProvider>
        <AccessProvider value={fullAccess}>
          <AutoMigration />
          <TimezoneSync />
          <UndoToastProvider>
            <HeaderHost />
            {children}
            {fullAccess && <ChatWidget />}
          </UndoToastProvider>
        </AccessProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
```

`fullAccess` defaults to `true` for the same reason the context does.

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: **~133 pre-existing errors and no more** (see Global Constraints; the exact count varies slightly with measurement method, so do not treat 133 vs 134 as a regression). Confirm none of them name a file this task touched. The binding check is that no error names a file your task touched.

Run: `npm run build`
Expected: build succeeds. If it fails with a Clerk/`auth()` error, confirm `getCurrentUser()` is only reached during a request render and not at module scope.

- [ ] **Step 4: Confirm no test regressions**

Run: `npx vitest run src/components/AppShell.test.tsx src/components/HeaderHost.test.tsx`
Expected: PASS (or "no test files found" for AppShell, which has none — that is fine).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/AppShell.tsx
git commit -m "feat(access): seed AccessProvider from root layout, hide ChatWidget for free users"
```

---

### Task 4: Header free variant

**Files:**
- Modify: `src/components/Header.tsx`
- Test: `src/components/Header.test.tsx`

**Interfaces:**
- Consumes: `useFullAccess()` (Task 2)
- Produces: header chrome that renders `Prompt Wallet` with no tab bar for free users

- [ ] **Step 1: Write the failing tests**

Append to `src/components/Header.test.tsx`. The existing mocks at the top of that file (Clerk, `next/navigation`, `next/link`, `@/store/hooks`) already apply — do not duplicate them. Add one import:

```tsx
import { AccessProvider } from './AccessProvider';
```

```tsx
describe('Header — free (wallet-only) user', () => {
  const renderFree = () => {
    mockSelector.mockImplementation(
      (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
        selector({ chat: { isOpen: false } })
    );
    return render(
      <AccessProvider value={false}>
        <Header />
      </AccessProvider>
    );
  };

  it('shows "Prompt Wallet" as the title', () => {
    renderFree();
    expect(screen.getByText('Prompt Wallet')).toBeTruthy();
  });

  it('does not show the Cadence wordmark', () => {
    renderFree();
    expect(screen.queryByText('Cadence')).toBeNull();
  });

  it('hides the nav tab bar', () => {
    renderFree();
    expect(screen.queryByText('Board')).toBeNull();
    expect(screen.queryByText('Feed')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('hides the chat toggle', () => {
    renderFree();
    expect(screen.queryByLabelText('Open chat')).toBeNull();
  });

  it('hides the Friends button', () => {
    renderFree();
    expect(screen.queryByText('Friends')).toBeNull();
  });

  it('points the logo at /wallet', () => {
    const { container } = renderFree();
    const logo = container.querySelector('a[href="/wallet"]');
    expect(logo).toBeTruthy();
  });

  it('keeps the profile link and logout', () => {
    const { container } = renderFree();
    expect(container.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(screen.getByLabelText('Log out')).toBeTruthy();
  });
});

describe('Header — full-access user', () => {
  it('still renders the Cadence wordmark and tab bar by default', () => {
    mockSelector.mockImplementation(
      (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
        selector({ chat: { isOpen: false } })
    );
    render(<Header />);
    expect(screen.getByText('Board')).toBeTruthy();
    expect(screen.getByLabelText('Open chat')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: FAIL — "Prompt Wallet" not found; tab bar still rendered.

- [ ] **Step 3: Implement**

In `src/components/Header.tsx`:

Add the import:

```tsx
import { useFullAccess } from "./AccessProvider";
```

Inside the component, after `const pathname = usePathname();`:

```tsx
const fullAccess = useFullAccess();
```

Change the logo block so the href and wordmark follow access level. The existing markup has two `<span>`s (`hidden sm:inline` and `sm:hidden`) that both read "Cadence" — collapse them to a single span, since the responsive split served no purpose:

```tsx
<Link
  href={fullAccess ? "/" : "/wallet"}
  className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
>
  <img
    src="/brand-icon.png"
    alt={fullAccess ? "Cadence" : "Prompt Wallet"}
    className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl object-contain"
  />
  <h1 className="text-sm sm:text-xl font-bold text-brand-primary">
    {fullAccess ? "Cadence" : "Prompt Wallet"}
  </h1>
</Link>
```

Gate the progress/streak stats block by changing its condition from
`{isAuthenticated && totalProgress !== undefined && (` to:

```tsx
{fullAccess && isAuthenticated && totalProgress !== undefined && (
```

Wrap the Friends `<Link>` and the chat toggle `<button>` so they only render with full access. Leave `ThemeToggle`, the profile `<Link>`, and the logout `<button>` outside the gate:

```tsx
{fullAccess && (
  <Link href="/friends" /* ...existing classes and svg unchanged... */>
    {/* ... */}
  </Link>
)}

<ThemeToggle />

{fullAccess && (
  <button onClick={() => dispatch(toggleChat())} /* ...unchanged... */>
    {/* ... */}
  </button>
)}
```

Gate the whole tab bar by wrapping the final block:

```tsx
{fullAccess && (
  <div className="mt-2 sm:mt-3 border-t border-border pt-2 sm:pt-3">
    {/* ...navItems map unchanged... */}
  </div>
)}
```

The "New Goal" button already only renders when `pathname === "/"`, which free users never reach — leave it alone.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Header.test.tsx`
Expected: PASS, including the two original chat-toggle tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/Header.test.tsx
git commit -m "feat(header): render Prompt Wallet chrome for free users"
```

---

### Task 5: `(full)` route group and guard

**Files:**
- Create: `src/app/(full)/layout.tsx`
- Move: `src/app/{board,goals,feed,friends,templates,cost-tracker,settings}/` → `src/app/(full)/`

**Interfaces:**
- Consumes: `requireFullAccess()` (Task 1)
- Produces: every listed route redirects free users to `/wallet`; URLs unchanged

- [ ] **Step 1: Move the directories with git mv**

```bash
mkdir -p "src/app/(full)"
git mv src/app/board "src/app/(full)/board"
git mv src/app/goals "src/app/(full)/goals"
git mv src/app/feed "src/app/(full)/feed"
git mv src/app/friends "src/app/(full)/friends"
git mv src/app/templates "src/app/(full)/templates"
git mv src/app/cost-tracker "src/app/(full)/cost-tracker"
git mv src/app/settings "src/app/(full)/settings"
```

Do **not** move `admin`, `marketplace`, `profile`, `wallet`, `sign-in`, `sign-up`, `page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `globals.css`, or `icon.svg`.

- [ ] **Step 2: Create the guard layout**

Create `src/app/(full)/layout.tsx`:

```tsx
import { requireFullAccess } from "@/lib/admin/auth";

/**
 * Guards every full-access route. Free users are redirected to /wallet.
 *
 * This is deliberately a route-group layout rather than one guard per route:
 * anything added under (full)/ is gated by default, so the failure mode is a
 * locked door rather than an open one.
 */
export default async function FullAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFullAccess();
  return <>{children}</>;
}
```

- [ ] **Step 3: Verify nothing broke**

Run: `npx tsc --noEmit`
Expected: **~133 pre-existing errors and no more** (see Global Constraints; the exact count varies slightly with measurement method, so do not treat 133 vs 134 as a regression). Confirm none of them name a file this task touched. The binding check is that no error names a file your task touched. The only relative imports in the moved tree are internal to `cost-tracker/` (`../hooks/useCostTracker`, `./TransactionForm`) and survive the move intact.

Run: `npm run build`
Expected: success. Confirm the build output still lists routes as `/board`, `/goals`, `/feed`, `/friends`, `/templates`, `/cost-tracker`, `/settings/ai-key` — **not** `/(full)/board`. Route groups are path-invisible; if a `(full)` segment appears in a URL, something is wrong.

- [ ] **Step 4: Confirm no test regressions**

Run: `npx vitest run`
Expected: same 6 pre-existing failures, no new ones.

- [ ] **Step 5: Commit**

`git mv` has already staged every move, so stage only the new guard file.
**Never `git add -A` in this repo** — the working tree carries unrelated
in-progress work (a social-assets/Instagram feature under `src/app/api/`, remotion
marketing files, brand docs) that must not land on this branch.

```bash
git add "src/app/(full)/layout.tsx"
git status --short          # confirm ONLY the moves + the new layout are staged
git commit -m "feat(access): gate full-app routes behind a (full) route group"
```

---

### Task 6: `/` server shell and HomeDashboard extraction

**Files:**
- Create: `src/components/HomeDashboard.tsx` (from the body of `src/app/page.tsx`)
- Modify: `src/app/page.tsx` (435 lines → ~14)

**Interfaces:**
- Consumes: `hasFullAccess` (Task 1), `getCurrentUser()`, existing `LandingPage`
- Produces: `HomeDashboard` — a client component taking no props

- [ ] **Step 1: Extract the dashboard into a client component**

```bash
git mv src/app/page.tsx src/components/HomeDashboard.tsx
```

Then edit `src/components/HomeDashboard.tsx`:

1. Keep `"use client";` on line 1.
2. Delete the `useUser` import from `@clerk/nextjs` and the `LandingPage` import (`@/components/LandingPage`) — both move to the server shell.
3. Keep the `SortableGoalCard` helper function exactly as it is.
4. Rename the component: `export default function Home()` → `export function HomeDashboard()`.
5. Delete this line from the top of the component body:

```tsx
const { user, isLoaded: userLoaded } = useUser();
```

6. Narrow the loading guard from `if (!userLoaded || !isLoaded) {` to:

```tsx
if (!isLoaded) {
```

7. Delete the signed-out branch entirely — the server shell owns it now:

```tsx
  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }
```

8. Leave everything else — `useGoals`, `useNotifications`, the dnd sensors, `handleGoalDragEnd`, all `useState`, the analytics/filter derivations, and the entire returned JSX — byte-identical.

- [ ] **Step 2: Write the server shell**

Create `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasFullAccess } from "@/lib/admin/auth";
import { LandingPage } from "@/components/LandingPage";
import { HomeDashboard } from "@/components/HomeDashboard";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) return <LandingPage />;
  if (!hasFullAccess(user)) redirect("/wallet");

  return <HomeDashboard />;
}
```

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: **~133 pre-existing errors and no more** (see Global Constraints; the exact count varies slightly with measurement method, so do not treat 133 vs 134 as a regression). Confirm none of them name a file this task touched. The binding check is that no error names a file your task touched. If anything still imports `@/app/page`, repoint it at `@/components/HomeDashboard`.

Run: `npm run build`
Expected: success, `/` still listed as a route.

- [ ] **Step 4: Confirm no test regressions**

Run: `npx vitest run`
Expected: same 6 pre-existing failures, no new ones.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/HomeDashboard.tsx
git commit -m "refactor(home): split / into a server access shell and HomeDashboard"
```

---

### Task 7: EmailPreferencesPanel account-only mode

**Files:**
- Modify: `src/components/EmailPreferencesPanel.tsx`
- Test: `src/components/EmailPreferencesPanel.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `<EmailPreferencesPanel accountOnly?: boolean />` — defaults `false`

An explicit prop rather than the context, because the panel has exactly one caller (the profile page, Task 8), which already knows the access level. A prop keeps the component pure and directly testable.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/EmailPreferencesPanel.test.tsx`. That file mocks
`@/store/slices/profileSlice` with bare `vi.fn()`s whose return values are set **per test**
via `mockReturnValue` — so each new test must seed them, or the query returns `undefined`
and the component renders its loading state instead of any toggles.

```tsx
describe("EmailPreferencesPanel — accountOnly", () => {
  const seed = () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
        profileChanges: true,
        goalCreated: true,
        goalDeleted: true,
        friendInvitation: true,
        friendActivity: true,
        streakMilestone: true,
        streakReminder: true,
        friendStreakReminder: true,
        goalPublished: true,
        goalShared: true,
        goalForked: true,
        morningDigest: true,
        overdueAlert: true,
        reminderDigest: false,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);
  };

  it("shows only the Account group when accountOnly", () => {
    seed();
    render(<EmailPreferencesPanel accountOnly />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByText("Goals")).toBeNull();
    expect(screen.queryByText("Friends")).toBeNull();
    expect(screen.queryByText("Streaks")).toBeNull();
    expect(screen.queryByText("Templates & Marketplace")).toBeNull();
    expect(screen.queryByText("Digests & Reminders")).toBeNull();
  });

  it("shows every group by default", () => {
    seed();
    render(<EmailPreferencesPanel />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Digests & Reminders")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/EmailPreferencesPanel.test.tsx`
Expected: FAIL — `accountOnly` is not a prop; goal groups still render.

- [ ] **Step 3: Implement**

In `src/components/EmailPreferencesPanel.tsx`, change the signature:

```tsx
export function EmailPreferencesPanel({ accountOnly = false }: { accountOnly?: boolean }) {
```

Filter the groups immediately after the existing `notificationGroups` array literal (which ends with `];` around line 128):

```tsx
const visibleGroups = accountOnly
  ? notificationGroups.filter((g) => g.title === "Account")
  : notificationGroups;
```

In the JSX, change the notification-type map to iterate `visibleGroups` instead of `notificationGroups`.

Then gate the **frequency selector only**. It begins at the `{/* Frequency selector */}`
comment (around line 162) and ends just before the `{/* Notification type toggles */}`
comment (around line 227). Wrap that one block:

```tsx
{!accountOnly && (
  {/* Frequency selector ... existing block unchanged ... */}
)}
```

**Do NOT hunt for the time pickers separately.** Verified: all three
(`streakProtectTime`, `reminderStartTime`, `reminderStopTime`) render *inside*
`group.items.map`, guarded by `item.key === "streakReminder"` and
`item.key === "reminderDigest"`. Those items belong to the "Streaks" and
"Digests & Reminders" groups, which `visibleGroups` already filters out under
`accountOnly` — so the pickers disappear on their own. Adding separate gates for
them would be dead code.

Leave the master `enabled` toggle visible in both modes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/EmailPreferencesPanel.test.tsx`
Expected: PASS, existing tests in that file still green.

- [ ] **Step 5: Commit**

```bash
git add src/components/EmailPreferencesPanel.tsx src/components/EmailPreferencesPanel.test.tsx
git commit -m "feat(profile): add accountOnly mode to EmailPreferencesPanel"
```

---

### Task 8: Profile free variant

**Files:**
- Modify: `src/app/profile/page.tsx`
- Test: `src/app/profile/page.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `useFullAccess()` (Task 2), `EmailPreferencesPanel` `accountOnly` (Task 7), `useProfileData()`, `useListWalletsQuery()`
- Produces: nothing downstream

- [ ] **Step 1: Write the failing test**

Create or append to `src/app/profile/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessProvider } from '@/components/AccessProvider';
import ProfilePage from './page';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      fullName: 'Test User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      imageUrl: null,
    },
    isLoaded: true,
  }),
}));

vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: () => ({
    profile: { name: 'Test User', email: 'test@example.com', bio: '', location: '', timezone: '' },
    profileLoading: false,
    updateProfile: vi.fn(),
  }),
}));

// The page calls useGoals() unconditionally (hook order cannot vary), so it
// must be mocked even on the free path where its data goes unused.
vi.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({
    profile: { name: 'Test User', email: 'test@example.com', bio: '', location: '', timezone: '' },
    streak: { currentStreak: 0, longestStreak: 0, streakHistory: [] },
    goals: [],
    isLoaded: true,
    updateProfile: vi.fn(),
    activityLog: [],
  }),
}));

vi.mock('@/store/slices/streaksSlice', () => ({
  useGetGoalStreaksQuery: () => ({ data: [] }),
}));

// Counts are deliberately distinct (2 / 3 / 5) so getByText cannot match
// two different stat tiles.
vi.mock('@/store/slices/promptsSlice', () => ({
  useListWalletsQuery: () => ({
    data: [
      {
        id: 'w1',
        groups: [
          { id: 'g1', chunks: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }] },
          { id: 'g2', chunks: [{ id: 'c4' }] },
        ],
      },
      { id: 'w2', groups: [{ id: 'g3', chunks: [{ id: 'c5' }] }] },
    ],
  }),
}));

vi.mock('@/components/EmailPreferencesPanel', () => ({
  EmailPreferencesPanel: () => <div>email-prefs</div>,
}));
vi.mock('@/components/FeedPreferencesPanel', () => ({
  FeedPreferencesPanel: () => null,
}));
vi.mock('@/components/Calendar', () => ({ Calendar: () => null }));
vi.mock('@/components/ShareStreakButton', () => ({ ShareStreakButton: () => null }));

describe('ProfilePage — free user', () => {
  const renderFree = () =>
    render(<AccessProvider value={false}><ProfilePage /></AccessProvider>);

  it('shows wallet counts', () => {
    renderFree();
    expect(screen.getByText('Wallets')).toBeTruthy();
    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Chunks')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();   // wallets
    expect(screen.getByText('3')).toBeTruthy();   // groups
    expect(screen.getByText('5')).toBeTruthy();   // chunks
  });

  it('hides goal, streak and feed sections', () => {
    renderFree();
    expect(screen.queryByText('Activity Calendar')).toBeNull();
    expect(screen.queryByText('Share your streak card')).toBeNull();
    expect(screen.queryByText('Task Display')).toBeNull();
  });

  it('keeps identity fields', () => {
    renderFree();
    expect(screen.getByText('Test User')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/profile/page.test.tsx`
Expected: FAIL — wallet counts absent, goal sections still rendered.

- [ ] **Step 3: Implement**

In `src/app/profile/page.tsx`:

Add imports:

```tsx
import { useFullAccess } from "@/components/AccessProvider";
import { useProfileData } from "@/hooks/useProfileData";
import { useListWalletsQuery } from "@/store/slices/promptsSlice";
```

Read the flag first in the component, then split data fetching. Both hooks must be called unconditionally — React hook order cannot vary between renders, and this file already carries a comment warning about exactly that bug:

Rename only the two fields that need a free-path fallback. `streak`, `goals`, and
`activityLog` keep their existing names so the gated JSX below is untouched:

```tsx
const fullAccess = useFullAccess();

// Free users never need goals/friends/streaks. useGoals is a composition hook
// that fetches all of them; useProfileData is the narrow one its own docblock
// tells new code to prefer.
const { profile: soloProfile, profileLoading, updateProfile: soloUpdate } = useProfileData();
const {
  profile: goalsProfile,
  streak,
  goals,
  isLoaded: goalsLoaded,
  updateProfile: goalsUpdate,
  activityLog,
} = useGoals();
const { data: wallets } = useListWalletsQuery();

const profile = fullAccess ? goalsProfile : soloProfile;
const updateProfile = fullAccess ? goalsUpdate : soloUpdate;
const isLoaded = fullAccess ? goalsLoaded : !profileLoading;
```

**Hook-order warning.** This file already carries a comment explaining that
`useGetGoalStreaksQuery` must sit above the early loading return, because changing the
hook count between renders throws "Rendered more hooks than during the previous render".
`useProfileData()` and `useListWalletsQuery()` are subject to the same rule — place both
with the other hooks at the top of the component, above the `if (!isLoaded || !clerkLoaded)`
return, and never inside a conditional.

Derive the wallet counts (no new endpoint — `listWallets` already nests groups and chunks):

```tsx
const walletCount = wallets?.length ?? 0;
const groupCount = wallets?.reduce((n, w) => n + w.groups.length, 0) ?? 0;
const chunkCount =
  wallets?.reduce(
    (n, w) => n + w.groups.reduce((m, g) => m + g.chunks.length, 0),
    0
  ) ?? 0;
```

Render the free stat row where the goal stat row currently sits:

```tsx
{!fullAccess && (
  <div className="grid grid-cols-3 gap-2 sm:gap-4">
    {[
      { label: "Wallets", value: walletCount },
      { label: "Groups", value: groupCount },
      { label: "Chunks", value: chunkCount },
    ].map((s) => (
      <div key={s.label} className="bg-surface rounded-lg p-3 sm:p-4 text-center">
        <div className="text-xl sm:text-2xl font-bold text-brand-primary">{s.value}</div>
        <div className="text-xs sm:text-sm text-text-secondary">{s.label}</div>
      </div>
    ))}
  </div>
)}
```

Wrap each of these in `{fullAccess && ( ... )}`. Their exact locations, verified
against the current file — each has a `{/* ... */}` marker except the last:

| Section | Marker | Approx. line | Note |
|---|---|---|---|
| Goal stats row | `{/* Stats Grid */}` | 235 | the `grid-cols-2 md:grid-cols-4` div |
| Activity Calendar | `{/* Activity Calendar */}` | 295 | |
| Task Display | `{/* Task Display Settings */}` | 312 | the `hideCompletedAfterDays` control |
| Feed prefs | `{/* Feed Visibility Preferences */}` | 343 | `<FeedPreferencesPanel />` |
| Share streak card | `{/* Share Section */}` | 348 | **already** wrapped in `{totalStreakDays > 0 && (...)}` — combine, do not nest a second guard: `{fullAccess && totalStreakDays > 0 && (...)}` |
| Share Your Progress 🚀 | **none** | ~364-418 | a sibling `<div className="bg-gradient-to-r from-blue-500 to-purple-600 ...">`, closing just before `</main>`. It has NO comment marker and NO existing conditional — find it by its gradient className. |

The last two are siblings, not one nested region. Gating only the `{/* Share Section */}`
block would leave the gradient "Share Your Progress" panel visible to free users.

Pass the new prop through:

```tsx
<EmailPreferencesPanel accountOnly={!fullAccess} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/profile/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/page.tsx src/app/profile/page.test.tsx
git commit -m "feat(profile): wallet-only profile variant for free users"
```

---

### Task 9: Landing page Prompt Wallet section

**Files:**
- Modify: `src/components/LandingPage.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: nothing downstream

- [ ] **Step 1: Add the section**

Insert between the existing "How it works" section and the "Everything in one place" section. Match the surrounding section markup — the page is pinned light, so use the same literal gray/brand colors the neighbouring sections use rather than semantic dark-mode tokens:

```tsx
<section className="py-16 px-6 bg-brand-light/40">
  <div className="max-w-4xl mx-auto text-center">
    <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wide uppercase bg-brand-primary text-white rounded-full">
      Free
    </span>
    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
      Prompt Wallet — free for everyone
    </h2>
    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
      Keep your prompts organized in wallets, group them into reusable blocks,
      and compose them into a finished prompt in seconds. No credit card, no trial.
    </p>
    <div className="grid sm:grid-cols-3 gap-6 mb-10 text-left">
      {[
        { icon: "💼", title: "Wallets", body: "One wallet per project or client. Reorder, duplicate, archive." },
        { icon: "🧩", title: "Reusable blocks", body: "Break prompts into chunks and recombine them however you need." },
        { icon: "🔗", title: "Shareable", body: "Share a read-only link to any wallet with a single click." },
      ].map((f) => (
        <div key={f.title} className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-2xl mb-2">{f.icon}</div>
          <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
          <p className="text-sm text-gray-600">{f.body}</p>
        </div>
      ))}
    </div>
    <Link
      href="/sign-up"
      className="inline-block px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-medium hover:opacity-90 transition-all"
    >
      Start free with Prompt Wallet
    </Link>
  </div>
</section>
```

`Link` is **already imported** at line 3 of that file — do not add a duplicate import.

Exact insertion point, verified: between the `</section>` that closes "How it works" (line 172) and the `<section>` that opens "Everything in one place" (line 175).

Leave the Cadence headline, wordmark, and footer unchanged.

- [ ] **Step 2: Verify it renders**

Run: `npx vitest run src/components/LandingPage.test.tsx`
Expected: PASS, or "no test files found" — that file may not exist, which is acceptable for a marketing section.

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat(landing): add free Prompt Wallet tier section"
```

---

### Task 10: Remove dead code and verify the whole release

**Files:**
- Delete: `src/components/Navigation.tsx`

- [ ] **Step 1: Confirm Navigation.tsx is genuinely unreferenced**

Run: `grep -rn "from ['\"].*Navigation['\"]" src/`
Expected: no output. (Matches on the *word* "Navigation" inside `Calendar.tsx`, `ResourcesPanel.tsx`, and `admin/AdminSidebar.tsx` are comments, not imports — do not act on them.)

- [ ] **Step 2: Delete it**

```bash
git rm src/components/Navigation.tsx
```

- [ ] **Step 3: Full verification**

Run: `npx tsc --noEmit`
Expected: **~133 pre-existing errors and no more** (see Global Constraints; the exact count varies slightly with measurement method, so do not treat 133 vs 134 as a regression). Confirm none of them name a file this task touched. The binding check is that no error names a file your task touched.

Run: `npm run lint`
Expected: no new warnings or errors.

Run: `npx vitest run`
Expected: the 6 pre-existing failures listed in Global Constraints and nothing else. Test count should be higher than 1507 by the tests added in Tasks 1, 2, 4, 7, and 8.

Run: `npm run build`
Expected: success. Confirm the route list contains `/board`, `/feed`, `/goals`, `/friends`, `/templates`, `/cost-tracker`, `/settings/ai-key` with no `(full)` segment in any URL.

- [ ] **Step 4: Hand the manual smoke test to the user — do NOT attempt it**

This step requires a browser and two different authenticated identities. A
subagent cannot sign in through Clerk, so attempting it produces false
confidence, not verification. Report it as outstanding and let the user run it.

**Do not edit `.env` to simulate a free user.** An earlier draft of this plan
said to comment out `OWNER_ADMIN_EMAIL`; that risks leaving the user's local
environment broken if anything goes wrong mid-run. Shell variables take
precedence over `.env` in Next.js, so the free-user pass is a one-liner that
touches nothing on disk:

```bash
npm run dev                          # admin pass — .env untouched
OWNER_ADMIN_EMAIL= FULL_ACCESS_EMAILS= npm run dev   # free-user pass
```

Checks for the user to run.

As the admin (`npm run dev`):
- `/` shows the goal dashboard; header reads "Cadence" with the full tab bar; chat button present.
- `/board`, `/feed`, `/settings/ai-key` all load.
- `/profile` shows goal stats, Activity Calendar, feed prefs, streak sharing.

As a free user (`OWNER_ADMIN_EMAIL= FULL_ACCESS_EMAILS= npm run dev`):
- `/` redirects to `/wallet`.
- Header reads "Prompt Wallet", no tab bar, no chat button, no Friends button.
- `/board`, `/goals`, `/feed`, `/friends`, `/templates`, `/cost-tracker`, `/settings/ai-key` each redirect to `/wallet`.
- `/profile` shows wallet counts and identity fields only.
- `/wallet` works normally.
- Signed out, `/` shows the landing page with the new free-tier section.

- [ ] **Step 5: Commit**

`git rm` has already staged the deletion. Do **not** use `git add -A` — the
working tree carries unrelated in-progress work that must not land on this branch.

```bash
git status --short          # confirm ONLY the Navigation.tsx deletion is staged
git commit -m "chore: remove unused Navigation component"
```

---

## Pre-merge gate

**`OWNER_ADMIN_EMAIL` must be set in Vercel production before this branch merges.**

It currently exists only in local `.env`. Without it in production, `isAdmin` returns false for every account, `hasFullAccess` returns false, and the admin is redirected to `/wallet` — locked out of Home, Board, Feed, Friends, Templates, Cost Tracker, Settings, and `/admin`, with no in-app recovery.

- [ ] Verify with `vercel env ls` (requires `npm i -g vercel`, which is not currently installed), or check the project's Environment Variables in the Vercel dashboard.
- [ ] `FULL_ACCESS_EMAILS` needs no production value at launch.

---

## Out of scope

Recorded in the spec, deliberately not implemented here: API-route enforcement, a `User.role` Prisma field, `/marketplace` gating, and the per-navigation cost of `getCurrentUser()` in the root layout.

Phase 2 — the wallet product-readiness pass and code review — begins after this merges.
