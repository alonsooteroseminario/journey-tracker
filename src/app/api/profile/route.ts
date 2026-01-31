import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UpdateProfileSchema, validateRequest } from "@/lib/validations";

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      location: user.location,
      timezone: user.timezone,
      joinedDate: user.joinedDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = validateRequest(UpdateProfileSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validatedData = validation.data;

    const updateData: Record<string, unknown> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio;
    if (validatedData.profileImage !== undefined) updateData.profileImage = validatedData.profileImage;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.timezone !== undefined) updateData.timezone = validatedData.timezone;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      bio: updated.bio,
      profileImage: updated.profileImage,
      location: updated.location,
      timezone: updated.timezone,
      joinedDate: updated.joinedDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
