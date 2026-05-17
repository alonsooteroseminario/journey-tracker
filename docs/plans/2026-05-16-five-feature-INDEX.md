# 2026-05-16 — Five Feature Plan (Index)

**Owner:** alonsooteroseminario · **Status:** ⏳ Awaiting user approval before execution

This index points to the design and step plans for five independent features the user requested on 2026-05-16. Each feature has its own design doc and step plan(s). They are ordered F1 → F5 and intended to ship sequentially (each on its own branch).

## Decision Summary

| F | Feature | Decision (chosen by user 2026-05-16) |
|---|---------|--------------------------------------|
| F1 | Dark/Light mode fix | **Semantic tokens** (CSS variables + Tailwind, no per-element `dark:` classes) |
| F2 | Cost Tracker → Agent API key | **Hide Cost Tracker + strict gate**: `/settings/ai-key`, encrypted DB, env fallback only for admin |
| F3 | App header on Wallet | **Move `<Header>` into `AppShell`** (landing route exempt by `usePathname`) |
| F4 | Shareable Wallet URLs | **Unlisted link + view-only**: `shareToken` on `PromptWallet`, `/wallet/share/<token>`, "Copy as my own" CTA |
| F5 | MCP REST API | **Phase 1 — REST endpoints only**: every tool + skill exposed under `/api/mcp/*`, no custom-tool authoring this round |

## Design Documents

- [F1 — Dark/Light Mode (Semantic Tokens)](./2026-05-16-f1-dark-mode-design.md)
- [F2 — Agent API Key in Settings](./2026-05-16-f2-agent-api-key-design.md)
- [F3 — Header in AppShell](./2026-05-16-f3-header-in-appshell-design.md)
- [F4 — Shareable Wallet URLs](./2026-05-16-f4-wallet-sharing-design.md)
- [F5 — MCP REST API (Phase 1)](./2026-05-16-f5-mcp-rest-api-design.md)

## Step Plans

- [F1 Step Plan](./2026-05-16-f1-dark-mode-steps.md)
- [F2 Step Plan](./2026-05-16-f2-agent-api-key-steps.md)
- [F3 Step Plan](./2026-05-16-f3-header-in-appshell-steps.md)
- [F4 Step Plan](./2026-05-16-f4-wallet-sharing-steps.md)
- [F5 Step Plan](./2026-05-16-f5-mcp-rest-api-steps.md)

## Execution Strategy

- One feature branch per F: `feat/f1-dark-mode`, `feat/f2-agent-api-key`, etc.
- Per the user's CLAUDE.md and superpowers TDD skill, **tests first** for each step.
- After each feature merges, update `docs/sprint-status.yaml` and `_bmad-output/implementation-artifacts/` via the bmad workflow.
- `superpowers:verification-before-completion` gate before every "done" claim.

## Pre-Flight Checklist (before starting F1)

- [ ] User reviewed all 5 design docs in this index
- [ ] User approved priority order F1→F5 (✅ confirmed)
- [ ] Worktrees cleaned (`git worktree list` shows only `main`)
- [ ] `npm run test` green on `main`
- [ ] `_bmad-output/implementation-artifacts/` and `docs/sprint-status.yaml` ready for sprint update
