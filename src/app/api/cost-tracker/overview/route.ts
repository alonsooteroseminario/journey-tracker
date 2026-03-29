import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.costTransaction.findMany({
    where: {
      userId: user.id,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  let budget = await prisma.budget.findUnique({ where: { userId: user.id } });
  if (!budget) {
    budget = await prisma.budget.create({ data: { userId: user.id, monthlyLimit: 100 } });
  }

  const percentUsed =
    budget.monthlyLimit > 0 ? Math.round((total / budget.monthlyLimit) * 100) : 0;

  const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return NextResponse.json({
    total: Math.round(total * 100) / 100,
    month,
    percentUsed,
    budget: budget.monthlyLimit,
  });
}
