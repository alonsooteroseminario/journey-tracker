# Prompts Wallet — Step 6: Container Components

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Sections 4 + 5 + 6)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step6-container-components`
> **Estimated session length:** large (3–4h)
> **Depends on:** Step 5 (leaf components)
> **Unblocks:** Step 7 (page assembly)

---

## Goal

Build the four containers: `GroupCard`, `ComposeDrawer`, `WalletDetail`, `WalletHeader`. These wire the leaf components from Step 5 to the slices from Step 4 and own most of the state-management code.

---

## Component briefs

### `src/components/prompts/GroupCard.tsx`

Mirror `TaskMiniCard.tsx` for: drag handle, expand/collapse chevron, hover actions (copy-merged-of-this-group, edit, lock, duplicate, delete), nested `DndContext` for chunk reorder, "Add chunk" inline form.

Props:
```ts
interface GroupCardProps {
  group: PromptGroup;
}
```
(All callbacks are derived inside the component using RTK Query hooks — Step 5 components got prop callbacks because they're presentational; this one isn't.)

Inside:
- `useUpdateGroupMutation`, `useDeleteGroupMutation`, `useDuplicateGroupMutation`, `useCreateChunkMutation`, `useUpdateChunkMutation`, `useDeleteChunkMutation`, `useDuplicateChunkMutation`, `useReorderChunksMutation`, `useRestoreChunkMutation`, `useRestoreGroupMutation`.
- `useDispatch` + `composeSlice.actions.replaceWithGroup` / `appendGroup` for the Group-as-recipe click.
- Group click behaviour:
  - If Compose is empty → `replaceWithGroup`
  - If Compose has items → small modal: Replace / Append / Cancel.
- Copy-merged-of-this-group button copies `mergeChunks(group.chunks)` to clipboard.

### `src/components/prompts/ComposeDrawer.tsx`

Renders:
- Header: `Compose (N chunks)` · `Clear` · `Copy Merged` (primary, top-right or bottom — match design doc)
- Sortable list of `ComposeChunkRow` (using `composedChunks` selector)
- `MergedPreview` below

Wires:
- `useListWalletsQuery` to source the chunk data
- `composeSlice` selectors and actions
- `useReorderChunksMutation` is NOT used here (compose order is client-only) — instead update `composeSlice` directly on `onDragEnd`.

### `src/components/prompts/WalletDetail.tsx`

Props:
```ts
interface WalletDetailProps {
  wallet: PromptWallet;
}
```

Renders:
- `WalletHeader` (title + icon + description, inline-editable)
- Sortable list of `GroupCard` (drag-reorder via `useReorderGroupsMutation`)
- `Add Group` inline form

### `src/components/prompts/WalletHeader.tsx`

Inline-editable title (click to edit, blur to save), emoji icon picker, description textarea. Auto-save on blur.

---

## Steps

1. Read `src/components/TaskMiniCard.tsx` end-to-end (the canonical pattern for the GroupCard).
2. Read `src/components/GoalCard.tsx` for inline-edit patterns relevant to `WalletHeader`.
3. Build `WalletHeader.tsx` first (smallest).
4. Build `GroupCard.tsx` (largest of this step).
5. Build `ComposeDrawer.tsx`.
6. Build `WalletDetail.tsx` (mostly assembly).
7. Co-located tests for each. Mock RTK Query hooks per MEMORY.md pattern.
   ```ts
   vi.mock('@/store/slices/promptsSlice', () => ({
     useUpdateChunkMutation: () => [vi.fn(), { isLoading: false }],
     useDeleteChunkMutation: () => [vi.fn(), { isLoading: false }],
     // ... etc ...
   }));
   ```
8. Test cases per container:
   - `WalletHeader` — render, click-to-edit, blur-saves, emoji picker round-trip (or skip emoji UI if matching existing GoalCard pattern wholesale).
   - `GroupCard` — render, expand/collapse, add-chunk inline form, click-group-replaces-compose, click-group-with-non-empty-compose-shows-dialog, drag-reorder fires reorder mutation, copy-merged copies expected text, lock cycle, delete + undo.
   - `ComposeDrawer` — render with N composed chunks, toggle-include, drag-reorder, copy-merged button, clear button, empty-state.
   - `WalletDetail` — render groups, add-group form, drag-reorder fires reorder mutation.
9. `npm run lint` + `npm run test`.
10. Commit `feat(prompts-wallet/step6): container components + tests`.

---

## Verification Checklist

- [ ] All 4 containers tested with realistic mocks
- [ ] Group-as-recipe Replace/Append dialog works
- [ ] Compose drawer drag-reorder updates `composeSlice` not the server
- [ ] Auto-save on inline edits hits `useUpdateGroupMutation` / `useUpdateChunkMutation`
- [ ] No console errors / warnings during tests
- [ ] Coverage holds ≥80%

## Out of Scope

- Top-level `WalletShell`, `WalletSidebar`, `WalletRow`, `/wallet` page (Step 7)
- E2E + seeds (Step 8)

## Tracker

Tick row #6 → ✅ Done.
