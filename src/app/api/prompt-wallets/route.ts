import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  serializePromptWallet,
  validateOptionalDescription,
  validateOptionalIcon,
  validateWalletTitle,
} from "@/lib/prompts/walletApiShared";

// GET /api/prompt-wallets — list wallets with groups + chunks, ordered
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await prisma.promptWallet.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: {
            chunks: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    const data = wallets.map(serializePromptWallet);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error) {
    console.error("GET /api/prompt-wallets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/prompt-wallets — create wallet
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const titleErr = validateWalletTitle(body.title);
    if (titleErr) {
      return NextResponse.json({ error: titleErr }, { status: 400 });
    }
    const descErr = validateOptionalDescription(body.description);
    if (descErr) {
      return NextResponse.json({ error: descErr }, { status: 400 });
    }
    const iconErr = validateOptionalIcon(body.icon);
    if (iconErr) {
      return NextResponse.json({ error: iconErr }, { status: 400 });
    }

    const title = (body.title as string).trim();
    const last = await prisma.promptWallet.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = last ? last.order + 1 : 0;

    const wallet = await prisma.promptWallet.create({
      data: {
        userId: user.id,
        title,
        icon:
          typeof body.icon === "string" && body.icon.trim().length > 0
            ? body.icon.trim()
            : null,
        description:
          typeof body.description === "string" && body.description.trim().length > 0
            ? body.description.trim()
            : null,
        order: nextOrder,
        lockLevel: null,
      },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: { chunks: { orderBy: { order: "asc" } } },
        },
      },
    });

    return NextResponse.json(serializePromptWallet(wallet), { status: 201 });
  } catch (error) {
    console.error("POST /api/prompt-wallets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
