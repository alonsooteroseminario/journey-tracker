# Brand Identity Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update Journey Tracker's visual brand to the "LoDi" brand identity — shifting from blue-heavy to a deep violet/indigo palette with the rocket-orbit logo.

**Architecture:**
Tailwind design tokens are the single source of truth for colors. We add a `brand` color scale to `tailwind.config.ts` and update `globals.css` CSS variables. All components then use `brand-*` utilities instead of hardcoded `blue-*`/`purple-*`. The PNG icon (`LoDi-Minimalist app icon fo...-Feb 25 2026 23-46-qo8k3unw.png`) becomes the app icon; an inline SVG rocket-orbit replaces the 🚀 emoji in the header.

**Tech Stack:** Next.js 15, Tailwind CSS v3, TypeScript, React 18

**Brand Reference Files (in repo root):**
- `LoDi-Minimalist app icon fo...-Feb 25 2026 23-46-qo8k3unw.png` → **primary icon** (lavender bg + rocket+orbit)
- `LoDi-Complete brand identit...-Feb 25 2026 23-46-kz25i4as.png` → brand sheet 1 (dark purple bg)
- `LoDi-Complete brand identit...-Feb 25 2026 23-46-q8m3cchk.png` → brand sheet 2 (dark indigo bg)
- `LoDi-Minimalist app icon fo...-Feb 25 2026 23-46-mweenq1j.png` → minimalist icon variant (white bg)

**Extracted Brand Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#5B50E8` | Primary buttons, active states, links |
| `brand-secondary` | `#7B6FFF` | Gradients, secondary accents |
| `brand-light` | `#EAE8FF` | Active tab backgrounds, hover states |
| `brand-dark` | `#2D1B8E` | Dark backgrounds, header on dark |
| `brand-accent` | `#F08080` | Orbit arc accent, coral highlights |
| `brand-muted` | `#8B85C1` | Subdued text, borders |

---

## Task 1: Add Brand Color Tokens + Update CSS Variables

**Goal:** Establish design token foundation. All later tasks depend on this.

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

### Step 1: Update tailwind.config.ts

Replace `theme.extend.colors` block (currently lines 15–26):

**Old code:**
```ts
colors: {
  streak: {
    fire: "#FF9600",
    gold: "#FFC800",
    glow: "#FFE082",
  },
  progress: {
    start: "#58CC02",
    mid: "#78D608",
    end: "#89E219",
  },
},
```

**New code:**
```ts
colors: {
  brand: {
    primary: "#5B50E8",
    secondary: "#7B6FFF",
    light: "#EAE8FF",
    dark: "#2D1B8E",
    accent: "#F08080",
    muted: "#8B85C1",
  },
  streak: {
    fire: "#FF9600",
    gold: "#FFC800",
    glow: "#FFE082",
  },
  progress: {
    start: "#58CC02",
    mid: "#78D608",
    end: "#89E219",
  },
},
```

### Step 2: Update CSS variables in globals.css

Replace the `:root` block (lines 5–8):

**Old:**
```css
:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}
```

**New:**
```css
:root {
  --background: #f8fafc;
  --foreground: #0f172a;
  --brand-primary: #5B50E8;
  --brand-secondary: #7B6FFF;
  --brand-light: #EAE8FF;
  --brand-dark: #2D1B8E;
  --brand-accent: #F08080;
  --brand-muted: #8B85C1;
}
```

Also update the scrollbar thumb color (line 49) to use brand color:

**Old:**
```css
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

**New:**
```css
::-webkit-scrollbar-thumb {
  background: var(--brand-muted);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--brand-primary);
}
```

### Step 3: Verify Tailwind picks up tokens

Run dev server briefly to confirm no build errors:

```bash
cd /home/alonsooteroseminario/source/repos/journey-tracker
npm run build 2>&1 | tail -10
```

Expected: Build succeeds with no errors.

### Step 4: Run tests — should still pass

```bash
npx vitest run
```

Expected: All 813 tests still pass (CSS/Tailwind changes don't affect unit tests).

### Step 5: Commit

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add brand color tokens to Tailwind config and CSS variables"
```

---

## Task 2: Logo Asset — Copy Icon + Create Inline SVG

**Goal:** Get the brand icon into public/ and create a reusable `<BrandLogo>` component.

**Files:**
- Copy: `LoDi-Minimalist app icon fo...-Feb 25 2026 23-46-qo8k3unw.png` → `public/brand-icon.png`
- Create: `src/components/BrandLogo.tsx`
- Modify: `src/app/layout.tsx` (metadata icons)

### Step 1: Copy the icon to public/

```bash
cp "/home/alonsooteroseminario/source/repos/journey-tracker/LoDi-Minimalist app icon fo...-Feb 25 2026 23-46-qo8k3unw.png" \
   /home/alonsooteroseminario/source/repos/journey-tracker/public/brand-icon.png
```

### Step 2: Create BrandLogo component

Create `src/components/BrandLogo.tsx`:

```tsx
interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 'w-7 h-7', text: 'text-base' },
  md: { icon: 'w-9 h-9', text: 'text-xl' },
  lg: { icon: 'w-14 h-14', text: 'text-3xl' },
};

export function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/brand-icon.png"
        alt="Journey Tracker"
        className={`${s.icon} rounded-xl object-contain`}
      />
      {showText && (
        <span className={`${s.text} font-bold text-brand-primary`}>
          Journey Tracker
        </span>
      )}
    </div>
  );
}
```

### Step 3: Update layout.tsx metadata with icon

Open `src/app/layout.tsx` and add icons to the metadata export:

**Old:**
```ts
export const metadata: Metadata = {
  title: "Journey Tracker - Track Your Goals & Build Streaks",
  description:
    "A motivational goal tracking app with Duolingo-style streaks. Set goals, split tasks, and track your daily progress.",
  keywords: ["goal tracker", "habit tracker", "streak", "productivity", "tasks"],
};
```

**New:**
```ts
export const metadata: Metadata = {
  title: "Journey Tracker - Track Your Goals & Build Streaks",
  description:
    "A motivational goal tracking app with Duolingo-style streaks. Set goals, split tasks, and track your daily progress.",
  keywords: ["goal tracker", "habit tracker", "streak", "productivity", "tasks"],
  icons: {
    icon: "/brand-icon.png",
    apple: "/brand-icon.png",
  },
};
```

### Step 4: Verify the image resolves

```bash
# Check the file exists in public/
ls -lh /home/alonsooteroseminario/source/repos/journey-tracker/public/brand-icon.png
```

Expected: File exists, ~100-200KB.

### Step 5: Commit

```bash
git add public/brand-icon.png src/components/BrandLogo.tsx src/app/layout.tsx
git commit -m "feat: add brand icon to public/ and create BrandLogo component"
```

---

## Task 3: Rebrand the Header (Header.tsx)

**Goal:** Update the app header to use the brand logo and brand colors.

**Files:**
- Modify: `src/components/Header.tsx`

**Current state:**
- Logo: `🚀` emoji + gray text ("Journey Tracker")
- Active nav: `bg-blue-100 text-blue-700`
- Buttons: `from-blue-500 to-purple-600` gradient
- Avatar placeholder: `from-blue-400 to-purple-500`
- Profile border hover: `group-hover:border-blue-400`

### Step 1: Replace the logo section

In `Header.tsx`, find the logo link block (lines 47–57):

**Old:**
```tsx
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
```

**New:**
```tsx
<Link
  href="/"
  className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
>
  <img
    src="/brand-icon.png"
    alt="Journey Tracker"
    className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl object-contain"
  />
  <h1 className="text-sm sm:text-xl font-bold text-brand-primary">
    <span className="hidden sm:inline">Journey Tracker</span>
    <span className="sm:hidden">Journey</span>
  </h1>
</Link>
```

### Step 2: Update active nav tab style

Find the nav link className (around line 176):

**Old active class:**
```tsx
isActive(item.href)
  ? "bg-blue-100 text-blue-700 shadow-sm"
  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
```

**New:**
```tsx
isActive(item.href)
  ? "bg-brand-light text-brand-primary shadow-sm"
  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
```

### Step 3: Update Friends button gradient

Find the Friends Link (around line 84–101):

**Old class:**
```
className="p-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded hover:opacity-90 transition-all font-medium flex items-center gap-1"
```

**New class:**
```
className="p-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded hover:opacity-90 transition-all font-medium flex items-center gap-1"
```

### Step 4: Update New Goal button gradient

Find the New Goal button (around line 127–145):

**Old class:**
```
className="p-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:opacity-90 transition-all font-medium flex items-center gap-1"
```

**New class:**
```
className="p-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded hover:opacity-90 transition-all font-medium flex items-center gap-1"
```

### Step 5: Update avatar placeholder gradient

Find the avatar fallback div (around line 116):

**Old class:**
```
className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 ..."
```

**New class:**
```
className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary ..."
```

### Step 6: Update avatar border hover + Sign Up button

Find `group-hover:border-blue-400` → replace with `group-hover:border-brand-primary`

Find the Sign Up link:
**Old:** `bg-gradient-to-r from-blue-500 to-purple-600`
**New:** `bg-gradient-to-r from-brand-primary to-brand-secondary`

### Step 7: Run dev server and visually verify

```bash
npm run dev
```

Open browser at http://localhost:3000. Verify:
- [ ] Logo shows brand icon + "Journey Tracker" in brand-primary purple
- [ ] Active nav tab is lavender bg + brand-primary text
- [ ] Buttons are brand gradient (not blue)

### Step 8: Run tests

```bash
npx vitest run src/components/Header.test.tsx 2>/dev/null || npx vitest run
```

Expected: All tests pass.

### Step 9: Commit

```bash
git add src/components/Header.tsx
git commit -m "feat: rebrand Header with brand logo, brand-primary colors, brand gradients"
```

---

## Task 4: Rebrand Navigation.tsx (Desktop + Mobile)

**Goal:** Apply brand colors to the secondary Navigation component (desktop top-nav + mobile bottom-nav).

**Files:**
- Modify: `src/components/Navigation.tsx`

### Step 1: Update the logo block in Navigation

Find the logo link (around lines 38–47):

**Old:**
```tsx
<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
  <span className="text-xl sm:text-2xl">🚀</span>
</div>
<div className="hidden sm:block">
  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
    Journey Tracker
  </h1>
</div>
```

**New:**
```tsx
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
```

### Step 2: Update desktop nav active state

Find (around line 56):

**Old:**
```
isActive(item.href)
  ? "bg-blue-100 text-blue-700"
  : "text-gray-600 hover:bg-gray-100"
```

**New:**
```
isActive(item.href)
  ? "bg-brand-light text-brand-primary"
  : "text-gray-600 hover:bg-gray-100"
```

### Step 3: Update mobile nav active state

Find (around line 109):

**Old:**
```
isActive(item.href)
  ? "bg-blue-100 text-blue-700"
  : "text-gray-600 active:bg-gray-100"
```

**New:**
```
isActive(item.href)
  ? "bg-brand-light text-brand-primary"
  : "text-gray-600 active:bg-gray-100"
```

### Step 4: Update avatar fallback gradient

Find (around line 88):

**Old:** `bg-gradient-to-br from-blue-400 to-purple-500`
**New:** `bg-gradient-to-br from-brand-primary to-brand-secondary`

### Step 5: Commit

```bash
git add src/components/Navigation.tsx
git commit -m "feat: rebrand Navigation with brand logo, brand-primary active states"
```

---

## Task 5: Update Page Background + Body

**Goal:** Shift the page-level background from blue-tinted to brand-purple-tinted.

**Files:**
- Modify: `src/app/layout.tsx`

### Step 1: Update body gradient class

In `src/app/layout.tsx`, find the body className (line 22):

**Old:**
```tsx
className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
```

**New:**
```tsx
className="antialiased min-h-screen bg-gradient-to-br from-white via-brand-light/30 to-indigo-50/60"
```

> Note: `brand-light/30` = `#EAE8FF` at 30% opacity → very subtle lavender tint.

### Step 2: Verify no visual regression

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds.

### Step 3: Commit

```bash
git add src/app/layout.tsx
git commit -m "feat: update page background gradient to brand lavender tint"
```

---

## Task 6: Rebrand GoalCard + CreateGoalModal

**Goal:** Update the two most-used UI components — GoalCard and CreateGoalModal — to use brand colors.

**Files:**
- Modify: `src/components/GoalCard.tsx`
- Modify: `src/components/CreateGoalModal.tsx`

### Step 1: Identify color occurrences in GoalCard

GoalCard.tsx has 19 blue/purple/indigo occurrences. Key ones to update:

Search for and replace these patterns:

| Old | New |
|-----|-----|
| `from-blue-500 to-purple-600` | `from-brand-primary to-brand-secondary` |
| `bg-blue-100` | `bg-brand-light` |
| `text-blue-700` | `text-brand-primary` |
| `text-blue-600` | `text-brand-primary` |
| `border-blue-500` | `border-brand-primary` |
| `focus:ring-blue-500` | `focus:ring-brand-primary` |
| `from-blue-400 to-purple-500` | `from-brand-primary to-brand-secondary` |

Do NOT change:
- `text-indigo-*` — only change if it's part of the above patterns
- Orange/amber colors (streak/fire — intentional)
- Green colors (progress — intentional)
- Gray colors (neutral — intentional)

### Step 2: Run GoalCard tests after each batch of changes

```bash
npx vitest run src/components/GoalCard.test.tsx
```

Expected: All GoalCard tests pass.

### Step 3: Apply same pattern to CreateGoalModal

Open `src/components/CreateGoalModal.tsx` and apply the same color swap table from Step 1.

### Step 4: Run full test suite

```bash
npx vitest run
```

Expected: All tests pass.

### Step 5: Commit

```bash
git add src/components/GoalCard.tsx src/components/CreateGoalModal.tsx
git commit -m "feat: rebrand GoalCard and CreateGoalModal with brand color palette"
```

---

## Task 7: Rebrand LandingPage + ChatWidget

**Goal:** Update the landing page (first thing new users see) and the AI chat widget.

**Files:**
- Modify: `src/components/LandingPage.tsx` (10 occurrences)
- Modify: `src/components/chat/ChatWidget.tsx` (5 occurrences)

### Step 1: Apply brand color swap table to LandingPage.tsx

Use the same swap table from Task 6, Step 1.

Specifically watch for the hero CTA buttons — these should become `from-brand-primary to-brand-secondary`.

### Step 2: Apply brand color swap to ChatWidget.tsx

The chat widget header/button area typically uses blue gradients — update to brand.

### Step 3: Run tests

```bash
npx vitest run
```

Expected: All tests pass.

### Step 4: Commit

```bash
git add src/components/LandingPage.tsx src/components/chat/ChatWidget.tsx
git commit -m "feat: rebrand LandingPage and ChatWidget with brand palette"
```

---

## Task 8: Sweep Remaining Components (Wide Pass)

**Goal:** Catch all remaining `from-blue-500 to-purple-600` and `bg-blue-100 text-blue-700` patterns across all 63 affected components.

**Files:** Multiple (see grep results)

### Step 1: Find all remaining occurrences

```bash
cd /home/alonsooteroseminario/source/repos/journey-tracker
grep -rn "from-blue-500 to-purple-600\|bg-blue-100 text-blue-700\|from-blue-400 to-purple-500" src/components/ --include="*.tsx"
```

This will show exactly which files + line numbers still need updating.

### Step 2: Apply brand color swaps file by file

Priority order (highest user visibility first):
1. `src/components/kanban/KanbanCard.tsx` (5 occurrences)
2. `src/components/AnalyticsDashboard.tsx` (18 occurrences)
3. `src/components/TaskMiniCard.tsx` (8 occurrences)
4. `src/components/ResourcesPanel.tsx` (11 occurrences)
5. `src/components/templates/TemplateEditor.tsx` (8 occurrences)
6. `src/components/templates/ForkButton.tsx` (5 occurrences)
7. `src/components/Calendar.tsx` (6 occurrences)
8. Remaining components (lower count)

### Step 3: Run tests after each file

```bash
npx vitest run
```

### Step 4: Commit in logical groups

```bash
git add src/components/kanban/
git commit -m "feat: rebrand Kanban components with brand palette"

git add src/components/AnalyticsDashboard.tsx src/components/Calendar.tsx
git commit -m "feat: rebrand Analytics and Calendar with brand palette"

git add src/components/templates/
git commit -m "feat: rebrand Templates components with brand palette"

# ... etc
```

---

## Task 9: Final Polish + Verification

**Goal:** Verify the entire rebrand is consistent and nothing was missed.

### Step 1: Check for leftover blue-primary patterns

```bash
# Leftover button gradients
grep -rn "from-blue-500 to-purple-600" src/ --include="*.tsx" --include="*.ts"

# Leftover active state patterns
grep -rn "bg-blue-100 text-blue-700" src/ --include="*.tsx" --include="*.ts"

# Leftover avatar gradients
grep -rn "from-blue-400 to-purple-5" src/ --include="*.tsx" --include="*.ts"
```

Expected: Zero results for all three commands.

### Step 2: Run full test suite

```bash
npx vitest run
```

Expected: All 813+ tests pass.

### Step 3: Build verification

```bash
npm run build
```

Expected: Build succeeds with no errors.

### Step 4: Visual review checklist

Start dev server and check each page:

```bash
npm run dev
```

- [ ] `/` — Home page: brand icon in header, brand-colored active tab, brand-colored buttons
- [ ] `/board` — Kanban: brand colors in cards
- [ ] `/feed` — Feed: brand active nav
- [ ] `/templates` — Templates: brand colors
- [ ] `/profile` — Profile: brand avatar gradient
- [ ] Sign out → landing page: brand hero CTA

### Step 5: Final commit if any remaining fixes

```bash
git add -p  # stage selectively
git commit -m "feat: complete brand identity rebrand - final polish pass"
```

---

## Color Swap Reference (Quick Lookup)

Use this table in every task session:

| Pattern to find | Replace with | Context |
|----------------|--------------|---------|
| `from-blue-500 to-purple-600` | `from-brand-primary to-brand-secondary` | CTA buttons, gradients |
| `from-blue-400 to-purple-500` | `from-brand-primary to-brand-secondary` | Avatar fallback |
| `bg-blue-100 text-blue-700` | `bg-brand-light text-brand-primary` | Active nav tabs |
| `bg-blue-100` | `bg-brand-light` | Highlighted backgrounds |
| `text-blue-700` | `text-brand-primary` | Active text |
| `text-blue-600` | `text-brand-primary` | Link / accent text |
| `border-blue-500` | `border-brand-primary` | Active borders |
| `focus:ring-blue-500` | `focus:ring-brand-primary` | Focus rings |
| `from-blue-600 to-purple-600` | `from-brand-primary to-brand-secondary` | Logo text gradients |
| `🚀` (in logo position) | `<img src="/brand-icon.png" ...>` | Logo emoji → image |

**Do NOT change:** streak orange/amber, progress green, gray neutrals, red error states.

---

## Execution Order & Session Plan

Each task is designed to be completed in one focused session (15–45 min):

| Task | Time | Can Run Alone | Depends On |
|------|------|---------------|------------|
| Task 1: Color tokens | 10 min | Yes (foundation) | — |
| Task 2: Logo assets | 15 min | Yes | Task 1 (for `text-brand-primary`) |
| Task 3: Header | 20 min | Yes | Tasks 1 + 2 |
| Task 4: Navigation | 15 min | Yes | Tasks 1 + 2 |
| Task 5: Body background | 5 min | Yes | Task 1 |
| Task 6: GoalCard + Modal | 30 min | Yes | Task 1 |
| Task 7: Landing + Chat | 20 min | Yes | Task 1 |
| Task 8: Wide sweep | 45 min | Yes | Task 1 |
| Task 9: Final verification | 15 min | Yes | All above |

**Recommended session order:**
- **Session A:** Tasks 1 + 2 + 3 (foundation + most visible change)
- **Session B:** Tasks 4 + 5 + 6 (nav + background + goal cards)
- **Session C:** Tasks 7 + 8 + 9 (sweep + verify)
