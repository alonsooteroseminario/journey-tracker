# Step 2 — UndoToastProvider (UI infra)

**Depends on:** Step 1 (only for type imports; no behavioral dep)
**Unblocks:** Steps 3, 4, 5
**Estimated session size:** medium

## Goal

Build the toast UI + React Context provider. Mount it in `AppShell`. No consumers in this step — Steps 3, 4, 5 will wire it up.

## Files to touch

| File | Action |
|---|---|
| `src/components/undo/UndoToastProvider.tsx` | new |
| `src/components/undo/UndoToastProvider.test.tsx` | new |
| `src/components/AppShell.tsx` | edit — wrap children with provider |

## API to expose

```ts
// src/components/undo/UndoToastProvider.tsx
interface ShowUndoToastArgs {
  message: string;        // e.g. "Task \"Foo\" deleted"
  onUndo: () => void;     // restoring callback
  durationMs?: number;    // default 6000
}

interface UndoToastContextValue {
  showUndoToast: (args: ShowUndoToastArgs) => void;
}

export function UndoToastProvider({ children }: { children: ReactNode }): JSX.Element;
export function useUndoToast(): UndoToastContextValue;
```

## TODOs

1. Create `src/components/undo/UndoToastProvider.tsx`:
   - Internal state: `currentToast: { message, onUndo, expiresAt } | null`
   - On `showUndoToast`: if a previous toast exists, drop its snapshot (it auto-commits) and replace.
   - Timer: `setTimeout` for `durationMs`. On expiry, set `currentToast` to `null`.
   - Hover-pause: `onMouseEnter` clears the timer; `onMouseLeave` restarts from remaining time.
   - Click `[Undo]`: call `onUndo()`, clear toast.
   - `Esc` key while toast focused: dismiss without undoing.

2. UI styling (Tailwind, brand-aligned):
   - Fixed bottom-center, z-50, slide-up via `translate-y` + `transition`.
   - Dark bg (`bg-gray-900`), white text, brand-primary undo button.
   - Thin progress bar at bottom showing remaining time.
   - `role="alert"` `aria-live="polite"`.
   - Respect `prefers-reduced-motion`: skip slide animation.

3. Edit `src/components/AppShell.tsx` — wrap the existing children + ChatWidget tree with `<UndoToastProvider>`. Order: ReduxProvider → AutoMigration → UndoToastProvider → children. (Provider sits inside Redux so consumers can dispatch from undo callbacks.)

4. Tests in `UndoToastProvider.test.tsx`:
   - Renders nothing when no toast active.
   - `showUndoToast` shows the toast with the message.
   - Clicking `[Undo]` calls the `onUndo` callback and dismisses the toast.
   - Auto-dismisses after `durationMs` (use `vi.useFakeTimers()`).
   - Hovering pauses timer (advance time, hover, advance more, assert still visible).
   - Calling `showUndoToast` while one is active replaces it (previous `onUndo` is NOT called).
   - `Esc` dismisses without calling `onUndo`.
   - `useUndoToast()` outside provider throws helpful error.

## Acceptance criteria

- `npm run lint` clean.
- `npm run test src/components/undo` — all pass.
- `npm run test` full suite still passes (no consumer changes yet).
- Manual smoke: start `npm run dev`, open the app, verify no visual regression (toast is invisible until called).

## Test commands

```bash
npm run lint
npm run test src/components/undo
npm run test
npm run dev   # smoke check; no visual changes expected
```

## Notes for next session

- `useUndoToast` is now importable from `@/components/undo/UndoToastProvider`.
- Steps 3 and 4 are the first consumers.
- Update INDEX.md status row.
