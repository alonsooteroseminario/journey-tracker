import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateId, formatCurrency, parseCostString, getWeekStart, addDays } from './storage';

vi.mock('./dateUtils', () => ({
  getTodayInTimezone: vi.fn().mockReturnValue('2024-01-15'),
  isTodayInTimezone: vi.fn().mockReturnValue(true),
  isYesterdayInTimezone: vi.fn().mockReturnValue(false),
}));

describe('storage utilities', () => {
  describe('generateId', () => {
    it('generates a non-empty string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates unique IDs', () => {
      const ids = new Set([generateId(), generateId(), generateId()]);
      expect(ids.size).toBe(3);
    });
  });

  describe('formatCurrency', () => {
    it('formats a number as CAD currency', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234.56');
    });

    it('formats zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0.00');
    });
  });

  describe('parseCostString', () => {
    it('parses a dollar amount', () => {
      expect(parseCostString('$256')).toBe(256);
    });

    it('parses the first amount from a range', () => {
      expect(parseCostString('$300-400')).toBe(300);
    });

    it('parses amounts with commas', () => {
      expect(parseCostString('$1,000')).toBe(1000);
    });

    it('returns 0 when no amount found', () => {
      expect(parseCostString('FREE')).toBe(0);
    });
  });

  describe('getWeekStart', () => {
    it('returns the Monday of the week for a Wednesday', () => {
      const wednesday = new Date('2024-01-17'); // Wednesday
      const weekStart = getWeekStart(wednesday);
      expect(weekStart.getDay()).toBe(1); // Monday
    });

    it('returns the previous Monday for a Sunday', () => {
      const sunday = new Date('2024-01-21'); // Sunday
      const weekStart = getWeekStart(sunday);
      expect(weekStart.getDay()).toBe(1); // Monday
    });
  });

  describe('addDays', () => {
    it('adds days to a date', () => {
      const date = new Date('2024-01-01');
      const result = addDays(date, 7);
      expect(result.toISOString().startsWith('2024-01-08')).toBe(true);
    });

    it('does not mutate the original date', () => {
      const date = new Date('2024-01-01');
      addDays(date, 5);
      expect(date.toISOString().startsWith('2024-01-01')).toBe(true);
    });
  });
});
