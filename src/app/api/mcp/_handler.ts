import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";
import { securityGuard } from "@/lib/agent/security";
import type { ToolDefinition, SkillDefinition } from "@/types/agent";

type CallKind = "tool" | "skill";

function buildZodSchema(jsonSchema: ToolDefinition["input_schema"]): z.ZodTypeAny {
  if (!jsonSchema || jsonSchema.type !== "object") return z.any();
  const shape: Record<string, z.ZodTypeAny> = {};
  const props = jsonSchema.properties ?? {};
  const required: string[] = Array.isArray(jsonSchema.required) ? jsonSchema.required : [];
  for (const [key, prop] of Object.entries(props)) {
    const p = prop as { type?: string; description?: string };
    let fieldSchema: z.ZodTypeAny;
    switch (p.type) {
      case "string":  fieldSchema = z.string(); break;
      case "number":  fieldSchema = z.number(); break;
      case "boolean": fieldSchema = z.boolean(); break;
      case "array":   fieldSchema = z.array(z.any()); break;
      default:        fieldSchema = z.any();
    }
    if (!required.includes(key)) fieldSchema = fieldSchema.optional();
    shape[key] = fieldSchema;
  }
  return z.object(shape).passthrough();
}

/**
 * Core handler for both tool and skill REST calls.
 * Handles auth, rate limiting, schema validation, and execution.
 */
export async function handleMcpCall(
  kind: CallKind,
  name: string,
  rawArgs: unknown,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!securityGuard.checkRateLimit(user.clerkId)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const server = getMCPServer();

  if (!server.hasTool(name)) {
    return NextResponse.json({ error: "NOT_FOUND", name }, { status: 404 });
  }

  // Get definition for schema validation
  const def: ToolDefinition | SkillDefinition | undefined =
    kind === "tool"
      ? server.getTools().find((t) => t.name === name)
      : (server.getSkills().find((s) => s.name === name) as SkillDefinition | undefined);

  if (!def) return NextResponse.json({ error: "NOT_FOUND", name }, { status: 404 });

  const inputSchema = (def as ToolDefinition).input_schema ?? { type: "object", properties: {} };
  const zodSchema = buildZodSchema(inputSchema);
  const parsed = zodSchema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_ARGS", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const executor = server.getToolExecutor(name);
  if (!executor) return NextResponse.json({ error: "NOT_FOUND", name }, { status: 404 });

  try {
    const result = await executor(parsed.data as Record<string, unknown>, user.clerkId);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "EXECUTION_FAILED", message }, { status: 500 });
  }
}
