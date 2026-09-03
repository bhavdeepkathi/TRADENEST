export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProvider {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  UPI = 'UPI',
  WALLET = 'WALLET',
}

export enum CouponType {
  PERCENT = 'PERCENT',
  FLAT = 'FLAT',
}

export enum NotificationType {
  ORDER = 'ORDER',
  PROMO = 'PROMO',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  SHIPPING = 'SHIPPING',
}

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
}