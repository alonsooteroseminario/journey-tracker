# F5 — MCP REST API (Phase 1) · Step Plan

**Branch:** `feat/f5-mcp-rest-api` · **Estimate:** 2-3 days

## Step 1 — Audit & Helpers

**Files:**
- Read `src/lib/mcp/server.ts` — confirm it has `getTool`, `getSkill`, `listTools`, `listSkills`, `executeTool`, `executeSkill`. Add anything missing.
- `src/lib/mcp/server.test.ts` (extend) — unit tests for helpers
- `src/lib/agent/security.ts` — extract `rateLimitPerUser` if not already exported standalone

**Done when:** server.ts has the full required surface; unit tests green.

## Step 2 — Shared Handler + Validation

**Files:**
- `src/app/api/mcp/_handler.ts` (new) — implements `handleMcpCall(kind, name, args)` as in design
- `src/app/api/mcp/_handler.test.ts` (new) — covers all 4 status paths (401/404/400/200) + 500
- Pick `zod` vs `ajv`:
  - If `ajv` already in `package.json` → use it (`new Ajv({ allErrors: true })`)
  - Else `zod` + `zod-to-json-schema` reverse (or write a small JSON Schema validator)
- `src/lib/mcp/validate.ts` (new) — `validate(rawArgs, jsonSchema)` returning `{ ok, data, errors }`

**Done when:** Handler tests pass; validation produces helpful error messages.

## Step 3 — Tool Endpoints

**Files:**
- `src/app/api/mcp/tools/route.ts` (new) — `GET` returns `{ tools: server.listTools() }`
- `src/app/api/mcp/tools/[name]/route.ts` (new) — `GET` returns single def; `POST` calls handler
- `src/app/api/mcp/tools/[name]/route.test.ts` (new) — integration test with 3 representative tools:
  - `get-goals` (read, no args)
  - `create-task` (write, args required)
  - `complete-substep` (write, nested args)

**Done when:** Curl `GET /api/mcp/tools` returns list; `POST /api/mcp/tools/get-goals` returns goals.

## Step 4 — Skill Endpoints

**Files:**
- `src/app/api/mcp/skills/route.ts` (new) — `GET` returns `{ skills: server.listSkills() }`
- `src/app/api/mcp/skills/[name]/route.ts` (new) — `GET` + `POST`
- `src/app/api/mcp/skills/[name]/route.test.ts` (new) — integration test

**Done when:** Skills callable.

## Step 5 — Health & Docs Generator

**Files:**
- `src/app/api/mcp/health/route.ts` (new) — `GET` returns counts + status
- `scripts/gen-mcp-docs.ts` (new) — node script: load registry, emit Markdown table to `docs/api/mcp.md`
- Add `"docs:mcp": "tsx scripts/gen-mcp-docs.ts"` to `package.json`
- Run once and commit `docs/api/mcp.md`

**Done when:** `npm run docs:mcp` regenerates docs; committed table matches registry.

## Step 6 — E2E

`e2e/mcp-rest.spec.ts`:
1. Sign in
2. Call `GET /api/mcp/tools` via `page.request` → assert ≥ 33 entries
3. `POST /api/mcp/tools/get-goals` with `{}` → 200 + array
4. Unauth request → 401
5. Unknown tool → 404
6. Bad args (missing required) → 400

**Done when:** Playwright passes.

## Step 7 — Verification & Docs

- `superpowers:verification-before-completion`: lint, build, test, e2e
- Update `CLAUDE.md` with the new endpoint pattern under "AI Agent / MCP" section
- Update `MEMORY.md` (F5 ✅)
- Update `_bmad-output/implementation-artifacts/` with REST endpoint inventory

## Phase 2 Hooks (Plan, Don't Build)

These should be **anticipated in code structure** but **not implemented** this round:
- A `_handler.ts` that's auth-agnostic so a future personal-access-token middleware can wrap it
- Schema definitions exportable so a future MCP JSON-RPC server can reuse them
- Registry exposes ordered tool names so a future custom-tool overlay can append entries

## Risk Bail-Outs

- **Schema validation library mismatch:** if `ajv` and `zod` both pulled in by transitive deps, prefer the lighter footprint and standardize. Reject pulling both.
- **Latency cliff:** chained tools (get-goals → for-each goal → get-streaks) over REST will be slower than the in-process agent loop. Document that batching multiple tools in one REST call is Phase 2. For now: each call = 1 tool.
- **Argument schema drift:** Tests must exercise representative schemas — pick read/write/complex covering common patterns.
- **Tool count > 33:** registry already has 33 by my count; bumps may have happened. Health endpoint should report actual count, not hardcoded.
