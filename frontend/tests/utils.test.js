import { describe, it, expect } from 'vitest';
import { etb, num, fmtDate } from '../src/utils.js';

describe('Utility Functions', () => {
  describe('etb - Currency Formatter', () => {
    it('should format numbers as ETB currency', () => {
      expect(etb(2500)).toBe('ETB 2,500');
      expect(etb(1000000)).toBe('ETB 1,000,000');
    });

    it('should handle decimal numbers', () => {
      expect(etb(2500.50)).toBe('ETB 2,500.5');
    });

    it('should handle zero', () => {
      expect(etb(0)).toBe('ETB 0');
    });
  });

  describe('num - Number Formatter', () => {
    it('should format numbers with commas', () => {
      expect(num(1000)).toBe('1,000');
      expect(num(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(num(10)).toBe('10');
      expect(num(100)).toBe('100');
    });
  });

  describe('fmtDate - Date Formatter', () => {
    it('should format dates correctly', () => {
      const date = '2026-10-17';
      const formatted = fmtDate(date);
      expect(formatted).toMatch(/\d{1,2} \w{3} \d{4}/);
    });
  });
});
