# Prompts Wallet — Step 7: Top-Level + Page Route + Nav Entry

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Sections 4 + 5)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step7-page-and-nav`
> **Estimated session length:** medium (2–3h)
> **Depends on:** Step 6 (containers)
> **Unblocks:** Step 8 (E2E)

---

## Goal

Wire everything together: `WalletShell` (3-pane layout), `WalletSidebar` + `WalletRow`, the `/wallet` page route (server component pre-fetch + client `WalletShell`), and the nav entry in `Navigation.tsx`. After this step the feature is fully usable end-to-end.

---

## Files

```
src/app/wallet/page.tsx                       # server component
src/components/prompts/WalletShell.tsx
src/components/prompts/WalletSidebar.tsx
src/components/prompts/WalletRow.tsx
src/components/Navigation.tsx                 # EDIT — add Wallet link
+ co-located *.test.tsx
```

---

## Component briefs

### `src/app/wallet/page.tsx`

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WalletShell } from '@/components/prompts/WalletShell';

export default async function WalletPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');
  const user = await getCurrentUser(clerkId);
  const initialWallets = await prisma.promptWallet.findMany({
    where: { userId: user.id },
    include: { groups: { include: { chunks: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  });
  return <WalletShell initialWallets={JSON.parse(JSON.stringify(initialWallets))} />;
}
```

(The `JSON.parse(JSON.stringify(…))` strips Date prototypes for the client boundary — match repo convention.)

### `src/components/prompts/WalletShell.tsx`

Props:
```ts
interface WalletShellProps {
  initialWallets: PromptWallet[];
}
```

Behaviour:
- Pre-seeds RTK Query cache with `initialWallets` so the first render is hydrated.
- Owns `selectedWalletId` state (defaults to first wallet, or null if zero wallets).
- Layout: 3-column grid on desktop, single-pane stack with bottom-tab on mobile.
- Empty-state: full-page CTA when zero wallets — "Create your first wallet" + 3 seed buttons that fire `useCreateWalletMutation` followed by group + chunk creates. Seed templates definitions are imported from `src/lib/prompts/seedTemplates.ts` (created in Step 8).

### `src/components/prompts/WalletSidebar.tsx`

Renders sortable list of `WalletRow` + Add Wallet inline form.

### `src/components/prompts/WalletRow.tsx`

Compact row: drag handle, icon, title, hover-actions (edit, lock, duplicate, delete). Click row to select. Active state styling on selected wallet.

### `src/components/Navigation.tsx` (edit)

Add a `Wallet` nav item with an icon (e.g., 💼 or a dedicated SVG). Both desktop top-nav and mobile bottom-nav.

---

## Steps

1. Read `src/components/Navigation.tsx` to understand how existing nav items are added.
2. Read `src/app/board/page.tsx` (or another existing page) for the server-component → client-shell pattern.
3. Build `WalletRow.tsx` first.
4. Build `WalletSidebar.tsx`.
5. Build `WalletShell.tsx` (the layout orchestrator).
6. Build `src/app/wallet/page.tsx`.
7. Edit `Navigation.tsx`.
8. Co-locate tests:
   - `WalletRow` — render, click selects, hover actions, lock cycle.
   - `WalletSidebar` — render N rows, add-wallet form, drag-reorder fires mutation.
   - `WalletShell` — render with initial wallets (pre-hydrated cache), select-wallet flow, empty-state seed flow.
   - `Navigation` — add a test asserting the new link is present (or update existing test).
9. **Manual smoke test** — `npm run dev`, visit `/wallet`, exercise:
   - Create wallet, group, chunk
   - Edit chunk (auto-save)
   - Reload — content persists
   - Click group → Compose populates
   - Toggle off a chunk in compose → preview updates
   - Click `Copy Merged` → paste into a text editor → matches preview
   - Delete + undo
   - Lock cycle
   - Duplicate a chunk
10. `npm run lint` + `npm run test` + `npm run build`.
11. Commit `feat(prompts-wallet/step7): page route + top-level UI + nav entry`.

---

## Verification Checklist

- [ ] `/wallet` renders for authenticated users
- [ ] Unauthenticated → redirected to `/sign-in`
- [ ] Initial server fetch populates UI without flash
- [ ] Manual smoke test passes every flow above
- [ ] No console errors during dev session
- [ ] All component tests green
- [ ] Coverage holds ≥80%
- [ ] `npm run build` succeeds

## Out of Scope

- Empty-state seed template *content* — placeholder array OK here; finalized in Step 8
- E2E test suite (Step 8)

## Tracker

Tick row #7 → ✅ Done.
