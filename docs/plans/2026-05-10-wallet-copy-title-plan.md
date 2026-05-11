# Wallet Chunk Title Copy Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The copy button on every chunk row in the Wallet should copy the chunk **title** to the clipboard (not the content). This matches the `SubstepCard` precedent shipped in Mar 2026 and aligns with the user's mental model.

**Architecture:** Single-file behavior change in `src/components/prompts/ChunkRow.tsx` — flip `handleCopy` from `chunk.content` to `chunk.title`. Update button tooltip + aria-label. Update the one test that asserts the old behavior. No API, schema, or other component changes.

**Tech Stack:** React, navigator.clipboard, Vitest.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/prompts/ChunkRow.tsx` | Modify | Change copy target to title, update tooltip/aria |
| `src/components/prompts/ChunkRow.test.tsx` | Modify | Flip clipboard assertion to title |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modify | Append fix entry |

---

### Task 1: Flip the failing test to expect title

**Files:**
- Modify: `src/components/prompts/ChunkRow.test.tsx:69-75`

- [ ] **Step 1: Read current test**

Run: `sed -n '65,80p' src/components/prompts/ChunkRow.test.tsx`
Expected: test named `'copy button calls clipboard.writeText with chunk.content (not title)'` asserting `'You are a helpful assistant.'`.

- [ ] **Step 2: Rewrite the test to expect title**

Replace lines 69-75 with:

```tsx
  it('copy button calls clipboard.writeText with chunk.title', async () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Copy title'));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('System Role')
    );
  });
```

- [ ] **Step 3: Run the test — confirm it FAILS**

Run: `npx vitest run src/components/prompts/ChunkRow.test.tsx -t "copy button calls clipboard.writeText" --reporter=verbose`
Expected: FAIL — currently button title is `"Copy content"` so `getByTitle('Copy title')` will not find the button. (TDD red phase.)

---

### Task 2: Implement the behavior change in ChunkRow

**Files:**
- Modify: `src/components/prompts/ChunkRow.tsx:75-88` (handleCopy)
- Modify: `src/components/prompts/ChunkRow.tsx:179-195` (button title/aria/handler)

- [ ] **Step 1: Read current handleCopy + button JSX**

Run: `sed -n '70,90p' src/components/prompts/ChunkRow.tsx && echo '---' && sed -n '177,200p' src/components/prompts/ChunkRow.tsx`
Expected: `await navigator.clipboard.writeText(chunk.content)` and `title={copied ? "Copied!" : "Copy content"}`.

- [ ] **Step 2: Change clipboard payload from content to title**

Replace the `handleCopy` function body (lines 75-88) with:

```tsx
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chunk.title);
    } catch {
      const el = document.createElement("textarea");
      el.value = chunk.title;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
```

- [ ] **Step 3: Update button tooltip and aria-label**

Replace lines 183-184 (`title={copied ? "Copied!" : "Copy content"}` and matching `aria-label`) with:

```tsx
          title={copied ? "Copied!" : "Copy title"}
          aria-label={copied ? "Copied!" : "Copy title"}
```

- [ ] **Step 4: Run the test — confirm it PASSES**

Run: `npx vitest run src/components/prompts/ChunkRow.test.tsx -t "copy button calls clipboard.writeText" --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Run all ChunkRow tests**

Run: `npx vitest run src/components/prompts/ChunkRow.test.tsx --reporter=verbose`
Expected: all tests pass.

- [ ] **Step 6: Run the full prompts test suite**

Run: `npx vitest run src/components/prompts/ --reporter=basic`
Expected: all tests pass. No GroupCard / WalletShell test relies on `'Copy content'` title.

If any test in `GroupCard.test.tsx` or similar fails because it grep-asserted the old button title, update it the same way.

- [ ] **Step 7: Smoke-test in the browser**

Run `npm run dev`, open `/wallet`, hover over a chunk row, click the copy button. Paste somewhere visible (URL bar, scratch buffer) and confirm the **title** lands, not the content.

- [ ] **Step 8: Commit**

```bash
git add src/components/prompts/ChunkRow.tsx src/components/prompts/ChunkRow.test.tsx
git commit -m "fix(prompts-wallet): copy button copies chunk title, not content

The chunk-row copy button now copies chunk.title to match the
SubstepCard pattern (Mar 8 release). Tooltip + aria updated to
'Copy title'. Test flipped accordingly."
```

---

### Task 3: Update BMAD sprint status

**Files:**
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

- [ ] **Step 1: Append entry**

```yaml
- date: 2026-05-10
  feature: wallet-copy-title-fix
  status: complete
  summary: Wallet ChunkRow copy button now copies title (was content) to match SubstepCard pattern.
  artifacts:
    - src/components/prompts/ChunkRow.tsx
    - src/components/prompts/ChunkRow.test.tsx
```

- [ ] **Step 2: Commit**

```bash
git add _bmad-output/implementation-artifacts/sprint-status.yaml
git commit -m "docs(bmad): record wallet copy-title fix in sprint status"
```

---

## Self-Review Checklist

- ✅ Spec coverage: button now copies title, matches user's expectation.
- ✅ TDD order: test first, watch it fail, then implement, watch it pass.
- ✅ No placeholders.
- ✅ Manual smoke test verifies real clipboard.
- ✅ aria-label updated for screen-reader users.

## Risks

- **Test grep mismatch**: if any other test file `getByTitle('Copy content')` it will break. Step 6 catches this with a broad prompts/ run.
- **User confusion**: existing users may expect the old behavior (copy content). Mitigation: the tooltip clearly says "Copy title". If users complain later, easy to add a SECOND copy button (one for title, one for content) in a follow-up.
