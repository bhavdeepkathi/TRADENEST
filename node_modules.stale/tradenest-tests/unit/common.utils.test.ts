import { describe, it, expect } from 'vitest';
import { generateSlug, generateOrderNumber, generateOTP, calculateDiscount, formatCurrency, maskEmail, maskPhone } from '@tradenest/common';

describe('Common Utilities', () => {
  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Product @#$%^&*()')).toBe('product');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should trim leading/trailing dashes', () => {
      expect(generateSlug('-Leading and Trailing-')).toBe('leading-and-trailing');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate order number with correct format', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
    });

    it('should generate unique numbers on consecutive calls', () => {
      const num1 = generateOrderNumber();
      const num2 = generateOrderNumber();
      expect(num1).not.toBe(num2);
    });
  });

  describe('generateOTP', () => {
    it('should generate 6-digit OTP by default', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate OTP of specified length', () => {
      const otp = generateOTP(4);
      expect(otp).toMatch(/^\d{4}$/);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate correct discount percentage', () => {
      expect(calculateDiscount(100, 80)).toBe(20);
    });

    it('should return 0 when price >= mrp', () => {
      expect(calculateDiscount(100, 100)).toBe(0);
      expect(calculateDiscount(120, 100)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format INR correctly', () => {
      expect(formatCurrency(1234.56, 'INR')).toBe('₹1,234.56');
    });

    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
    });

    it('should handle short local part', () => {
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number', () => {
      expect(maskPhone('+91 98765 43210')).toBe('****43210');
    });

    it('should handle short numbers', () => {
      expect(maskPhone('123')).toBe('123');
    });
  });
});