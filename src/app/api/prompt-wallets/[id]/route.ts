import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  assertWalletOwnership,
  OwnershipError,
  LockedError,
  assertCanEdit,
  assertCanDelete,
} from "@/lib/prompts/ownership";
import {
  serializePromptWallet,
  validateOptionalDescription,
  validateOptionalIcon,
  validateWalletTitle,
} from "@/lib/prompts/walletApiShared";

const walletInclude = {
  groups: {
    orderBy: { order: "asc" as const },
    include: { chunks: { orderBy: { order: "asc" as const } } },
  },
} as const;

// PATCH /api/prompt-wallets/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { lockLevel } = await assertWalletOwnership(id, user.id);

    const body = await req.json();
    // A PATCH that only changes lockLevel must pass even on a hard lock,
    // otherwise hard-locking an item would brick it permanently.
    assertCanEdit(lockLevel, Object.keys(body).length === 1 && body.lockLevel !== undefined);
    const data: Prisma.PromptWalletUpdateInput = {};

    if (body.title !== undefined) {
      const err = validateWalletTitle(body.title);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      data.title = (body.title as string).trim();
    }

    if (body.description !== undefined) {
      const err = validateOptionalDescription(body.description);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      if (body.description === null) {
        data.description = null;
      } else if (typeof body.description === "string") {
        const t = body.description.trim();
        data.description = t.length > 0 ? t : null;
      }
    }

    if (body.icon !== undefined) {
      const err = validateOptionalIcon(body.icon);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      if (body.icon === null) {
        data.icon = null;
      } else if (typeof body.icon === "string") {
        const t = body.icon.trim();
        data.icon = t.length > 0 ? t : null;
      }
    }

    if (body.order !== undefined) {
      if (typeof body.order !== "number" || !Number.isInteger(body.order)) {
        return NextResponse.json(
          { error: "order must be an integer" },
          { status: 400 }
        );
      }
      data.order = body.order;
    }

    if (body.lockLevel !== undefined) {
      if (body.lockLevel === null) {
        data.lockLevel = null;
      } else if (
        body.lockLevel === "none" ||
        body.lockLevel === "soft" ||
        body.lockLevel === "hard"
      ) {
        data.lockLevel = body.lockLevel === "none" ? null : body.lockLevel;
      } else {
        return NextResponse.json(
          { error: "Invalid lockLevel" },
          { status: 400 }
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const wallet = await prisma.promptWallet.update({
      where: { id },
      data,
      include: walletInclude,
    });

    return NextResponse.json(serializePromptWallet(wallet));
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof LockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("PATCH /api/prompt-wallets/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/prompt-wallets/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { lockLevel } = await assertWalletOwnership(id, user.id);
    assertCanDelete(lockLevel);

    await prisma.promptWallet.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof LockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("DELETE /api/prompt-wallets/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
