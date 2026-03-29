import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await prisma.costTransaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(
    transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date.toISOString(),
      source: t.source,
      createdAt: t.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, category, description, date } = body as Record<string, unknown>;

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  if (typeof category !== "string" || !category.trim()) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  const transaction = await prisma.costTransaction.create({
    data: {
      userId: user.id,
      amount,
      category: category.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      date: date ? new Date(date as string) : new Date(),
      source: "manual",
    },
  });

  return NextResponse.json(
    {
      id: transaction.id,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date.toISOString(),
      source: transaction.source,
      createdAt: transaction.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
