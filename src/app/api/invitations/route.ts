import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

function generateCode(): string {
  // Generate cryptographically secure random code (8 characters, base36)
  const randomBytes = crypto.randomBytes(6); // 6 bytes = 48 bits
  return randomBytes.toString('base64url').substring(0, 8).toUpperCase();
}

// GET /api/invitations - Get all invitations for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      invitations.map((inv) => ({
        id: inv.id,
        code: inv.code,
        createdDate: inv.createdAt.toISOString(),
        expiresDate: inv.expiresAt.toISOString(),
        used: inv.used,
        usedBy: inv.usedBy,
        usedDate: inv.usedAt?.toISOString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Create a new invitation code
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        id: invitation.id,
        code: invitation.code,
        createdDate: invitation.createdAt.toISOString(),
        expiresDate: invitation.expiresAt.toISOString(),
        used: invitation.used,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
