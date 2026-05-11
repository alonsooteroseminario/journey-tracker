# Light/Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working light/dark/system theme toggle. Phase A wires the infrastructure (provider, toggle button, Tailwind config, root layout, pre-hydration script, app shell, Header, Navigation, body, globals.css). Phase B applies `dark:` Tailwind variants to the highest-traffic surfaces (GoalCard, ChunkRow, WalletShell). Phase C (remaining surfaces) is deferred to a future plan.

**Architecture:** Tailwind `darkMode: "class"`. A `<ThemeProvider>` React Context manages `'light' | 'dark' | 'system'` and writes the resolved class (`light` or `dark`) onto `<html>`. Preference persists in `localStorage["theme"]`. An inline `<script>` in `<head>` resolves and applies the class before React hydrates, so there is no white-flash on first paint. `system` mode follows `prefers-color-scheme` reactively.

**Tech Stack:** React Context, Tailwind CSS (class-based dark), localStorage, matchMedia. No new npm packages.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `tailwind.config.ts` | Modify | Set `darkMode: "class"` |
| `src/components/theme/ThemeProvider.tsx` | Create | Context, localStorage sync, system listener |
| `src/components/theme/ThemeToggle.tsx` | Create | 3-state cycle button (sun / moon / monitor) |
| `src/components/theme/themeScript.ts` | Create | Inline pre-hydration script string |
| `src/app/layout.tsx` | Modify | Inject themeScript in `<head>`; suppressHydrationWarning |
| `src/components/AppShell.tsx` | Modify | Wrap with `<ThemeProvider>` |
| `src/components/Navigation.tsx` | Modify | Render `<ThemeToggle>`; add dark: variants |
| `src/components/Header.tsx` | Modify | dark: variants (if file exists; check) |
| `src/app/globals.css` | Modify | Dark body bg, scrollbar, base text colors |
| `src/components/GoalCard.tsx` | Modify | dark: variants for card surfaces, text, hover |
| `src/components/prompts/ChunkRow.tsx` | Modify | dark: variants |
| `src/components/prompts/WalletShell.tsx` | Modify | dark: variants |
| `src/components/prompts/WalletSidebar.tsx` | Modify | dark: variants |
| `src/components/prompts/WalletDetail.tsx` | Modify | dark: variants |
| `src/components/theme/ThemeProvider.test.tsx` | Create | Unit tests for provider + toggle |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modify | Append entry |
| `_bmad-output/project-context.md` | Modify | Note dark-mode wiring |

---

## Phase A — Infrastructure

### Task A1: Enable Tailwind class-based dark mode

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Read current config**

Run: `cat tailwind.config.ts`
Expected: shows `theme: { extend: { ... } }`, no `darkMode` key.

- [ ] **Step 2: Add `darkMode: "class"` at the top of the config**

Replace the line `const config: Config = {` and the next line (which is `  content: [`) with:

```ts
const config: Config = {
  darkMode: "class",
  content: [
```

- [ ] **Step 3: Verify build still succeeds**

Run: `npx tsc --noEmit && npm run lint`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(theme): enable Tailwind class-based dark mode"
```

---

### Task A2: Pre-hydration theme script

**Files:**
- Create: `src/components/theme/themeScript.ts`

- [ ] **Step 1: Create the file**

Write:

```ts
// Returns a string of JavaScript that runs synchronously in <head> before React
// hydrates. Reads localStorage["theme"] (or falls back to system), then sets the
// "dark" class on <html> so the first paint matches the user's preference.
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'dark' || (stored !== 'light' && systemDark) ? 'dark' : 'light';
    var root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = resolved;
  } catch (e) {
    // localStorage may throw in private mode; ignore — page renders in light.
  }
})();
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/theme/themeScript.ts
git commit -m "feat(theme): add pre-hydration theme script"
```

---

### Task A3: ThemeProvider with context, localStorage, system listener

**Files:**
- Create: `src/components/theme/ThemeProvider.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyToHtml(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // First mount: read stored preference
  useEffect(() => {
    let stored: Theme = "system";
    try {
      const raw = localStorage.getItem("theme");
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      // ignore
    }
    setThemeState(stored);
    const r = resolveTheme(stored);
    setResolvedTheme(r);
    applyToHtml(r);
  }, []);

  // Reactive system-theme listener (only matters when theme === 'system')
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r: ResolvedTheme = mq.matches ? "dark" : "light";
      setResolvedTheme(r);
      applyToHtml(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
    const r = resolveTheme(next);
    setResolvedTheme(r);
    applyToHtml(r);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Outside provider: safe fallback so unit tests don't crash.
    return {
      theme: "light",
      resolvedTheme: "light",
      setTheme: () => {},
      cycleTheme: () => {},
    };
  }
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/theme/ThemeProvider.tsx
git commit -m "feat(theme): add ThemeProvider with localStorage + system listener"
```

---

### Task A4: ThemeToggle button

**Files:**
- Create: `src/components/theme/ThemeToggle.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, cycleTheme } = useTheme();
  const label =
    theme === "light" ? "Switch to dark mode"
    : theme === "dark" ? "Switch to system mode"
    : "Switch to light mode";

  return (
    <button
      onClick={cycleTheme}
      className={`p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${className}`}
      title={label}
      aria-label={label}
      type="button"
    >
      {theme === "light" && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {theme === "dark" && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
      {theme === "system" && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/theme/ThemeToggle.tsx
git commit -m "feat(theme): add ThemeToggle cycling light/dark/system"
```

---

### Task A5: Test the ThemeProvider behavior

**Files:**
- Create: `src/components/theme/ThemeProvider.test.tsx`

- [ ] **Step 1: Write the tests**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function Probe() {
  const { theme, resolvedTheme, setTheme, cycleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>set-dark</button>
      <button onClick={() => setTheme("light")}>set-light</button>
      <button onClick={() => setTheme("system")}>set-system</button>
      <button onClick={cycleTheme}>cycle</button>
    </div>
  );
}

function setMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("dark") ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  setMatchMedia(false);
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("defaults to system theme on first mount with no stored preference", () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("reads stored 'dark' from localStorage and applies the class", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme('dark') persists to localStorage and applies the class", () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => { fireEvent.click(screen.getByText("set-dark")); });
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme('light') clears the class", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => { fireEvent.click(screen.getByText("set-light")); });
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("system mode follows prefers-color-scheme: dark", () => {
    setMatchMedia(true);
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => { fireEvent.click(screen.getByText("set-system")); });
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("cycleTheme moves light -> dark -> system -> light", () => {
    localStorage.setItem("theme", "light");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("light");
    act(() => { fireEvent.click(screen.getByText("cycle")); });
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    act(() => { fireEvent.click(screen.getByText("cycle")); });
    expect(screen.getByTestId("theme").textContent).toBe("system");
    act(() => { fireEvent.click(screen.getByText("cycle")); });
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("useTheme outside provider returns safe defaults", () => {
    render(<Probe />);
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/components/theme/ThemeProvider.test.tsx --reporter=verbose`
Expected: all 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/theme/ThemeProvider.test.tsx
git commit -m "test(theme): cover ThemeProvider behavior"
```

---

### Task A6: Inject themeScript and suppressHydrationWarning in root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read current layout**

Run: `cat src/app/layout.tsx`
Expected: a server component that returns `<html><body>{children}</body></html>` wrapped in `ClerkProvider`. Look for the existing `<html lang="en">` opening tag.

- [ ] **Step 2: Add suppressHydrationWarning + inline themeScript**

Modify the `<html lang="en">` tag to include `suppressHydrationWarning` (because the html `class` will be set by the inline script before React mounts).

Add a `<head>` block (if the layout doesn't already have one) immediately inside `<html>` containing:

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{ __html: themeScript }}
  />
</head>
```

If the file already has `<head>`, just add the `<script>` inside it. Add the import at the top:

```tsx
import { themeScript } from "@/components/theme/themeScript";
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(theme): inject pre-hydration theme script in root layout"
```

---

### Task A7: Wrap AppShell with ThemeProvider

**Files:**
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: Read current AppShell**

Run: `cat src/components/AppShell.tsx`
Expected: client component wrapping children with `ReduxProvider`, `UndoToastProvider`, `AutoMigration`, and `ChatWidget`.

- [ ] **Step 2: Add ThemeProvider as the outermost wrapper inside ReduxProvider**

Add import:

```tsx
import { ThemeProvider } from "./theme/ThemeProvider";
```

Wrap the existing return value. The exact nesting:

```tsx
<ReduxProvider>
  <ThemeProvider>
    <UndoToastProvider>
      {/* existing tree */}
    </UndoToastProvider>
  </ThemeProvider>
</ReduxProvider>
```

(Match whatever the existing nesting is — slot `ThemeProvider` just inside `ReduxProvider` and outside `UndoToastProvider`.)

- [ ] **Step 3: Run tests**

Run: `npx vitest run --reporter=basic`
Expected: pass. Tests that mount components without `ThemeProvider` work because `useTheme` has a safe fallback.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppShell.tsx
git commit -m "feat(theme): wrap AppShell with ThemeProvider"
```

---

### Task A8: Place ThemeToggle in Navigation

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Add import**

At the top, add:

```tsx
import { ThemeToggle } from "./theme/ThemeToggle";
```

- [ ] **Step 2: Place the toggle just before the streak badge in the desktop nav**

In the JSX for the right-side user-info block (around line 71), insert `<ThemeToggle />` as the first child of the flex container:

```tsx
<div className="flex items-center gap-4">
  <ThemeToggle />
  {/* Streak Badge - existing */}
  ...
```

For mobile, do NOT add to bottom nav (the toggle lives in Profile page in Phase A). Mobile users can change theme via profile.

- [ ] **Step 3: Smoke-test**

Run `npm run dev`. Verify:
- Desktop nav shows the toggle.
- Clicking it cycles light → dark → system.
- The `<html>` element gets `class="dark"` when dark is active (DevTools → Elements).
- Refresh — preference persists.

- [ ] **Step 4: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat(theme): add ThemeToggle to desktop nav"
```

---

### Task A9: Globals.css — body, scrollbar, base dark backgrounds

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Read current globals**

Run: `cat src/app/globals.css`
Expected: tailwind base/components/utilities and existing custom styles.

- [ ] **Step 2: Append dark-mode base rules**

Append to the end of `globals.css`:

```css
/* Theme: dark-mode base */
html.dark body {
  background-color: #0e1116;
  color: #e6e6e6;
}

html.dark ::selection {
  background-color: rgba(91, 80, 232, 0.4);
}

/* Optional: dark scrollbar — webkit only */
html.dark ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
html.dark ::-webkit-scrollbar-track {
  background: #0e1116;
}
html.dark ::-webkit-scrollbar-thumb {
  background: #2a2f3a;
  border-radius: 5px;
}
html.dark ::-webkit-scrollbar-thumb:hover {
  background: #3b424f;
}
```

- [ ] **Step 3: Smoke-test**

Toggle dark mode in the running dev server. Confirm:
- Page background goes dark.
- Scrollbar styles change in Chromium browsers.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): dark body bg + scrollbar in globals.css"
```

---

## Phase B — Apply dark: variants to high-traffic surfaces

### Task B1: Header (if present)

**Files:**
- Modify: `src/components/Header.tsx` (only if file exists)

- [ ] **Step 1: Check whether Header.tsx exists**

Run: `ls src/components/Header.tsx 2>/dev/null`
Expected: file exists OR "No such file or directory".

If not present, **skip this task entirely**. If present, continue.

- [ ] **Step 2: Read Header to find every `bg-white`, `text-gray-*`, `border-gray-*`**

Run: `grep -n 'bg-white\|text-gray-\|border-gray-' src/components/Header.tsx`
Expected: list of lines that need `dark:` variants.

- [ ] **Step 3: Add `dark:` variants for each color class**

Pattern (apply throughout the file):
- `bg-white` → `bg-white dark:bg-gray-900`
- `text-gray-700` → `text-gray-700 dark:text-gray-200`
- `text-gray-600` → `text-gray-600 dark:text-gray-300`
- `text-gray-500` → `text-gray-500 dark:text-gray-400`
- `border-gray-200` → `border-gray-200 dark:border-gray-700`
- `border-gray-100` → `border-gray-100 dark:border-gray-800`
- `hover:bg-gray-50` / `hover:bg-gray-100` → add `dark:hover:bg-gray-800`

Keep `brand-*` colors unchanged — they read well on both backgrounds.

- [ ] **Step 4: Smoke-test in browser**

Toggle dark mode. Header should adapt.

- [ ] **Step 5: Run tests**

Run: `npx vitest run --reporter=basic`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(theme): dark variants in Header"
```

---

### Task B2: Navigation dark variants

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Apply the same pattern as B1**

Edit every color class in Navigation.tsx:
- `bg-white` (line 35) → `bg-white dark:bg-gray-900`
- `bg-white` (line 105 in mobile nav) → same
- `border-b border-gray-200` → add `dark:border-gray-700`
- `border-t border-gray-200` → add `dark:border-gray-700`
- `text-brand-primary` → keep (brand reads on both)
- `text-gray-600 hover:bg-gray-100` → `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`
- `active:bg-gray-100` (mobile) → add `dark:active:bg-gray-800`
- `bg-brand-light text-brand-primary` (active state) → keep (works in both, brand-light is the chosen accent)
- Logo container — `text-brand-primary` keep
- Streak badge `bg-orange-100` → add `dark:bg-orange-900/30`
- Streak badge `text-orange-700` → add `dark:text-orange-300`
- Streak badge `text-orange-600` → add `dark:text-orange-400`
- Profile avatar fallback `border-gray-200` → `dark:border-gray-700`
- Profile avatar hover `hover:bg-gray-100` → `dark:hover:bg-gray-800`
- "hidden lg:block text-sm font-medium text-gray-700" → add `dark:text-gray-200`

- [ ] **Step 2: Smoke-test**

Verify nav adapts in dark mode. Profile avatar fallback, streak badge, and active-state highlights all readable.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat(theme): dark variants in Navigation"
```

---

### Task B3: GoalCard dark variants

**Files:**
- Modify: `src/components/GoalCard.tsx`

- [ ] **Step 1: Find color classes**

Run: `grep -n 'bg-white\|bg-gray-\|text-gray-\|border-gray-\|bg-brand-light\|bg-red-\|bg-green-\|bg-orange-\|text-red-' src/components/GoalCard.tsx | head -60`
Expected: many matches.

- [ ] **Step 2: Apply mapping table**

For every match, add the dark variant. Use this mapping consistently:

| Light class | Dark variant to add |
|---|---|
| `bg-white` | `dark:bg-gray-900` |
| `bg-gray-50` | `dark:bg-gray-800` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `bg-brand-light` | `dark:bg-brand-dark/30` |
| `bg-brand-light/40` | `dark:bg-brand-dark/20` |
| `bg-brand-light/30` | `dark:bg-brand-dark/15` |
| `border-gray-100` | `dark:border-gray-800` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-300` | `dark:border-gray-600` |
| `border-brand-light` | `dark:border-brand-dark/50` |
| `text-gray-400` | `dark:text-gray-500` |
| `text-gray-500` | `dark:text-gray-400` |
| `text-gray-600` | `dark:text-gray-300` |
| `text-gray-700` | `dark:text-gray-200` |
| `text-gray-800` | `dark:text-gray-100` |
| `text-brand-primary` | unchanged |
| `text-brand-dark` | `dark:text-brand-light` |
| `bg-red-500` (action buttons) | unchanged |
| `bg-red-50` | `dark:bg-red-950/30` |
| `bg-green-50` | `dark:bg-green-950/30` |
| `text-red-500` | `dark:text-red-400` |
| `text-green-500` | `dark:text-green-400` |
| `bg-black/50` (modal backdrop) | unchanged |
| `hover:bg-gray-50` | `dark:hover:bg-gray-800` |
| `hover:bg-gray-100` | `dark:hover:bg-gray-800` |
| `hover:bg-white/50` | `dark:hover:bg-gray-700/50` |

Work through the file top-to-bottom in chunks of 50 lines. After each chunk, verify the diff visually.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/GoalCard.test.tsx --reporter=basic`
Expected: pass.

- [ ] **Step 4: Smoke-test all 5 tabs in dark mode**

Open `/`, expand a goal, switch between Phases/Tasks/Calendar/Analytics/Resources. All readable in both themes.

- [ ] **Step 5: Commit**

```bash
git add src/components/GoalCard.tsx
git commit -m "feat(theme): dark variants in GoalCard"
```

---

### Task B4: ChunkRow dark variants

**Files:**
- Modify: `src/components/prompts/ChunkRow.tsx`

- [ ] **Step 1: Apply the same mapping**

Run: `grep -n 'bg-\|text-gray-\|border-gray-' src/components/prompts/ChunkRow.tsx | head -40`
Then apply the mapping table from B3 to each match.

Specific spots to watch:
- The hover-actions row (`opacity-0 group-hover:opacity-100`) — keep
- The lock icons (`text-brand-primary`) — keep
- The base row (`bg-gray-50 border-gray-100 hover:bg-gray-100`) → `dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700`
- The edit-mode container (`bg-brand-light border-brand-light`) → `dark:bg-brand-dark/30 dark:border-brand-dark/50`
- Inputs (`border-gray-300`) → `dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100`

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/components/prompts/ChunkRow.test.tsx --reporter=basic`
Expected: pass.

- [ ] **Step 3: Smoke-test wallet in dark mode**

Open `/wallet`. Hover chunk rows. All actions visible. Edit a chunk inline — inputs readable.

- [ ] **Step 4: Commit**

```bash
git add src/components/prompts/ChunkRow.tsx
git commit -m "feat(theme): dark variants in ChunkRow"
```

---

### Task B5: WalletShell + WalletSidebar + WalletDetail dark variants

**Files:**
- Modify: `src/components/prompts/WalletShell.tsx`
- Modify: `src/components/prompts/WalletSidebar.tsx`
- Modify: `src/components/prompts/WalletDetail.tsx`

- [ ] **Step 1: Apply the mapping table to each file**

Same pattern as B3/B4. Specific spots:
- 3-pane grid container background (`bg-gray-50` etc.) → `dark:bg-gray-900`
- Sidebar `bg-white border-r border-gray-200` → `dark:bg-gray-900 dark:border-gray-700`
- Detail panel background → `dark:bg-gray-900`
- Empty-state hero text → `dark:text-gray-300`
- Seed-template buttons → use brand colors (already cross-theme) and `dark:hover:bg-brand-dark/30`

Do one file per commit so the diff stays readable.

- [ ] **Step 2: Test + smoke after each file**

After each file edited: `npx vitest run src/components/prompts/ --reporter=basic` + visual check at `/wallet`.

- [ ] **Step 3: Commit each file separately**

```bash
git add src/components/prompts/WalletShell.tsx
git commit -m "feat(theme): dark variants in WalletShell"

git add src/components/prompts/WalletSidebar.tsx
git commit -m "feat(theme): dark variants in WalletSidebar"

git add src/components/prompts/WalletDetail.tsx
git commit -m "feat(theme): dark variants in WalletDetail"
```

---

### Task B6: Add ThemeToggle to Profile page (mobile access)

**Files:**
- Modify: `src/app/profile/page.tsx` (or whichever profile component handles the layout)

- [ ] **Step 1: Locate profile page**

Run: `ls src/app/profile/ && grep -l 'EmailPreferencesPanel\|profile' src/app/profile/*.tsx`
Expected: file paths.

- [ ] **Step 2: Add a "Theme" section**

Near the existing preferences sections (timezone, email prefs), add:

```tsx
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

// Inside the component JSX:
<section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Theme</h2>
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
    Switch between light, dark, and system theme.
  </p>
  <div className="flex items-center gap-3">
    <ThemeToggle />
    <span className="text-sm text-gray-600 dark:text-gray-300" data-testid="current-theme">
      Current: <strong>{useTheme().theme}</strong>
    </span>
  </div>
</section>
```

If the profile page is a server component, move the section to a small client child component (e.g. `ThemePreferencesPanel.tsx`).

- [ ] **Step 3: Smoke-test**

On mobile width, open `/profile`. Theme section visible. Toggle works.

- [ ] **Step 4: Commit**

```bash
git add src/app/profile src/components/theme
git commit -m "feat(theme): expose theme toggle on profile page"
```

---

### Task B7: Final test + build verification

- [ ] **Step 1: Run the entire test suite**

Run: `npx vitest run --reporter=basic`
Expected: all tests pass. Memory baseline is 1290+ tests.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: pass.

---

### Task B8: BMAD docs

**Files:**
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Modify: `_bmad-output/project-context.md`

- [ ] **Step 1: Append sprint-status entry**

```yaml
- date: 2026-05-10
  feature: dark-mode-toggle
  status: complete
  summary: Light/dark/system theme toggle (Phase A+B). Tailwind class-based dark mode, localStorage + system listener, pre-hydration script. Applied to root, nav, GoalCard, ChunkRow, WalletShell/Sidebar/Detail.
  artifacts:
    - tailwind.config.ts
    - src/components/theme/
    - src/app/layout.tsx
    - src/app/globals.css
    - src/components/AppShell.tsx
    - src/components/Navigation.tsx
    - src/components/GoalCard.tsx
    - src/components/prompts/*.tsx
    - src/app/profile
  deferred:
    - Phase C — apply dark: variants to remaining surfaces (chat widget, feed, kanban, friends, templates, marketplace, modals, etc.) in a future plan.
```

- [ ] **Step 2: Append a paragraph to project-context.md**

Under an appropriate section (or create a "Theme" heading), add:

```markdown
### Theme

Theme is managed by `ThemeProvider` in `src/components/theme/`. Tailwind uses `darkMode: "class"`. The resolved class (`light`|`dark`) is applied to `<html>` by a pre-hydration script (`src/components/theme/themeScript.ts`) injected in `src/app/layout.tsx`, then kept in sync by the `useEffect` hooks in the provider. Preference persists in `localStorage["theme"]`; `system` follows `prefers-color-scheme` reactively. The `<ThemeToggle>` button is mounted in the desktop nav and the profile page.

Phase A+B (May 10, 2026) wired infrastructure and applied `dark:` variants to Navigation, GoalCard, ChunkRow, and the Wallet surfaces. Phase C — remaining surfaces — is tracked as a future plan.
```

- [ ] **Step 3: Commit**

```bash
git add _bmad-output
git commit -m "docs(bmad): record dark-mode Phase A+B in sprint status and project context"
```

---

## Self-Review Checklist

- ✅ Spec coverage: Phase A (infra) + Phase B (high-traffic surfaces) covered. Phase C explicitly deferred.
- ✅ Pre-hydration script prevents white-flash.
- ✅ ThemeProvider has unit tests covering default, stored, set, system, cycle, fallback.
- ✅ ThemeToggle cycles light/dark/system.
- ✅ Mapping table reused across B3-B5 keeps color choices consistent.
- ✅ TaskA9 + B8 update BMAD docs.
- ✅ No placeholders — every step has runnable code or commands.
- ✅ Each task commits independently so revert is granular.

## Risks

- **suppressHydrationWarning side effect**: It only suppresses warnings on the `<html>` element. If layout.tsx has other tags with mismatched server/client content, those warnings still surface — which is desired.
- **`useTheme` outside provider**: returns safe defaults, so unit tests don't need to add a provider. Document this contract in the provider file.
- **Brand colors on dark surfaces**: `brand-primary` (#5B50E8) reads well on both light gray-50 and dark gray-900. If review flags low contrast on dark, fall back to `brand-secondary` (#7B6FFF) which is lighter.
- **Mobile nav has no ThemeToggle**: mobile users change theme via profile. If that's clunky, follow-up plan: add a fold-out menu in mobile bottom-nav.
- **Storybook/visual regression**: this repo doesn't use Storybook; visual diffs are manual. Document any color choices in `project-context.md` so future contributors maintain consistency.
- **Phase C work is large**: the chat widget, feed, kanban, friends, templates, marketplace, share modals, and email-preferences panel all need passes. Track explicitly in `_bmad-output/implementation-artifacts/sprint-status.yaml` under `deferred:`.
