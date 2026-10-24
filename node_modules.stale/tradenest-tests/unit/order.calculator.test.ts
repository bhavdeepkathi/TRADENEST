import { describe, it, expect } from 'vitest';

export interface CouponRule {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  isActive: boolean;
}

export function calculateOrderSummary(
  subtotal: number,
  coupon?: CouponRule | null,
  now: Date = new Date()
) {
  const shipping = subtotal > 499 ? 0 : 99;
  let discount = 0;
  let couponError: string | null = null;

  if (coupon) {
    if (!coupon.isActive) {
      couponError = 'Coupon is inactive';
    } else if (coupon.expiresAt && coupon.expiresAt < now) {
      couponError = 'Coupon has expired';
    } else if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      couponError = `Minimum order value of ₹${coupon.minOrderValue} required`;
    } else {
      if (coupon.type === 'PERCENTAGE') {
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }
      discount = Math.min(discount, subtotal);
    }
  }

  const finalSubtotal = Math.max(0, subtotal - discount);
  const total = finalSubtotal + shipping;

  return {
    subtotal,
    shipping,
    discount,
    total,
    couponError,
    couponValid: coupon ? !couponError : false,
  };
}

describe('Order & Coupon Calculator Unit Tests', () => {
  describe('Shipping calculation', () => {
    it('applies ₹99 shipping for cart below ₹499', () => {
      const summary = calculateOrderSummary(400);
      expect(summary.shipping).toBe(99);
      expect(summary.total).toBe(499);
    });

    it('applies FREE shipping for cart equal to or greater than ₹499', () => {
      const summary500 = calculateOrderSummary(500);
      expect(summary500.shipping).toBe(0);
      expect(summary500.total).toBe(500);
    });
  });

  describe('Percentage Coupon discount', () => {
    const coupon: CouponRule = {
      code: 'SAVE10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 500,
      maxDiscount: 200,
      isActive: true,
    };

    it('calculates 10% discount correctly when criteria met', () => {
      const summary = calculateOrderSummary(1000, coupon);
      expect(summary.couponValid).toBe(true);
      expect(summary.discount).toBe(100);
      expect(summary.total).toBe(900); // 1000 - 100 + 0 shipping
    });

    it('caps percentage discount at maxDiscount', () => {
      const summary = calculateOrderSummary(3000, coupon);
      expect(summary.couponValid).toBe(true);
      expect(summary.discount).toBe(200); // Capped at 200 rather than 300
    });

    it('rejects coupon if subtotal is below minOrderValue', () => {
      const summary = calculateOrderSummary(400, coupon);
      expect(summary.couponValid).toBe(false);
      expect(summary.discount).toBe(0);
      expect(summary.couponError).toContain('Minimum order value');
    });
  });

  describe('Flat Coupon discount', () => {
    const flatCoupon: CouponRule = {
      code: 'FLAT150',
      type: 'FLAT',
      value: 150,
      minOrderValue: 300,
      isActive: true,
    };

    it('deducts exact flat discount', () => {
      const summary = calculateOrderSummary(600, flatCoupon);
      expect(summary.couponValid).toBe(true);
      expect(summary.discount).toBe(150);
      expect(summary.total).toBe(450);
    });

    it('does not allow discount to exceed order subtotal', () => {
      const largeFlat: CouponRule = {
        code: 'MEGA500',
        type: 'FLAT',
        value: 500,
        isActive: true,
      };
      const summary = calculateOrderSummary(350, largeFlat);
      expect(summary.discount).toBe(350);
      expect(summary.total).toBe(99); // 0 + 99 shipping
    });
  });

  describe('Coupon Expiry and Inactive status', () => {
    it('rejects expired coupon', () => {
      const expiredCoupon: CouponRule = {
        code: 'EXPIRED20',
        type: 'PERCENTAGE',
        value: 20,
        expiresAt: new Date('2024-01-01'),
        isActive: true,
      };
      const summary = calculateOrderSummary(1000, expiredCoupon, new Date('2026-10-24'));
      expect(summary.couponValid).toBe(false);
      expect(summary.couponError).toBe('Coupon has expired');
    });

    it('rejects inactive coupon', () => {
      const disabledCoupon: CouponRule = {
        code: 'OFF20',
        type: 'PERCENTAGE',
        value: 20,
        isActive: false,
      };
      const summary = calculateOrderSummary(1000, disabledCoupon);
      expect(summary.couponValid).toBe(false);
      expect(summary.couponError).toBe('Coupon is inactive');
    });
  });
});
