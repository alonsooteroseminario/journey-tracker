import { getTodayInTimezone, isTodayInTimezone, isYesterdayInTimezone } from './dateUtils';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getToday(timezone?: string | null): string {
  return getTodayInTimezone(timezone);
}

export function isToday(dateString: string | null, timezone?: string | null): boolean {
  return isTodayInTimezone(dateString, timezone);
}

export function isYesterday(dateString: string | null, timezone?: string | null): boolean {
  return isYesterdayInTimezone(dateString, timezone);
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

