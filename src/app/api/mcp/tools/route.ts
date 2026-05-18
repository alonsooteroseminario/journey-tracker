import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tools = getMCPServer().getTools();
  return NextResponse.json({ tools, count: tools.length });
}
