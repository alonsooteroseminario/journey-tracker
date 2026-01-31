import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateId, getToday } from './storage';

describe('storage utilities', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();
      
      const timestamp = parseInt(id.split('-')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should include random component', () => {
      const id = generateId();
      const parts = id.split('-');
      
      expect(parts).toHaveLength(2);
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });

  describe('getToday', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const today = getToday();
      
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should match current date', () => {
      const today = getToday();
      const expected = new Date().toISOString().split('T')[0];
      
      expect(today).toBe(expected);
    });

    it('should not include time component', () => {
      const today = getToday();
      
      expect(today).not.toContain('T');
      expect(today).not.toContain(':');
      expect(today.length).toBe(10);
    });

    it('should be consistent within same execution', () => {
      const today1 = getToday();
      const today2 = getToday();
      
      expect(today1).toBe(today2);
    });
  });
});
