import { describe, test, expect } from 'vitest';
import { etb, num, fmtDate } from '../utils.js';

describe('Utility Functions', () => {
  describe('etb - Currency Formatting', () => {
    test('formats numbers with ETB prefix', () => {
      expect(etb(1000)).toBe('ETB 1,000');
      expect(etb(2500.50)).toBe('ETB 2,500.5');
    });

    test('handles zero', () => {
      expect(etb(0)).toBe('ETB 0');
    });

    test('handles large numbers', () => {
      expect(etb(1000000)).toBe('ETB 1,000,000');
    });
  });

  describe('num - Number Formatting', () => {
    test('formats numbers with commas', () => {
      expect(num(1000)).toBe('1,000');
      expect(num(1000000)).toBe('1,000,000');
    });

    test('handles decimals', () => {
      expect(num(1234.56)).toBe('1,234.56');
    });
  });

  describe('fmtDate - Date Formatting', () => {
    test('formats date correctly', () => {
      const date = '2026-10-17';
      const formatted = fmtDate(date);
      expect(formatted).toMatch(/\d{1,2} \w{3} \d{4}/);
    });
  });
});
