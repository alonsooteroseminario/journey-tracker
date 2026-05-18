import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skills = getMCPServer().getSkills();
  return NextResponse.json({
    skills: skills.map(({ execute: _e, ...rest }) => rest),
    count: skills.length,
  });
}
