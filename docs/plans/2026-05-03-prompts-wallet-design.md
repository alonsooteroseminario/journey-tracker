# Prompts Wallet — Design Doc

> **Date:** 2026-05-03
> **Status:** 🟡 Awaiting user approval, then break into per-step plans
> **Companion:** `2026-05-03-prompts-wallet-INDEX.md` (tracks step-by-step execution)
> **Related plans:** `2026-05-03-lock-undo-copy-design.md` (locks/undo/copy infra reused here)

---

## 1 · Summary & Value Prop

**Prompts Wallet** is a 3-tier reusable text-snippet manager living at `/wallet`:

```
PromptWallet  (e.g. "Coding Prompts")
  └── PromptGroup  (e.g. "System role")
        └── PromptChunk  (the actual text — the leaf, the thing you copy)
```

Optimized for two flows:
1. **One-click copy** of any chunk's content to the clipboard.
2. **One-click "stitch a Group's chunks into a final prompt"** in a sticky right-pane Compose drawer, with chunk toggle/reorder, then `Copy Merged`.

It mirrors the existing **Goal/Task/Substep** UI primitives (`SubstepCard`, `TaskMiniCard`, `GoalCard`) — compact rows with hover-actions (copy/edit/lock/delete/duplicate), drag handles, lock badges, undo toasts — and reuses the existing auth, Redux/RTK Query, `@dnd-kit`, `lockGuards`, and `UndoToastProvider` infrastructure.

### MVP Success Criteria

A user can:
1. Create Wallet → Group → Chunk in under 30 seconds.
2. Click any Chunk's copy icon and have its content on the clipboard in <500ms with a checkmark confirmation.
3. Click a Group → Compose drawer opens with all its Chunks pre-stitched in order. Toggle off any chunk, drag-reorder, then `Copy Merged`.
4. Reload the page mid-edit and see all changes persisted (auto-save: 600ms debounce + on blur).
5. Delete any Chunk/Group/Wallet, see the 6s undo toast, and restore.
6. Lock any entity (soft = warning, hard = blocked) using the existing `lockGuards` infra.
7. Duplicate any Chunk, Group, or whole Wallet with one click.

### Non-Goals (MVP)

- Variables / `{{placeholders}}` templating
- Search / Cmd-K
- MCP agent tools (CRUD on prompts via the in-app AI agent)
- Tags / multi-axis filtering
- Cross-group drag, cross-wallet drag
- Sharing / public templates / marketplace integration
- Version history
- Per-Group separator override (hard-coded `\n\n`)
- Compose-state persistence (Compose lives in client Redux only)

These all live in **Phase 2** — the data model is designed not to box them out.

---

## 2 · Data Model

Append to `prisma/schema.prisma`. Also add `promptWallets PromptWallet[]` to the `User` relations block.

```prisma
model PromptWallet {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  userId      String        @db.ObjectId
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  title       String
  icon        String?       // emoji
  description String?
  order       Int           @default(0)
  lockLevel   String?       // null | "soft" | "hard"

  groups      PromptGroup[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([userId])
  @@map("prompt_wallets")
}

model PromptGroup {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  walletId    String        @db.ObjectId
  wallet      PromptWallet  @relation(fields: [walletId], references: [id], onDelete: Cascade)

  title       String
  description String?
  order       Int           @default(0)
  lockLevel   String?

  chunks      PromptChunk[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([walletId])
  @@map("prompt_groups")
}

model PromptChunk {
  id        String       @id @default(auto()) @map("_id") @db.ObjectId
  groupId   String       @db.ObjectId
  group     PromptGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)

  title     String       // short label visible on the row
  content   String       // the actual prompt text (the thing copied / merged)
  order     Int          @default(0)
  lockLevel String?

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([groupId])
  @@map("prompt_chunks")
}
```

### TypeScript types — added to `src/types.ts`

```ts
export type LockLevel = 'soft' | 'hard' | null;

export interface PromptChunk {
  id: string;
  groupId: string;
  title: string;
  content: string;
  order: number;
  lockLevel?: LockLevel;
  createdAt: string;
  updatedAt: string;
}

export interface PromptGroup {
  id: string;
  walletId: string;
  title: string;
  description?: string;
  order: number;
  lockLevel?: LockLevel;
  chunks: PromptChunk[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptWallet {
  id: string;
  userId: string;
  title: string;
  icon?: string;
  description?: string;
  order: number;
  lockLevel?: LockLevel;
  groups: PromptGroup[];
  createdAt: string;
  updatedAt: string;
}
```

### Why three Prisma models (vs JSON-blob like `Goal.tasks`)

| Concern | Three models (chosen) | JSON blob |
|---|---|---|
| Auto-save granularity | Per-chunk `update` — small payload | Whole-wallet read-modify-write per keystroke |
| Concurrent-edit risk | Per-row writes | Cross-tab corruption (known papermark on `Goal.tasks`) |
| Search / agent tools (Phase 2) | Cheap to add | Have to pull whole wallet client-side |
| Document size | Unbounded chunks possible | Hits 16MB limit eventually |
| Familiarity for repo | New pattern (acceptable) | Matches existing `Goal.tasks` |

The whole feature is *fast, frequent text edits* — the workload that punishes JSON-blobs. CLAUDE.md already calls `Goal.tasks` "the trickiest part of the data model"; we don't repeat that.

### Lock-level reuse

`src/lib/locks/lockGuards.ts` only inspects `.lockLevel` — it's entity-agnostic. `canEdit/canDelete/canAddChild/canReorder/cycleLock/getLockLevel` work on a `PromptChunk`/`PromptGroup`/`PromptWallet` as-is.

---

## 3 · Routes & API Surface

### Page route
- `GET /wallet` — sole new page. Server component: auth check, pre-fetch user's wallets via Prisma. Client takes over for everything else.

### REST endpoints

Each follows the existing repo pattern: `auth()` → `getCurrentUser()` → ownership check → Prisma → JSON.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/prompt-wallets` | List user's wallets (groups + chunks, ordered) |
| `POST` | `/api/prompt-wallets` | Create wallet |
| `PATCH` | `/api/prompt-wallets/[id]` | Update fields (`title/icon/description/order/lockLevel`) |
| `DELETE` | `/api/prompt-wallets/[id]` | Delete (cascade groups + chunks) |
| `POST` | `/api/prompt-wallets/[id]/duplicate` | Deep-copy wallet + groups + chunks |
| `POST` | `/api/prompt-wallets/reorder` | Body: `{ orderedIds }` — reorder this user's wallets |
| `POST` | `/api/prompt-wallets/restore` | Body: full wallet snapshot — undo support |
| `POST` | `/api/prompt-groups` | Create `{ walletId, title, description? }` |
| `PATCH` | `/api/prompt-groups/[id]` | Update fields |
| `DELETE` | `/api/prompt-groups/[id]` | Delete (cascade chunks) |
| `POST` | `/api/prompt-groups/[id]/duplicate` | Deep-copy group + chunks |
| `POST` | `/api/prompt-groups/reorder` | Body: `{ walletId, orderedIds }` |
| `POST` | `/api/prompt-groups/restore` | Body: group snapshot |
| `POST` | `/api/prompt-chunks` | Create `{ groupId, title, content }` |
| `PATCH` | `/api/prompt-chunks/[id]` | Update — **the auto-save target** |
| `DELETE` | `/api/prompt-chunks/[id]` | Delete |
| `POST` | `/api/prompt-chunks/[id]/duplicate` | Same group, appended |
| `POST` | `/api/prompt-chunks/reorder` | Body: `{ groupId, orderedIds }` |
| `POST` | `/api/prompt-chunks/restore` | Body: chunk snapshot |

### Why these patterns

- **Three `restore` endpoints:** rows were deleted, so undo must INSERT. The undo toast keeps the snapshot in memory and POSTs it back.
- **`/duplicate` server-side:** atomic, single round-trip, server assigns IDs and `order`. Mirrors existing template-fork.
- **Reorder = single `POST … /reorder`:** one transaction reorders all siblings. Mirrors the existing template/group reorder behaviour.

### Ownership helper — `src/lib/prompts/ownership.ts`

```ts
// All three throw a tagged 404 on miss / not-owned. Single Prisma query each.
async function assertChunkOwnership(chunkId: string, userId: string): Promise<void>
async function assertGroupOwnership(groupId: string, userId: string): Promise<void>
async function assertWalletOwnership(walletId: string, userId: string): Promise<void>
```

### Redux slices — `src/store/slices/`

- `promptsSlice.ts` — RTK Query API. Tags: `'PromptWallet' | 'PromptGroup' | 'PromptChunk'`. Hooks generated for every endpoint above.
- `composeSlice.ts` — plain Redux slice. Holds `composedChunkRefs: { chunkId, sessionOrder, included }[]`. Never persisted.

---

## 4 · Component Tree

```
src/app/wallet/page.tsx                          ← server component, auth + initial fetch
└── WalletShell (client)                         ← 3-pane layout, owns selected-wallet/group state
    ├── WalletSidebar                            ← left pane: list of Wallets
    │   ├── WalletRow (× N)                      ← drag handle, icon, title, hover-actions edit/lock/duplicate/delete
    │   └── AddWalletButton
    │
    ├── WalletDetail                             ← middle pane: selected wallet's groups + chunks
    │   ├── WalletHeader                         ← inline-editable title/icon/description
    │   ├── GroupCard (× N)                      ← TaskMiniCard pattern: drag, expand, copy-merged, edit, lock, duplicate, delete
    │   │   └── ChunkRow (× M, expanded only)    ← SubstepCard pattern: drag, copy, inline edit, lock, duplicate, delete, "Add to Compose" (➕)
    │   └── AddGroupButton
    │
    └── ComposeDrawer                            ← right pane, sticky
        ├── ComposeHeader                        ← Clear · Copy Merged
        ├── ComposeChunkRow (× K)                ← drag, include checkbox, remove (×)
        └── MergedPreview                        ← read-only joined output (\n\n separator)
```

### Reuse philosophy

`ChunkRow`, `GroupCard`, `WalletRow` are structurally similar to `SubstepCard`/`TaskMiniCard`/`GoalCard` but **bound to different shapes** (no status/cost/notes/streaks). Rather than abstract a shared base — which would couple goals + prompts and constrain future evolution of either — we **build fresh components in `src/components/prompts/`** that copy the patterns. Acceptable, well-scoped duplication.

### Shared / reused (no new code)

- `src/lib/locks/lockGuards.ts`
- `src/components/undo/UndoToastProvider.tsx` + `useUndoToast()`
- `@dnd-kit/core` + `@dnd-kit/sortable` setup (same `useSortable` calls, vertical strategy, PointerSensor + KeyboardSensor)
- Auth: `auth()` + `getCurrentUser()`
- Redux store + RTK Query base config

### New helper

- `src/lib/prompts/mergeChunks.ts` — `mergeChunks(chunks: PromptChunk[]): string` — joins `chunk.content` with `\n\n` in array order. Unit-tested.

### File layout (all new)

```
src/app/wallet/page.tsx
src/app/api/prompt-wallets/route.ts                        # GET, POST
src/app/api/prompt-wallets/[id]/route.ts                   # PATCH, DELETE
src/app/api/prompt-wallets/[id]/duplicate/route.ts
src/app/api/prompt-wallets/reorder/route.ts
src/app/api/prompt-wallets/restore/route.ts
src/app/api/prompt-groups/...                              # mirror layout
src/app/api/prompt-chunks/...                              # mirror layout
src/components/prompts/WalletShell.tsx
src/components/prompts/WalletSidebar.tsx
src/components/prompts/WalletRow.tsx
src/components/prompts/WalletDetail.tsx
src/components/prompts/WalletHeader.tsx
src/components/prompts/GroupCard.tsx
src/components/prompts/ChunkRow.tsx
src/components/prompts/ComposeDrawer.tsx
src/components/prompts/ComposeChunkRow.tsx
src/components/prompts/MergedPreview.tsx
src/lib/prompts/ownership.ts
src/lib/prompts/mergeChunks.ts
src/store/slices/promptsSlice.ts
src/store/slices/composeSlice.ts
+ co-located *.test.ts(x) for every component & util
e2e/wallet.spec.ts
```

---

## 5 · UX Flow

### Desktop layout (`/wallet`, ≥768px)

```
┌──────────────────────────────────────────────────────────────┐
│ Header (existing)                                            │
├──────────┬─────────────────────────────────────┬─────────────┤
│ Wallets  │ Selected Wallet: 🧠 Coding Prompts  │ Compose     │
│          │ ─────────────────────────────────── │ ─────────── │
│ 🧠 Code  │ ▾ System role (3 chunks)            │ [chunks in  │
│ ✉  Email │   • You are a senior Python …  ⋯ ➕ │  compose]   │
│ 📣 Mktg  │   • Always cite sources …      ⋯ ➕ │             │
│   + New  │ ▸ Code review (5 chunks)            │ ─────────── │
│          │ ▸ Refactor (2 chunks)               │ Merged:     │
│          │   + Add Group                       │ <preview>   │
│          │                                     │ [Copy] [✕]  │
└──────────┴─────────────────────────────────────┴─────────────┘
```

### Mobile (<768px)

Single-pane stack with bottom-tab `Wallets / Detail / Compose`. Same idea as the existing chat split-view's narrow mode — confirm exact pattern during implementation.

### Key flows

1. **Create chunk fast** — Inline "Add chunk" row at the bottom of an expanded Group. Type title → Tab to content textarea → Enter to save. Auto-save on blur.

2. **Copy single chunk** — Hover row → click 📋 → 1.5s green checkmark. Clipboard receives `chunk.content` (NOT title).

3. **Click-to-append (➕)** — Hover row → click ➕ → chunk appears at the bottom of the Compose drawer. ➕ flashes green for 800ms. If chunk is already in Compose, ➕ is a filled checkmark; clicking removes it from Compose.

4. **Group-as-recipe** — Each Group's header has a dedicated **Compose-all** icon button (🔀 or stack icon) sitting next to the expand/collapse chevron. Clicking it sends all that Group's chunks to Compose. **Title click is reserved for inline rename** (matches the GoalCard pattern). If Compose is non-empty, a small dialog appears: `Replace Compose with this group's chunks?` [Replace] [Append] [Cancel]. Empty Compose ⇒ skip the dialog and replace directly.

5. **Compose drawer** — Each composed chunk = sortable row with: drag handle, title (read-only), include checkbox (default on), remove (×). Below: live merged preview (read-only `<textarea>`, monospace). Below that: `Copy Merged` (primary), `Clear` (secondary). Token-count display under preview (`≈ Math.ceil(chars / 4)` tokens).

6. **Edit chunk inline** — Click ✎ → row expands: title input + content textarea (autosize) + Save / Cancel. Auto-save also fires on blur of either field with 600ms debounce. Last-write-wins.

7. **Duplicate** — Hover row → 🗐 icon. Inserts new row right after source with `title = "<source> (copy)"`, identical `content`, `lockLevel: null`. Optimistic insert.

8. **Delete + Undo** — Existing `useUndoToast()`. 6s window. Toast `Chunk "X" deleted` + Undo. Undo POSTs the snapshot to `/restore` which re-creates the row.

9. **Lock cycling** — Lock icon cycles `null → soft → hard → null`. Hard disables edit/delete/reorder/duplicate UI per `lockGuards`. Visual: same gray (soft) / brand-primary (hard) badges as substeps.

10. **Empty states**
    - No wallets: hero CTA "Create your first wallet" + 3 example seed buttons (`Coding Prompts`, `Email Templates`, `Marketing Copy`) that one-click-seed a starter structure.
    - No groups in selected wallet: "Create a group to start adding prompts."
    - No chunks in expanded group: "Add a chunk."
    - No items in Compose: "Add chunks here to build your final prompt."

---

## 6 · Auto-save · Undo · Lock Semantics

### Auto-save

- Inline edits debounce **600ms** after last keystroke; save fires on blur immediately.
- Optimistic update: RTK Query patches the cache on save start; rollback on server error with toast `Failed to save — retrying` (auto-retry once, then surface a manual "Retry").
- Reorder operations are **not** debounced — fire immediately on dnd `onDragEnd`.
- **Concurrent-edit safety is out of scope for MVP** (single-user app, low contention). Phase 2 will add `If-Match: <updatedAt>` for optimistic concurrency.

### Undo

- Wallet/Group/Chunk delete each show their own undo toast referencing the entity title.
- Toast holds the full snapshot in memory:
  - Wallet snapshot includes its groups + chunks
  - Group snapshot includes its chunks
  - Chunk snapshot is just the chunk
- Restore POST re-creates the tree with **new IDs**, identical `title/content/order/lockLevel/description/icon`.
- Compose drawer entries that referenced the deleted chunk get auto-removed when the chunk disappears (subscribed via RTK Query); on restore, they are NOT auto-re-added (user can re-append).
- Toast dismisses on Esc, click-outside, or 6s; hover pauses timer.

### Locks (reusing `lockGuards.ts` unchanged)

- `null` (default) — full edit/delete/reorder/duplicate.
- `soft` — UI shows lock badge, edit/delete still work but with confirmation modal (`This is soft-locked. Continue?`).
- `hard` — edit/delete/reorder/add-child buttons all disabled + greyed.
- **Duplicate is always allowed**, even on hard-locked entities. The duplicate is created with `lockLevel: null`.
- MCP agent tools also block on hard lock — agent tools are Phase 2 here, so no extra work in MVP.

---

## 7 · Edge Cases & Errors

| Case | Behaviour |
|---|---|
| Network error on auto-save | Optimistic rollback + retry-once silently; on second failure, toast `Save failed — your edit isn't synced` + manual Retry button. |
| Clipboard API blocked (insecure context, denied) | Fallback `document.execCommand('copy')` via hidden textarea. Toast `Copied (fallback)`. |
| `content` very large (>50k chars) | Soft warning under textarea: `Large prompts copy slower`. No hard limit in MVP. |
| MongoDB doc-size | Not relevant — each chunk is its own row. |
| Duplicate of hard-locked entity | Allowed; the copy has `lockLevel: null`. |
| Restore after parent already deleted | Restore endpoint validates parent exists; on miss, returns 404 + toast `Can't undo — parent group was also deleted`. |
| Compose contains a chunk that gets deleted | Compose drawer removes it; toast `Chunk "X" was removed from Compose`. |
| Compose contains a chunk whose content was just edited | Live re-render via RTK Query cache. |
| Zero-state on `/wallet` | Empty-state hero with "Create your first wallet" + 3 seed templates. |
| Multi-tab editing same chunk | Last-write-wins (Phase 2 problem). |
| Drag chunk dropped on invalid target | dnd-kit collision detection prevents this; `onDragEnd` no-op. |
| Compose `Copy Merged` when Compose is empty | Button disabled. |

---

## 8 · Test Strategy

### Unit (Vitest, co-located `*.test.ts(x)`)

- `mergeChunks.test.ts` — joins, empty input, ordering, single-chunk.
- `ownership.test.ts` — chunk/group/wallet ownership across user boundaries.
- `promptsSlice.test.ts` — cache invalidation tags fire correctly.
- `composeSlice.test.ts` — add/remove/toggle/reorder/clear, "replace from Group" flow.
- Component tests for `WalletRow`, `GroupCard`, `ChunkRow`, `ComposeDrawer`, `MergedPreview`, `WalletHeader` — copy, drag, edit, lock-cycle, duplicate, undo, click-to-append.

### E2E (Playwright, `e2e/wallet.spec.ts`)

- Create wallet → group → 3 chunks → click Group → Compose populates → toggle one off → `Copy Merged` → assert clipboard content matches expected join.
- Inline edit chunk content → reload → assert persisted.
- Delete wallet → click Undo → assert wallet + groups + chunks all restored.
- Lock cycle → assert UI behaviour matches lock level.
- Duplicate Group → assert ordering + chunk count.

### Coverage target

Maintain repo's 80% statement coverage per CLAUDE.md.

### Required test mocks (from MEMORY.md)

```ts
vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: vi.fn() }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {}, listeners: {}, setNodeRef: () => {},
    transform: null, transition: null, isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: 'vertical',
  sortableKeyboardCoordinates: () => null,
}));
```

---

## 9 · Implementation Phasing

The implementation will be split into **8 sequenced steps**, each in its own plan file. Each step is sized to be runnable in a single fresh session and ends with a green test suite.

```
Step 1 — Schema + types + ownership helper
Step 2 — REST API: prompt-wallets endpoints + tests
Step 3 — REST API: prompt-groups + prompt-chunks endpoints + tests
Step 4 — RTK Query slice + composeSlice + mergeChunks helper
Step 5 — Leaf components: ChunkRow, ComposeChunkRow, MergedPreview
Step 6 — Container components: GroupCard, ComposeDrawer, WalletDetail, WalletHeader
Step 7 — Top-level: WalletShell, WalletSidebar, WalletRow, /wallet page route + nav entry
Step 8 — E2E test suite + empty-state seed templates + INDEX update
```

Detailed per-step plans live in:

```
docs/plans/2026-05-03-prompts-wallet-step1-schema.md
docs/plans/2026-05-03-prompts-wallet-step2-wallet-api.md
docs/plans/2026-05-03-prompts-wallet-step3-group-chunk-api.md
docs/plans/2026-05-03-prompts-wallet-step4-store-and-merge.md
docs/plans/2026-05-03-prompts-wallet-step5-leaf-components.md
docs/plans/2026-05-03-prompts-wallet-step6-container-components.md
docs/plans/2026-05-03-prompts-wallet-step7-page-and-nav.md
docs/plans/2026-05-03-prompts-wallet-step8-e2e-and-seeds.md
```

The INDEX file (`2026-05-03-prompts-wallet-INDEX.md`) tracks completion status across sessions.

---

## 10 · Out of Scope (Phase 2 candidates)

| Feature | Notes |
|---|---|
| `{{variable}}` templating | Parser + per-variable form in Compose. Data model unaffected. |
| Search / Cmd-K | Add full-text index on `PromptChunk.title` + `content`. |
| MCP agent tools | Mirror existing `goalsSlice` agent tools — CRUD on wallets/groups/chunks under same security model. |
| Tags on chunks | New `String[]` column, multi-select filter UI. |
| Cross-group / cross-wallet drag | Adjust `@dnd-kit` to allow drops between SortableContexts; server-side reparent. |
| Per-Group separator override | Add `separator: String?` to `PromptGroup`; `mergeChunks` accepts override. |
| Compose persistence | Add `composeState` JSON to a `User`-scoped row. |
| Sharing / public wallets / templates marketplace | Add `visibility` + `isPublished` à la `GoalTemplate`; consider re-using `GoalTemplate`-style fork flow. |
| Optimistic-concurrency control | `If-Match: updatedAt` header + 409 handling. |
| Version history / undo beyond 6s | Append-only `PromptChunkVersion` rows on every save. |

---

## Sign-off

This design is locked in by the user (Q1–Q4 + architecture choice). Next step: split into per-step plan files and the tracker INDEX, then user reviews; on approval, execution begins step-by-step.
