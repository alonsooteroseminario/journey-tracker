import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";
import { handleMcpCall } from "@/app/api/mcp/_handler";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const def = getMCPServer().getSkills().find((s) => s.name === name);
  if (!def) return NextResponse.json({ error: "NOT_FOUND", name }, { status: 404 });

  const { execute: _e, ...rest } = def;
  return NextResponse.json(rest);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  let args: unknown = {};
  try {
    const text = await req.text();
    if (text) args = JSON.parse(text);
  } catch {
    /* empty body */
  }
  return handleMcpCall("skill", name, args);
}
