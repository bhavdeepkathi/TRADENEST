import { z } from 'zod';
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  CouponType,
  NotificationType,
  ReturnStatus,
  KYCStatus,
  ProductStatus,
} from './enums';

// ===========================================
// Base Types
// ===========================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

// ===========================================
// Auth DTOs
// ===========================================

export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const VerifyOtpDtoSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpDtoSchema>;

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type TokenPair = z.infer<typeof TokenPairSchema>;

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// ===========================================
// User DTOs
// ===========================================

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: z.nativeEnum(UserRole),
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UpdateProfileDtoSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

// ===========================================
// Address DTOs
// ===========================================

export const AddressDtoSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(50),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{6}$/),
  country: z.string().length(2).default('IN'),
  isDefault: z.boolean().default(false),
});

export type AddressDto = z.infer<typeof AddressDtoSchema>;

export const CreateAddressDtoSchema = AddressDtoSchema.omit({ id: true });
export type CreateAddressDto = z.infer<typeof CreateAddressDtoSchema>;

export const UpdateAddressDtoSchema = CreateAddressDtoSchema.partial();
export type UpdateAddressDto = z.infer<typeof UpdateAddressDtoSchema>;

// ===========================================
// Product DTOs
// ===========================================

export const ProductQuerySchema = PaginationQuerySchema.extend({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  inStock: z.coerce.boolean().optional(),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;

export const CreateProductDtoSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  price: z.number().positive().max(999999.99),
  mrp: z.number().positive().max(999999.99).optional(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  images: z.array(z.string().url()).max(10).default([]),
});

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;

export const UpdateProductDtoSchema = CreateProductDtoSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional(),
});
export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>;

export const ProductResponseSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  categoryId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number(),
  mrp: z.number().nullable(),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  status: z.nativeEnum(ProductStatus),
  ratingAvg: z.number().optional(),
  reviewCount: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;

// ===========================================
// Category DTOs
// ===========================================

export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  children?: CategoryResponse[];
  productCount?: number;
  createdAt: Date;
};

export const CategoryResponseSchema: z.ZodType<CategoryResponse> = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  children: z.array(z.lazy(() => CategoryResponseSchema)).optional(),
  productCount: z.number().optional(),
  createdAt: z.date(),
});

export const CreateCategoryDtoSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategoryDtoSchema>;

// ===========================================
// Cart DTOs
// ===========================================

export const CartItemDtoSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(99),
});

export type CartItemDto = z.infer<typeof CartItemDtoSchema>;

export const CartResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(CartItemDtoSchema.extend({
    product: ProductResponseSchema,
    subtotal: z.number(),
  })),
  subtotal: z.number(),
  itemCount: z.number(),
  updatedAt: z.date(),
});

export type CartResponse = z.infer<typeof CartResponseSchema>;

// ===========================================
// Wishlist DTOs
// ===========================================

export const WishlistResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    product: ProductResponseSchema,
    addedAt: z.date(),
  })),
  updatedAt: z.date(),
});

export type WishlistResponse = z.infer<typeof WishlistResponseSchema>;

// ===========================================
// Order DTOs
// ===========================================

export const CreateOrderDtoSchema = z.object({
  shippingAddressId: z.string().uuid(),
  paymentMethod: z.nativeEnum(PaymentProvider),
  couponCode: z.string().max(50).optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;

export const OrderItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sellerId: z.string(),
  title: z.string(),
  price: z.number(),
  quantity: z.number(),
  discount: z.number(),
  subtotal: z.number(),
});

export type OrderItemResponse = z.infer<typeof OrderItemResponseSchema>;

export const OrderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.nativeEnum(OrderStatus),
  subtotal: z.number(),
  tax: z.number(),
  shipping: z.number(),
  discount: z.number(),
  total: z.number(),
  couponCode: z.string().nullable(),
  shippingAddress: z.record(z.any()),
  billingAddress: z.record(z.any()),
  items: z.array(OrderItemResponseSchema),
  payment: z.object({
    id: z.string(),
    provider: z.nativeEnum(PaymentProvider),
    status: z.nativeEnum(PaymentStatus),
    amount: z.number(),
  }).nullable(),
  invoice: z.object({
    id: z.string(),
    number: z.string(),
    pdfUrl: z.string().url(),
  }).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type OrderQuery = z.infer<typeof OrderQuerySchema>;

// ===========================================
// Payment DTOs
// ===========================================

export const CreatePaymentIntentDtoSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.nativeEnum(PaymentProvider),
});

export type CreatePaymentIntentDto = z.infer<typeof CreatePaymentIntentDtoSchema>;

export const PaymentIntentResponseSchema = z.object({
  provider: z.nativeEnum(PaymentProvider),
  orderId: z.string(),
  amount: z.number(),
  currency: z.string().default('INR'),
  // Provider-specific fields
  razorpayOrderId: z.string().optional(),
  stripeClientSecret: z.string().optional(),
  upiIntent: z.string().optional(),
});

export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>;

export const RefundDtoSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().min(5).max(500),
});

export type RefundDto = z.infer<typeof RefundDtoSchema>;

// ===========================================
// Coupon DTOs
// ===========================================

export const CouponResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  type: z.nativeEnum(CouponType),
  value: z.number(),
  minOrder: z.number().nullable(),
  maxDiscount: z.number().nullable(),
  startAt: z.date(),
  endAt: z.date(),
  usageLimit: z.number(),
  usedCount: z.number(),
  isActive: z.boolean(),
});

export type CouponResponse = z.infer<typeof CouponResponseSchema>;

export const CreateCouponDtoSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/),
  description: z.string().max(200),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  minOrder: z.number().positive().optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  usageLimit: z.number().int().positive().default(1),
});

export type CreateCouponDto = z.infer<typeof CreateCouponDtoSchema>;

// ===========================================
// Review DTOs
// ===========================================

export const CreateReviewDtoSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

export type CreateReviewDto = z.infer<typeof CreateReviewDtoSchema>;

export const ReviewResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  productId: z.string(),
  rating: z.number(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  images: z.array(z.string()),
  isVerifiedPurchase: z.boolean(),
  createdAt: z.date(),
});

export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

// ===========================================
// Notification DTOs
// ===========================================

export const NotificationResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(),
  read: z.boolean(),
  createdAt: z.date(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

// ===========================================
// Seller DTOs
// ===========================================

export const SellerApplicationDtoSchema = z.object({
  storeName: z.string().min(2).max(100),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  bankAccount: z.object({
    accountNumber: z.string().min(9).max(18),
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    accountHolderName: z.string().min(2).max(100),
  }).optional(),
});

export type SellerApplicationDto = z.infer<typeof SellerApplicationDtoSchema>;

export const SellerResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storeName: z.string(),
  gstin: z.string().nullable(),
  kycStatus: z.nativeEnum(KYCStatus),
  kycRejectionReason: z.string().nullable(),
  totalRevenue: z.number(),
  totalOrders: z.number(),
  rating: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SellerResponse = z.infer<typeof SellerResponseSchema>;

// ===========================================
// Inventory DTOs
// ===========================================

export const InventoryResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sellerId: z.string(),
  quantity: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().positive(),
  updatedAt: z.date(),
});

export type InventoryResponse = z.infer<typeof InventoryResponseSchema>;

export const UpdateInventoryDtoSchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().positive().optional(),
});

export type UpdateInventoryDto = z.infer<typeof UpdateInventoryDtoSchema>;

// ===========================================
// Return DTOs
// ===========================================

export const CreateReturnDtoSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  images: z.array(z.string().url()).max(5).default([]),
});

export type CreateReturnDto = z.infer<typeof CreateReturnDtoSchema>;

export const ProcessReturnDtoSchema = z.object({
  status: z.enum([ReturnStatus.APPROVED, ReturnStatus.REJECTED]),
  rejectionReason: z.string().max(500).optional(),
});

export type ProcessReturnDto = z.infer<typeof ProcessReturnDtoSchema>;

export const ReturnResponseSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  sellerId: z.string(),
  userId: z.string(),
  reason: z.string(),
  status: z.nativeEnum(ReturnStatus),
  rejectionReason: z.string().nullable(),
  images: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReturnResponse = z.infer<typeof ReturnResponseSchema>;

// ===========================================
// AI Recommendation DTOs
// ===========================================

export const RecommendationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  type: z.enum(['PERSONALIZED', 'TRENDING', 'SIMILAR', 'CROSS_SELL', 'UP_SELL']).default('PERSONALIZED'),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type RecommendationQuery = z.infer<typeof RecommendationQuerySchema>;

export const RecommendationResponseSchema = z.object({
  productId: z.string(),
  score: z.number(),
  reason: z.string().optional(),
});

export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;