import { NextResponse } from "next/server";

/** Public health check — no auth required. */
export const dynamic = "force-dynamic";

export async function GET() {
  // Lazy import to avoid module-level side effects in dev mode.
  const { getMCPServer } = await import("@/lib/mcp/server");
  const server = getMCPServer();
  return NextResponse.json({
    status: "ok",
    tools: server.getTools().length,
    skills: server.getSkills().length,
  });
}
