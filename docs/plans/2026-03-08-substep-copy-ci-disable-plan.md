# Substep Copy Button + Disable GitHub Actions CI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 1-click copy-title button to SubstepCard, and comment out the GitHub Actions CI triggers so the workflow never runs automatically.

**Architecture:** Two independent branches. Branch A touches only `SubstepCard.tsx` and its test. Branch B touches only `.github/workflows/ci.yml`. No shared state, no merge conflicts expected.

**Tech Stack:** React (useState, navigator.clipboard), Vitest + Testing Library, YAML comments.

---

## Branch A: `feat/substep-copy-button`

### Task 1: Write failing tests for copy button

**Files:**
- Modify: `src/components/SubstepCard.test.tsx`

**Step 1: Add clipboard mock and two new tests at the bottom of the describe block**

Open `src/components/SubstepCard.test.tsx` and append these two tests inside the existing `describe('SubstepCard', ...)` block, before the closing `});`:

```ts
  it('renders a copy button in the actions area', () => {
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByTitle('Copy')).toBeInTheDocument();
  });

  it('copies substep title to clipboard when copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });

    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Copy'));
    expect(writeText).toHaveBeenCalledWith('Write resume');
  });
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/SubstepCard.test.tsx
```

Expected: 2 new tests FAIL with "Unable to find an element with the title: Copy"

---

### Task 2: Implement the copy button

**Files:**
- Modify: `src/components/SubstepCard.tsx`

**Step 1: Add `copied` state**

In the view mode function body (after line 22, alongside the other `useState` calls), add:

```ts
const [copied, setCopied] = useState(false);
```

**Step 2: Add `handleCopy` handler**

After the `handleCancel` function (after line 55), add:

```ts
  const handleCopy = () => {
    navigator.clipboard.writeText(substep.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
```

**Step 3: Add copy button to the Actions div**

In the `{/* Actions */}` div (around line 206), add the copy button as the first button, before the edit button:

```tsx
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className={`p-1 rounded transition-colors ${
            copied
              ? "text-green-500 bg-green-50"
              : "text-gray-400 hover:text-brand-primary hover:bg-brand-light"
          }`}
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-brand-primary hover:bg-brand-light rounded transition-colors"
          title="Edit"
        >
          ...existing edit icon svg...
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          ...existing delete icon svg...
        </button>
      </div>
```

> Note: Keep the existing Edit and Delete buttons exactly as they are. Only INSERT the new copy button before the edit button.

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/SubstepCard.test.tsx
```

Expected: ALL tests PASS (15 total — 13 existing + 2 new)

**Step 5: Run full unit test suite to check for regressions**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/components/SubstepCard.tsx src/components/SubstepCard.test.tsx
git commit -m "feat(substep): add 1-click copy title button to SubstepCard

- Copy button appears on hover in actions row alongside Edit/Delete
- navigator.clipboard.writeText copies substep.title on click
- Visual feedback: icon switches to checkmark + green color for 1.5s
- 2 new tests: renders copy button, calls clipboard.writeText with title"
```

---

## Branch B: `chore/disable-github-actions`

### Task 1: Comment out CI workflow triggers

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Comment out the `on:` block**

Replace the `on:` section:

```yaml
# CI triggers disabled — Vercel handles deploys.
# Re-enable by uncommenting the block below.
# on:
#   push:
#     branches: [main]
#   pull_request:
#     branches: [main]
```

Keep the rest of the file (`jobs:` and all steps) exactly as-is.

**Step 2: Verify the file looks correct**

```bash
cat .github/workflows/ci.yml
```

Expected: `on:` block is fully commented, `jobs:` block is intact.

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: disable GitHub Actions CI triggers

Vercel handles deploys so CI auto-runs are unnecessary.
Workflow job definition preserved for future reference."
```

---

## Final: Merge Both Branches to Main

After both branches are complete and all tests pass:

```bash
# Merge Branch B first (no code, no conflicts possible)
git checkout main
git merge chore/disable-github-actions --no-ff

# Merge Branch A
git merge feat/substep-copy-button --no-ff

# Run full test suite one final time
npx vitest run
```

Expected: All tests pass. Then prepare the single detailed commit message summary for user review.
