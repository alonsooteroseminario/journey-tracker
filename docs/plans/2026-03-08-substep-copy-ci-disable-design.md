# Design: Substep Copy Button + Disable GitHub Actions CI

**Date:** 2026-03-08
**Status:** Approved — ready for implementation

---

## Feature 1: SubstepCard Copy Button

### Goal
Allow users to copy a substep's title to the clipboard with a single click.

### Component: `src/components/SubstepCard.tsx`

Add a copy button in the hover actions row, positioned before the existing Edit button:

```
[drag handle] [status checkbox] [title + meta]  [copy] [edit] [delete]
```

**Behavior:**
- `navigator.clipboard.writeText(substep.title)` on click
- Local state `copied: boolean` — flips to `true` for 1.5s then resets via `setTimeout`
- While `copied === true`:
  - Icon: clipboard SVG → checkmark SVG
  - Color: `text-gray-400` → `text-green-500`
  - `title` attribute: `"Copy"` → `"Copied!"`
- Styled identically to Edit/Delete buttons: `p-1 rounded transition-colors` with brand hover colors

**No external dependencies** — `navigator.clipboard` available in all modern browsers.

### Tests: `src/components/SubstepCard.test.tsx`

Add 2 new tests:
1. Copy button renders in the actions area
2. Clicking copy calls `navigator.clipboard.writeText` with `substep.title`

Mock: `navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined)`

---

## Feature 2: Disable GitHub Actions CI

### Goal
Comment out the workflow triggers in `.github/workflows/ci.yml` so CI never runs automatically. Vercel handles deploys; the file is kept as documentation for future reference.

### Change: `.github/workflows/ci.yml`

Comment out the `on:` block:

```yaml
# on:
#   push:
#     branches: [main]
#   pull_request:
#     branches: [main]
```

Workflow job definition stays intact.

---

## Parallel Execution Plan

| Branch | Scope | Files |
|--------|-------|-------|
| `feat/substep-copy-button` | Copy icon + tests | `src/components/SubstepCard.tsx`, `src/components/SubstepCard.test.tsx` |
| `chore/disable-github-actions` | Comment out CI triggers | `.github/workflows/ci.yml` |

Merge order: either order, no conflicts expected.
