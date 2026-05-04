# Prompts Wallet — Step 5: Leaf Components

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Sections 4 + 5 + 6)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step5-leaf-components`
> **Estimated session length:** large (3–4h)
> **Depends on:** Step 4 (slices + helpers)
> **Unblocks:** Step 6 (containers consume these)

---

## Goal

Build the three leaf components: `ChunkRow`, `ComposeChunkRow`, `MergedPreview`. After this step, you can render them in isolation (Storybook-style test fixtures) and confirm copy / drag / edit / lock / duplicate / append-to-compose all work against fake props.

**Reference reads:** `src/components/SubstepCard.tsx` (the canonical pattern), `src/components/TaskMiniCard.tsx` (for the inline edit + lock cycle wiring).

---

## Component briefs

### `src/components/prompts/ChunkRow.tsx`

Props:
```ts
interface ChunkRowProps {
  chunk: PromptChunk;
  isInCompose: boolean;
  onUpdate: (patch: Partial<PromptChunk>) => void;          // hits useUpdateChunkMutation in container
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateLock: (lockLevel: LockLevel) => void;
  onRestore: () => void;
  onAddToCompose: () => void;
  onRemoveFromCompose: () => void;
}
```

Behaviour:
- Renders compact row exactly like `SubstepCard`: drag handle (left, hover-only), title, hover-actions on right.
- Hover actions, in order: copy 📋, ➕ append-to-compose (filled-check when `isInCompose`), ✎ edit, 🔒 lock, 🗐 duplicate, ✕ delete.
- Copy button copies `chunk.content` (NOT title) to clipboard with 1.5s checkmark feedback. Fallback to `document.execCommand('copy')` if clipboard API throws.
- Edit mode: row expands inline to title input + content textarea (auto-size) + Save/Cancel. Auto-save on blur with 600ms debounce calling `onUpdate`.
- Lock cycle reuses `cycleLock`/`getLockLevel` from `lockGuards`.
- Delete shows undo toast via `useUndoToast()`.
- `useSortable({ id: chunk.id })` wired with the same `style`/`isDragging` opacity treatment as `SubstepCard`.
- Lock badges (gray soft, brand-primary hard) — same SVG path as `SubstepCard`.

### `src/components/prompts/ComposeChunkRow.tsx`

Props:
```ts
interface ComposeChunkRowProps {
  chunk: PromptChunk;       // joined from RTK Query cache
  included: boolean;
  onToggleInclude: () => void;
  onRemove: () => void;     // remove from compose (not delete)
}
```

Behaviour:
- Compact sortable row inside the Compose drawer: drag handle, checkbox (controls `included`), title, ✕ remove.
- No edit / lock / delete from this row — those live on the source `ChunkRow`.
- Greyed when `included === false`.

### `src/components/prompts/MergedPreview.tsx`

Props:
```ts
interface MergedPreviewProps {
  text: string;             // pre-merged via mergeChunks(includedChunks)
  onCopy: () => void;
}
```

Behaviour:
- Read-only `<textarea>` (monospace, ~12 rows visible, scrolls).
- Below: `Copy Merged` button with 1.5s checkmark feedback.
- Token-count line: `≈ ${Math.ceil(text.length / 4)} tokens` (rough).
- Disabled state when `text.length === 0`.

---

## Steps

1. Read `src/components/SubstepCard.tsx` end-to-end. Note the structure: edit mode block, view mode block, hover actions, lock badge, drag handle.
2. Build `ChunkRow.tsx` by adapting `SubstepCard.tsx`. **Don't import** `SubstepCard` — we're not abstracting; we're cloning the pattern.
3. Build `ComposeChunkRow.tsx` (much smaller).
4. Build `MergedPreview.tsx`.
5. Co-locate tests using the canonical mocks (per MEMORY.md):
   ```ts
   vi.mock('@/components/undo/UndoToastProvider', () => ({ useUndoToast: () => ({ showUndoToast: vi.fn() }), UndoToastProvider: ({ children }) => <>{children}</> }));
   vi.mock('@dnd-kit/sortable', () => ({ useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: null, isDragging: false }), SortableContext: ({ children }) => <>{children}</>, verticalListSortingStrategy: 'vertical', sortableKeyboardCoordinates: () => null }));
   ```
6. Per-component test cases:
   - `ChunkRow` — render, hover-action-clicks (copy, edit, lock cycle, duplicate, delete, append-to-compose, remove-from-compose), edit-mode save/cancel, soft+hard lock disables correct actions, drag handle present.
   - `ComposeChunkRow` — render, toggle-include, remove, greyed when not included.
   - `MergedPreview` — text rendered, copy button writes text, token count math, disabled when empty.
7. `npm run lint` + `npm run test`.
8. Commit `feat(prompts-wallet/step5): leaf components + tests`.

---

## React Best Practices Reminder (per `vercel:react-best-practices` skill)

- All components are `"use client"` — they use hooks.
- No `useEffect` for derived state — derive directly in render.
- Stable refs for callbacks where they cross memoization boundaries (e.g., `useCallback` on the auto-save debounce trigger).
- Accessible names on every icon button (`aria-label` or `title`).

When editing TSX in this step, **invoke the `react-best-practices` skill** for the auto-suggested checklist.

---

## Verification Checklist

- [ ] `ChunkRow.test.tsx` covers ≥10 cases
- [ ] `ComposeChunkRow.test.tsx` covers ≥4 cases
- [ ] `MergedPreview.test.tsx` covers ≥4 cases
- [ ] No console output during tests (warnings are tracked)
- [ ] `npm run lint` clean — accessible names present
- [ ] `npm run build` succeeds
- [ ] Coverage holds ≥80%

## Out of Scope

- Wiring components into the page (Step 7)
- The container/parent components (Step 6)

## Tracker

Tick row #5 → ✅ Done.
