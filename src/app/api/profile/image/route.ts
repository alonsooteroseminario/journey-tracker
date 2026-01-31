import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProfileImageSchema, validateRequest } from "@/lib/validations";

// POST /api/profile/image - Upload/update profile image (Base64)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate image (checks format and size)
    const validation = validateRequest(ProfileImageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: validation.data.image },
    });

    return NextResponse.json({ profileImage: updated.profileImage });
  } catch (error) {
    console.error("POST /api/profile/image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
