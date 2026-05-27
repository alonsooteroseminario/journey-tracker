import { describe, it, expect, vi, afterEach } from 'vitest';
import { getTodayInTimezone, isTodayInTimezone, isYesterdayInTimezone, isInReminderWindow } from './dateUtils';

describe('dateUtils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayInTimezone', () => {
    it('returns YYYY-MM-DD format', () => {
      const result = getTodayInTimezone('America/Vancouver');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns correct date for UTC', () => {
      const result = getTodayInTimezone('UTC');
      const expected = new Date().toISOString().split('T')[0];
      expect(result).toBe(expected);
    });

    it('handles null timezone by using runtime default', () => {
      const result = getTodayInTimezone(null);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles undefined timezone by using runtime default', () => {
      const result = getTodayInTimezone();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns different date when UTC has crossed midnight but local timezone has not', () => {
      // Mock: Jan 15 at 7:00 AM UTC = Jan 14 at 11:00 PM in Vancouver (UTC-8)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T07:00:00Z'));

      const utcDate = getTodayInTimezone('UTC');
      const vancouverDate = getTodayInTimezone('America/Vancouver');

      expect(utcDate).toBe('2025-01-15');
      expect(vancouverDate).toBe('2025-01-14');
    });

    it('returns same date when both timezones are in the same calendar day', () => {
      // Mock: Jan 15 at 5:00 PM UTC = Jan 15 at 9:00 AM in Vancouver
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T17:00:00Z'));

      const utcDate = getTodayInTimezone('UTC');
      const vancouverDate = getTodayInTimezone('America/Vancouver');

      expect(utcDate).toBe('2025-01-15');
      expect(vancouverDate).toBe('2025-01-15');
    });
  });

  describe('isTodayInTimezone', () => {
    it('returns false for null', () => {
      expect(isTodayInTimezone(null, 'UTC')).toBe(false);
    });

    it('returns true when date matches today in timezone', () => {
      const today = getTodayInTimezone('America/Vancouver');
      expect(isTodayInTimezone(today, 'America/Vancouver')).toBe(true);
    });

    it('returns false when date does not match today', () => {
      expect(isTodayInTimezone('2020-01-01', 'UTC')).toBe(false);
    });

    it('correctly distinguishes timezone boundary', () => {
      vi.useFakeTimers();
      // 7 AM UTC on Jan 15 = 11 PM Jan 14 in Vancouver
      vi.setSystemTime(new Date('2025-01-15T07:00:00Z'));

      // "2025-01-15" is today in UTC but NOT today in Vancouver
      expect(isTodayInTimezone('2025-01-15', 'UTC')).toBe(true);
      expect(isTodayInTimezone('2025-01-15', 'America/Vancouver')).toBe(false);

      // "2025-01-14" is today in Vancouver but NOT in UTC
      expect(isTodayInTimezone('2025-01-14', 'America/Vancouver')).toBe(true);
      expect(isTodayInTimezone('2025-01-14', 'UTC')).toBe(false);
    });
  });

  describe('isYesterdayInTimezone', () => {
    it('returns false for null', () => {
      expect(isYesterdayInTimezone(null, 'UTC')).toBe(false);
    });

    it('returns true for yesterdays date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      expect(isYesterdayInTimezone('2025-01-14', 'UTC')).toBe(true);
      expect(isYesterdayInTimezone('2025-01-13', 'UTC')).toBe(false);
    });

    it('uses timezone for yesterday calculation', () => {
      vi.useFakeTimers();
      // 7 AM UTC on Jan 15 = 11 PM Jan 14 in Vancouver
      vi.setSystemTime(new Date('2025-01-15T07:00:00Z'));

      // In UTC: today is Jan 15, yesterday is Jan 14
      expect(isYesterdayInTimezone('2025-01-14', 'UTC')).toBe(true);

      // In Vancouver: today is Jan 14, yesterday is Jan 13
      expect(isYesterdayInTimezone('2025-01-13', 'America/Vancouver')).toBe(true);
      expect(isYesterdayInTimezone('2025-01-14', 'America/Vancouver')).toBe(false);
    });
  });

  describe('isInReminderWindow', () => {
    it('returns true when no stop time and current hour >= start hour', () => {
      expect(isInReminderWindow(10, '09:00', null)).toBe(true);
      expect(isInReminderWindow(9, '09:00', undefined)).toBe(true);
    });

    it('returns false when no stop time and current hour < start hour', () => {
      expect(isInReminderWindow(8, '09:00', null)).toBe(false);
    });

    it('normal daytime window: active when startHour <= hour < stopHour', () => {
      expect(isInReminderWindow(9, '09:00', '22:00')).toBe(true);
      expect(isInReminderWindow(15, '09:00', '22:00')).toBe(true);
      expect(isInReminderWindow(21, '09:00', '22:00')).toBe(true);
    });

    it('normal daytime window: inactive outside window', () => {
      expect(isInReminderWindow(8, '09:00', '22:00')).toBe(false);
      expect(isInReminderWindow(22, '09:00', '22:00')).toBe(false);
      expect(isInReminderWindow(23, '09:00', '22:00')).toBe(false);
    });

    it('overnight window: active when hour >= startHour or hour < stopHour', () => {
      expect(isInReminderWindow(22, '22:00', '06:00')).toBe(true);
      expect(isInReminderWindow(23, '22:00', '06:00')).toBe(true);
      expect(isInReminderWindow(0, '22:00', '06:00')).toBe(true);
      expect(isInReminderWindow(5, '22:00', '06:00')).toBe(true);
    });

    it('overnight window: inactive inside quiet period', () => {
      expect(isInReminderWindow(6, '22:00', '06:00')).toBe(false);
      expect(isInReminderWindow(10, '22:00', '06:00')).toBe(false);
      expect(isInReminderWindow(21, '22:00', '06:00')).toBe(false);
    });

    it('NaN guard: malformed startTime falls back to always active (>= 0)', () => {
      expect(isInReminderWindow(5, 'bad', '22:00')).toBe(true);
      expect(isInReminderWindow(0, 'bad', '22:00')).toBe(true);
    });

    it('NaN guard: malformed stopTime falls back to start-only check', () => {
      expect(isInReminderWindow(10, '09:00', 'bad')).toBe(true);   // >= 09:00
      expect(isInReminderWindow(8, '09:00', 'bad')).toBe(false);   // < 09:00
    });
  });
});
