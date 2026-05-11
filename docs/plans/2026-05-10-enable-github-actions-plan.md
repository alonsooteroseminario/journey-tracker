# Re-enable GitHub Actions CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-enable GitHub Actions CI on every push and pull-request so lint, type-check, unit tests, and build verification all run automatically.

**Architecture:** Single workflow file at `.github/workflows/ci.yml`. Triggers on push to `main` + feature branches matching `feat/**` and `fix/**`, plus PRs to `main`. Adds a `build` step after tests to catch type/build errors that currently slip through to Vercel.

**Tech Stack:** GitHub Actions, Node 20, npm ci, ESLint, TypeScript, Vitest, Next.js build.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `.github/workflows/ci.yml` | Modify | Re-enable triggers, add build step |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modify | Append CI re-enable entry |

---

### Task 1: Re-enable triggers and add build step

**Files:**
- Modify: `.github/workflows/ci.yml` (whole file)

- [ ] **Step 1: Read current file**

Run: `cat .github/workflows/ci.yml`
Expected: shows commented-out `on:` block (lines 3-9) and three job steps (Lint, Type check, Unit tests).

- [ ] **Step 2: Replace the file with active triggers + build step**

Write the new file content:

```yaml
name: CI

on:
  push:
    branches:
      - main
      - 'feat/**'
      - 'fix/**'
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npx vitest run

      - name: Build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL || 'mongodb://placeholder' }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder' }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY || 'sk_test_placeholder' }}
        run: npm run build
```

Note: `prisma generate` is required because `postinstall` script may be skipped under `npm ci` with certain cache hits, and the Next build imports the Prisma client. Build-time env defaults let CI run on forks without secrets configured.

- [ ] **Step 3: Verify locally that scripts referenced in the workflow exist**

Run: `npm run lint && npx tsc --noEmit && npx vitest run --reporter=basic`
Expected: lint passes, tsc passes (or matches current main), tests pass.

- [ ] **Step 4: Verify build runs cleanly locally**

Run: `npm run build`
Expected: Next.js compiles successfully. Note any warnings; do NOT fail the task unless build errors out.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: re-enable GitHub Actions on push, add build step

Workflow now runs on push to main and feat/** + fix/** branches,
and on pull-requests to main. Added prisma generate + build steps
so type/build errors surface in CI not just Vercel."
```

- [ ] **Step 6: Push branch and verify CI runs**

```bash
git push -u origin <branch-name>
```

Visit GitHub → Actions tab → confirm workflow ran. If it fails, debug, push fix, re-verify. Do NOT mark task complete until a green run exists on the branch.

---

### Task 2: Update BMAD sprint status

**Files:**
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

- [ ] **Step 1: Read current sprint status**

Run: `cat _bmad-output/implementation-artifacts/sprint-status.yaml`
Expected: existing YAML structure.

- [ ] **Step 2: Append an entry under a `completed` or `delivered` list**

Add an entry like:

```yaml
- date: 2026-05-10
  feature: ci-reenable
  status: complete
  summary: GitHub Actions CI re-enabled with prisma generate + build step on push + PR.
  artifacts:
    - .github/workflows/ci.yml
```

If the YAML structure doesn't yet have a list, add one with key `completed:`.

- [ ] **Step 3: Commit**

```bash
git add _bmad-output/implementation-artifacts/sprint-status.yaml
git commit -m "docs(bmad): record CI re-enable in sprint status"
```

---

## Self-Review Checklist

- ✅ Spec coverage: triggers re-enabled, build step added, BMAD docs updated.
- ✅ No placeholders.
- ✅ All file paths exact.
- ✅ Each step has runnable command or concrete content.

## Risks

- **Secrets missing on first run:** `npm run build` may fail if Clerk/Prisma envs are required at build time. Mitigation: env defaults in workflow (`'pk_test_placeholder'` etc.). If Next.js complains at static-analysis time, follow up by adding `output: 'standalone'` or pre-flight env validation — out of scope for this plan.
- **Flaky tests:** if any test relies on real network or wall-clock, it may flake in CI. If observed, mark with `vi.skip` and file a follow-up — do not silence the whole job.
