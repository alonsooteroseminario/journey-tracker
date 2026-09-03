# Role-Gated Public Release: Prompt Wallet for Free Users

**Date:** 2026-09-03
**Status:** Approved design, not yet implemented
**Scope:** Split Cadence into two experiences by access level. Free/public users get a
standalone Prompt Wallet app; the admin (and future paid users) keep the full app.

---

## Goal

Release the Prompt Wallet feature publicly and for free, without giving away the rest of
Cadence. Free users see one product — Prompt Wallet. Auth, sign-up, and sign-in flows are
unchanged. The profile page survives, adapted to a wallet-only user.

Home, Board, Feed, Goals, Friends, Templates, Cost Tracker, and Settings become
full-access-only (admin today, paid users later).

---

## Decisions

| Question | Decision |
|---|---|
| How is access determined? | Email allowlist via env var. No schema change. |
| Free user hits a gated route? | Server-side redirect to `/wallet`. |
| Enforcement depth | Nav hiding + route guard. API routes stay open this round. |
| Header branding | Free users see "Prompt Wallet" everywhere; admin sees "Cadence". |
| Free profile page | Identity fields + wallet stats. Goal/streak/feed sections dropped. |
| Landing page | Keep Cadence branding, add a section for the free Prompt Wallet tier. |

### Why no `User.role` field

A Prisma `role` enum is the correct long-term shape, but there is nothing to store yet —
there are no paying users. An email allowlist reuses the `isAdmin` primitive that already
exists, needs no migration and no backfill, and upgrades to a real field in one change when
money is actually involved. YAGNI.

### Why API routes stay open

A free user calling `/api/goals` reaches only their own (empty) data. There is no
cross-user exposure — the boundary being crossed is a product/billing one, not a security
one. Closing it means touching ~20 route files plus tests. That work belongs in the release
that introduces payment, not this one.

**This is a deliberate, bounded gap. It is not a security hole, and it must be closed
before any paid tier ships.**

---

## Architecture

### 1. Access primitive

Extends `src/lib/admin/auth.ts`. No new file.

```ts
export function hasFullAccess(user: User | null): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;                     // admin always qualifies
  const allow = (process.env.FULL_ACCESS_EMAILS ?? "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(user.email.toLowerCase());
}

export async function requireFullAccess(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!hasFullAccess(user)) redirect("/wallet");
  return user;
}
```

`isAdmin` is **not modified**. Its existing tests assert case-sensitive matching against
`OWNER_ADMIN_EMAIL`; changing that would break them for no benefit. The new
`FULL_ACCESS_EMAILS` list is matched case-insensitively, which is correct for email.

`FULL_ACCESS_EMAILS` is optional. While unset, exactly one account — the
`OWNER_ADMIN_EMAIL` admin — has full access, which is the intended launch state.

### 2. Routing

Move these into a `(full)` route group guarded by one layout. Route groups do not affect
URLs, so every path is unchanged:

```
src/app/(full)/
  board/  goals/  feed/  friends/  templates/  cost-tracker/  settings/
  layout.tsx      ← await requireFullAccess()
```

Verified safe: the only relative imports inside these directories are internal to
`cost-tracker/` (`../hooks/useCostTracker`, `./TransactionForm`), so moving whole
directories preserves them. Everything else uses the `@/` alias.

Chosen over one `layout.tsx` per route because it is one guard instead of seven and it
**fails closed** — a page added to that folder later is gated by default.

| Route | Disposition |
|---|---|
| `board, goals, feed, friends, templates, cost-tracker, settings` | Into `(full)/`, guarded |
| `/` | Server shell (below) |
| `/profile` | Stays; renders a free variant |
| `/wallet`, `/wallet/share/[token]` | Untouched |
| `/admin` | Untouched — keeps its stricter `requireAdmin` gate |
| `/marketplace` | Untouched — already public in middleware, absent from nav |
| `/sign-in`, `/sign-up` | Untouched |

`src/middleware.ts` is not modified.

### 3. The `/` route

`src/app/page.tsx` is currently a 435-line `"use client"` component that branches to
`LandingPage` at line 153. It becomes a server shell:

```tsx
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return <LandingPage />;          // signed out → marketing
  if (!hasFullAccess(user)) redirect("/wallet");
  return <HomeDashboard />;
}
```

The dashboard body moves to `src/components/HomeDashboard.tsx` (`"use client"`), carrying
its DndContext, sensors, goal handlers, and modal state unchanged. `LandingPage` is already
`"use client"` and renders correctly from a server parent.

This file was already oversized; the extraction is a targeted improvement to code the
change has to touch, not unrelated refactoring.

### 4. Access in client components

Root `src/app/layout.tsx` is already a server component, but is currently **synchronous**.
It becomes `async` to compute the flag once:

```tsx
export default async function RootLayout({ children }) {
  const fullAccess = hasFullAccess(await getCurrentUser());
  // ...
  <AppShell fullAccess={fullAccess}>{children}</AppShell>
}
```

`AppShell` wraps its tree in a new `AccessProvider` (~15 lines) exposing `useFullAccess()`.

**The context default is `true`.** This is load-bearing: ~1500 existing tests render
components without the provider, and they must keep passing untouched.

Consumers: `HeaderHost`, `ChatWidget`, `ProfilePage`.

### 5. Header

`Header.tsx` reads `useFullAccess()`.

```
FULL     Cadence          [progress][streak][Friends][theme][chat][avatar][logout]
         🏠 Home  📊 Board  📰 Feed  💼 Prompts Wallet  ⚙️ Settings

FREE     Prompt Wallet                                  [theme][avatar][logout]
         (no tab bar)
```

Free users lose the tab bar, Friends button, chat toggle, and progress/streak stats. They
keep theme toggle, avatar → `/profile`, and logout. The logo `href` flips from `/` to
`/wallet` so free users never bounce through a redirect. `brand-icon.png` is reused — no
new asset.

`ChatWidget` does not render for free users. Confirmed by inspection: nothing under
`src/components/prompts/` or the `prompt-*` API routes imports `useChat`, the agent, or any
Anthropic client. All 34 MCP tools operate on goals, friends, and streaks — there is
nothing in a wallet for them to act on.

### 6. Profile — free variant

| Section | Free |
|---|---|
| Avatar, name, email, bio, location, timezone, save | Keep |
| Sign out | Keep |
| Wallet stats (wallets / groups / chunks) | **Add** |
| Goal stats row (goals, tasks, substeps, active days) | Drop |
| Activity Calendar | Drop |
| `FeedPreferencesPanel` | Drop |
| Task Display (`hideCompletedAfterDays`) | Drop |
| `ShareStreakButton` / "Share Your Progress" | Drop |
| `EmailPreferencesPanel` | Keep, filtered to the 3 account-level toggles below |

Wallet stats need **no new endpoint**. `GET /api/prompt-wallets` already returns wallets
with `groups` and nested `chunks` included, so counts derive client-side from the existing
`useListWalletsQuery`.

**Data fetching.** The free variant reads `profile`, `updateProfile`, and its
loading flag from `useProfileData()` — which returns exactly
`{ profile, profileLoading, updateProfile }` — selected by a ternary against the
`useGoals()` equivalents.

Note what this does **not** achieve. React forbids conditional hooks, so
`useProfileData()`, `useGoals()`, and `useGetGoalStreaksQuery()` all execute for
every user regardless of access level; only the *selection* branches. A free
user therefore still fetches goals, friends, streaks, and the activity log, and
then displays none of it. The original intent — that free users skip those
requests entirely — is not met by this design and cannot be met while all three
hooks live in one component.

Eliminating the waste requires splitting the page into `<FullProfile>` and
`<WalletProfile>` so each hook set sits in a component that only mounts for the
user who needs it. That is a larger refactor than this release warrants, and it
is recorded as follow-up 6 below rather than smuggled in here. This paragraph
describes what the code does, not what would be ideal.

**Email toggles kept for free users:** `enabled` (master), `welcomeEmail`,
`profileChanges`. Every other field on `EmailPreferences` is goal, streak, friend, feed,
reminder, or Discord related and is hidden — `frequency` included, since it governs digests
that only exist for goals. Hidden toggles are not written to; their stored values are left
untouched so nothing is lost if a user is later upgraded to full access.

### 7. Landing page

One new section on `src/components/LandingPage.tsx` pitching the free Prompt Wallet tier.
Cadence branding, headline, and the rest of the page are unchanged.

---

## Testing

| Target | Test |
|---|---|
| `hasFullAccess` | Extend `src/lib/admin/auth.test.ts`: null user, admin match, allowlist hit, case-insensitivity, unset/empty env |
| `requireFullAccess` | Redirects to `/sign-in` unauthenticated, `/wallet` for free, returns user for full |
| `Header` | New `fullAccess={false}` variant: renders "Prompt Wallet", no tab bar, no chat button |
| `HomeDashboard` | Existing `/` tests move with the extracted component |
| Profile free variant | Renders identity + wallet stats, omits calendar/feed/streak sections |

Verify with `npx vitest run` (not `npm run test` — that is watch mode).

Baseline is 1507 tests, 1501 passing. The 6 known pre-existing failures
(`agent/chat/route.test.ts` ×2, prompt-wallets/groups/chunks title-length ×3,
`ChatWidget.test.tsx` ×1) are out of scope and must remain the only failures.

---

## Deploy gate

**`OWNER_ADMIN_EMAIL` must be set in Vercel production before this merges.**

It is currently set in local `.env` only. If it is missing in production, `isAdmin` returns
false for every account, `hasFullAccess` returns false, and the admin is redirected to
`/wallet` — locked out of Home, Board, Feed, Friends, Templates, Cost Tracker, Settings,
and `/admin`, with no in-app way to recover.

Verify with `vercel env ls` before merging. `FULL_ACCESS_EMAILS` needs no production value
at launch.

---

## Known follow-ups

Deliberately out of scope, recorded so they are not lost:

1. **API-level enforcement.** Gated routes are UI + navigation only. Must close before a
   paid tier ships.
2. **Root layout cost.** `getCurrentUser()` now runs per navigation (a Clerk API call plus
   a Prisma read). Signed-out returns `null` immediately, so the landing page is
   unaffected; signed-in pays one extra call per page load.
3. **`User.role` field.** Replaces the email allowlist when there are real paid users.
4. **`/marketplace`.** Public goal-template surface, reachable by free users who have a
   direct link. Left alone; revisit if it becomes confusing.
5. **`src/components/Navigation.tsx` is dead code.** Nothing imports it. Delete during
   implementation. *(Done — commit `c24d075`.)*
6. **Free profile over-fetches.** React forbids conditional hooks, so the profile page
   runs `useGoals()` and `useGetGoalStreaksQuery()` for free users and discards the
   results. Fixing it means splitting the page into `<FullProfile>` / `<WalletProfile>`
   so each hook set mounts only for the user who needs it. Wasted requests only — no
   correctness or security impact. See the Data fetching note in section 6.
7. **`/admin` double redirect.** A free user hitting `/admin` gets `requireAdmin`'s
   redirect to `/`, and the new `/` shell then redirects to `/wallet`. Correct
   destination, two hops. Fixing it means changing `requireAdmin`'s redirect target — a
   guard this branch deliberately left alone.
8. **Free wallet header fetches nothing it shows.** Addressed during the final review
   fix wave; retained here as the general lesson that `useFullAccess()` gates rendering,
   not fetching — any hook above a gate still runs.

---

## Phase 2 — Wallet review

After the split lands, sequenced:

1. **Product readiness pass** — the wallet is now a standalone public product. Cover
   first-run and empty states, error handling, mobile layout, accessibility, share-link
   security (`/wallet/share/[token]` is unauthenticated), and what a stranger hits in their
   first session. Output: prioritized findings.
2. **Code review** — `/code-review` over `src/components/prompts/` and the `prompt-*` API
   routes, scoped to what the readiness pass flags.
