import { NextResponse } from "next/server";
import { getMCPServer } from "@/lib/mcp/server";

export async function GET() {
  const server = getMCPServer();
  return NextResponse.json({
    status: "ok",
    tools: server.getTools().length,
    skills: server.getSkills().length,
  });
}
