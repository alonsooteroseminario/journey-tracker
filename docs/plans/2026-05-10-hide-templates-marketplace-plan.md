# Hide Templates + Marketplace Nav Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Templates and Marketplace links from the desktop top-nav and mobile bottom-nav. Pages remain reachable by direct URL (no route changes).

**Architecture:** Single source-of-truth `navItems` array in `src/components/Navigation.tsx`. Removing two entries hides them from both desktop and mobile renders simultaneously. No route deletion, no Redux changes, no API changes.

**Tech Stack:** Next.js App Router, React, Tailwind.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/Navigation.tsx` | Modify | Delete two entries from `navItems` |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modify | Append nav-hide entry |

---

### Task 1: Remove the two nav items

**Files:**
- Modify: `src/components/Navigation.tsx:15-25` (the `navItems` array)

- [ ] **Step 1: Read current file**

Run: `head -30 src/components/Navigation.tsx`
Expected: shows `const navItems = [` at line 15 with 9 entries.

- [ ] **Step 2: Apply the edit**

In `src/components/Navigation.tsx`, replace:

```tsx
  const navItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/board", label: "Board", icon: "📊" },
    { href: "/goals", label: "My Goals", icon: "🎯" },
    { href: "/feed", label: "Feed", icon: "📰" },
    { href: "/wallet", label: "Wallet", icon: "💼" },
    { href: "/templates", label: "Templates", icon: "📋" },
    { href: "/marketplace", label: "Marketplace", icon: "🏪" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];
```

with:

```tsx
  const navItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/board", label: "Board", icon: "📊" },
    { href: "/goals", label: "My Goals", icon: "🎯" },
    { href: "/feed", label: "Feed", icon: "📰" },
    { href: "/wallet", label: "Wallet", icon: "💼" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];
```

- [ ] **Step 3: Verify no other Navigation tests assert these labels**

Run: `grep -rn "Templates\|Marketplace" src/components/Navigation*.tsx src/components/Header*.tsx 2>/dev/null`
Expected: no other matches in nav-render components. If any e2e tests assert nav items, update them.

Run: `grep -rn "Templates\|Marketplace" e2e/ 2>/dev/null | head -20`
Expected: list of any e2e references. If a test asserts the labels appear in nav, update or skip it; if it just navigates to the pages directly, no change needed.

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run --reporter=basic`
Expected: all tests pass. The current memory notes 1290+ tests; expect the same number to pass.

- [ ] **Step 5: Smoke-test the dev server**

Run: `npm run dev` in another shell, then visit `http://localhost:3000`. Confirm:
- Desktop nav (md+): no Templates/Marketplace links visible.
- Mobile nav (resize browser < 768px): no Templates/Marketplace icons in bottom bar.
- Direct URL `http://localhost:3000/templates` still loads the page.
- Direct URL `http://localhost:3000/marketplace` still loads the page.

Stop dev server when verified.

- [ ] **Step 6: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat(nav): hide Templates and Marketplace links

Removes two entries from navItems so both desktop top-nav and mobile
bottom-nav stop rendering Templates/Marketplace. Routes are preserved
and remain reachable by direct URL."
```

---

### Task 2: Update BMAD sprint status

**Files:**
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

- [ ] **Step 1: Append entry**

Add:

```yaml
- date: 2026-05-10
  feature: hide-templates-marketplace-nav
  status: complete
  summary: Removed Templates and Marketplace from desktop and mobile nav (routes preserved).
  artifacts:
    - src/components/Navigation.tsx
```

- [ ] **Step 2: Commit**

```bash
git add _bmad-output/implementation-artifacts/sprint-status.yaml
git commit -m "docs(bmad): record nav-hide in sprint status"
```

---

## Self-Review Checklist

- ✅ Spec coverage: nav-only hide as requested (option "Hide nav links only").
- ✅ No placeholders.
- ✅ Both desktop and mobile renders use same `navItems` so single edit covers both.
- ✅ Smoke test verifies both render modes.

## Risks

- **E2E tests may navigate via clicking nav links**: if any e2e test does `page.click('text=Templates')` it will fail after this change. Update such tests to use `page.goto('/templates')` instead. Look for them in Step 3.
- **No user-facing way to find templates after this**: that is the intended behavior. If templates ever need to be discoverable again, restoring this one line in `navItems` restores the link.
