export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  return dateString === getToday();
}

export function isYesterday(dateString: string | null): boolean {
  if (!dateString) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split("T")[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function parseCostString(costString: string): number {
  // Parse strings like "$256", "$300-400", "$0 (FREE)"
  const match = costString.match(/\$?([\d,]+)/);
  if (match) {
    return parseFloat(match[1].replace(",", ""));
  }
  return 0;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

