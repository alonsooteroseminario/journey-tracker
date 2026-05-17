# F5 — MCP REST API (Phase 1)

**Date:** 2026-05-16 · **Owner:** alonsooteroseminario · **Branch:** `feat/f5-mcp-rest-api`

## Problem

The app has **33 in-process tools** under `src/lib/mcp/tools/` and **3 skills** under `src/lib/mcp/skills/`, all reachable only via the internal agent loop (`/api/agent/chat`). There's no way to:
- Invoke a single tool from outside the chat session (e.g. from a test harness, CLI, or browser devtools).
- Discover what tools/skills exist via an HTTP API.
- Build external automations that use the user's data without going through the chat agent.

## Goal (Phase 1)

Expose every tool and skill as a discoverable REST endpoint, authenticated via Clerk session, with the same ownership and rate-limit guarantees the agent loop enforces today. **No custom-tool authoring** in this round — that's a Phase 2 (later) scope.

## Non-Goals

- No standard MCP JSON-RPC server (deferred).
- No external/personal access token auth (Clerk session only for now).
- No tool composition or user-defined skills.
- No CLI client (REST is the only interface).
- No streaming responses — tools return JSON synchronously.

## Architecture

### Endpoint Surface

```
GET  /api/mcp/tools                       → list of { name, description, inputSchema }
GET  /api/mcp/tools/[name]                → single tool definition (404 if unknown)
POST /api/mcp/tools/[name]                → execute tool with { args } body, returns { result } or { error }

GET  /api/mcp/skills                      → list of { name, description, inputSchema }
GET  /api/mcp/skills/[name]               → single skill definition
POST /api/mcp/skills/[name]               → execute skill

GET  /api/mcp/health                      → { tools: 33, skills: 3, status: "ok" }
```

All routes:
- Require Clerk auth (return 401 if not signed in).
- Run through the same `sanitize`/`rateLimitPerUser` middleware as `/api/agent/chat`.
- Validate `args` against the tool's JSON schema (reuse `ajv` if already a dep; else `zod`).
- Use the existing `MCPServer` singleton (`src/lib/mcp/server.ts`) — no duplicate registry.

### Shared Handler

`src/app/api/mcp/_handler.ts` (new) — extracted body executor:

```ts
export async function handleMcpCall(
  kind: "tool" | "skill",
  name: string,
  rawArgs: unknown,
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await getCurrentUser();
  await rateLimitPerUser(user.id);

  const server = getMCPServer();
  const def = kind === "tool" ? server.getTool(name) : server.getSkill(name);
  if (!def) return NextResponse.json({ error: "NOT_FOUND", name }, { status: 404 });

  const valid = validate(rawArgs, def.inputSchema);
  if (!valid.ok) return NextResponse.json({ error: "BAD_ARGS", details: valid.errors }, { status: 400 });

  try {
    const result = kind === "tool"
      ? await server.executeTool(name, valid.data, user.id)
      : await server.executeSkill(name, valid.data, user.id);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "EXECUTION_FAILED", message }, { status: 500 });
  }
}
```

### MCPServer Enhancements

Existing `src/lib/mcp/server.ts` already has tool/skill lookup. Verify it exposes:
- `getTool(name)` / `getSkill(name)` → definition or undefined
- `listTools()` / `listSkills()` → arrays of definitions
- `executeTool(name, args, userId)` / `executeSkill(name, args, userId)` → result

Add any missing helpers; keep singleton.

### Schema Validation

If `ajv` is not already a dep, use `zod` (already in many Next.js projects). Convert each tool's JSON Schema to a zod schema once at server start. Cache.

Alternative: use `ajv` (battle-tested for JSON Schema). Decide based on existing `package.json`.

## Auth & Security

| Concern | Mitigation |
|---------|------------|
| Anyone calling a tool | Clerk session required; each tool already verifies ownership via `userId` |
| Tool flooding | Reuse `rateLimitPerUser` from `src/lib/agent/security.ts` (30/min default; same as chat) |
| Bad JSON body | Validate via schema; return 400 with errors |
| Argument injection | `sanitize()` from agent security; same path as chat tool calls |
| Wrong schema → DB write | All tools already use Prisma with parameterized queries |

## Documentation

`docs/api/mcp.md` (new) — generated table from `getMCPServer().listTools()`:

```
| Tool | Description | Endpoint |
|------|-------------|----------|
| get-goals | Returns all user goals | POST /api/mcp/tools/get-goals |
| create-goal | Create a new goal | POST /api/mcp/tools/create-goal |
…
```

Generate via a script `scripts/gen-mcp-docs.ts` so docs stay in sync.

## Testing

- Unit: `_handler.test.ts` — happy path, 401, 404, 400, 500 paths
- Per-tool integration: `route.test.ts` for `/api/mcp/tools/[name]` covers at least 3 representative tools (read, write, complex)
- E2E: `e2e/mcp-rest.spec.ts` — sign in, call `GET /api/mcp/tools`, call `POST /api/mcp/tools/get-goals`, assert response shape

## Acceptance Criteria

- All 33 tools + 3 skills callable via REST.
- `GET /api/mcp/tools` returns full list with schemas.
- Unauth → 401; unknown tool → 404; bad args → 400.
- Rate limit kicks in at 30 req/min.
- `npm run lint`, `npm run test`, `npm run test:e2e -- mcp-rest` green.
- `docs/api/mcp.md` exists and is regenerable.

## Out of Scope (deferred)

- MCP JSON-RPC server (Phase 2)
- Personal access tokens (Phase 2)
- User-defined tools / skills (Phase 3)
- Tool composition macros (Phase 3)
- Streaming responses (no current tool needs it)
