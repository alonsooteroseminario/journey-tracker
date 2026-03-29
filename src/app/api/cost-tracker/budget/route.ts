import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function getBudgetData(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  let budget = await prisma.budget.findUnique({ where: { userId } });
  if (!budget) {
    budget = await prisma.budget.create({ data: { userId, monthlyLimit: 100 } });
  }

  const transactions = await prisma.costTransaction.findMany({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
  });

  const spentSoFar = transactions.reduce((sum, t) => sum + t.amount, 0);
  const percentUsed =
    budget.monthlyLimit > 0 ? Math.round((spentSoFar / budget.monthlyLimit) * 100) : 0;

  const categoryLimits = (budget.categoryLimits as Record<string, number>) ?? {};

  // Compute per-category spending
  const categorySpend: Record<string, number> = {};
  for (const t of transactions) {
    categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
  }

  const alerts: string[] = [];
  if (percentUsed >= 100) {
    alerts.push(`Monthly budget exceeded: $${spentSoFar.toFixed(2)} of $${budget.monthlyLimit.toFixed(2)}`);
  } else if (percentUsed >= 90) {
    alerts.push(`Warning: ${percentUsed}% of monthly budget used`);
  } else if (percentUsed >= 75) {
    alerts.push(`${percentUsed}% of monthly budget used`);
  }

  for (const [cat, limit] of Object.entries(categoryLimits)) {
    const spent = categorySpend[cat] || 0;
    const catPercent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    if (catPercent >= 100) {
      alerts.push(`${cat} budget exceeded: $${spent.toFixed(2)} of $${limit.toFixed(2)}`);
    } else if (catPercent >= 90) {
      alerts.push(`${cat} at ${catPercent}% of budget`);
    }
  }

  return {
    monthlyLimit: budget.monthlyLimit,
    categoryLimits,
    spentSoFar: Math.round(spentSoFar * 100) / 100,
    percentUsed,
    alerts,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getBudgetData(user.id));
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { monthlyLimit, categoryLimits } = body as Record<string, unknown>;

  if (typeof monthlyLimit !== "number" || monthlyLimit < 0) {
    return NextResponse.json({ error: "monthlyLimit must be a non-negative number" }, { status: 400 });
  }

  await prisma.budget.upsert({
    where: { userId: user.id },
    update: {
      monthlyLimit,
      ...(categoryLimits !== undefined && { categoryLimits: categoryLimits as object }),
    },
    create: {
      userId: user.id,
      monthlyLimit,
      ...(categoryLimits !== undefined && { categoryLimits: categoryLimits as object }),
    },
  });

  return NextResponse.json(await getBudgetData(user.id));
}
