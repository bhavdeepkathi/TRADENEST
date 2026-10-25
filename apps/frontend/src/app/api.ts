import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { RootState } from './store'
import { setCredentials, logout } from '../features/auth/authSlice'

const baseUrl = import.meta.env.VITE_API_URL || '/api'

const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

let refreshPromise: Promise<boolean> | null = null

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && (result.error.status === 401 || (result.error.data as any)?.code === 'AUTHENTICATION_ERROR')) {
    const url = typeof args === 'string' ? args : args.url
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return result
    }

    const state = api.getState() as RootState
    const refreshToken = state.auth.refreshToken

    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshResult = await baseQuery(
              {
                url: '/auth/refresh',
                method: 'POST',
                body: { refreshToken },
              },
              api,
              extraOptions
            )

            if (refreshResult.data) {
              const data = refreshResult.data as { accessToken: string; refreshToken: string }
              const currentState = api.getState() as RootState
              if (currentState.auth.user) {
                api.dispatch(
                  setCredentials({
                    user: currentState.auth.user,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken || refreshToken,
                  })
                )
              }
              return true
            } else {
              api.dispatch(logout())
              return false
            }
          } catch {
            api.dispatch(logout())
            return false
          } finally {
            refreshPromise = null
          }
        })()
      }

      const refreshed = await refreshPromise
      if (refreshed) {
        result = await baseQuery(args, api, extraOptions)
      }
    } else {
      api.dispatch(logout())
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Product', 'Category', 'Order', 'User', 'Cart', 'Wishlist', 'Payment', 'Address', 'Notification', 'Coupon'],
  endpoints: (builder) => ({
    login: builder.mutation<{
      accessToken: string
      refreshToken: string
    }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<{
      message: string
      devOtp?: string
    }, { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    googleLogin: builder.mutation<{
      accessToken: string
      refreshToken: string
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        avatarUrl: string | null
        role: string
        isVerified: boolean
      }
    }, { credential: string; role?: string }>({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
    }),
    resendOtp: builder.mutation<{
      message: string
      devOtp?: string
      sentViaSmtp?: boolean
    }, { email: string }>({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<{
      accessToken: string
      refreshToken: string
    }, { email: string; otp: string }>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),
    getMe: builder.query<{
      id: string
      email: string
      firstName: string
      lastName: string
      phone: string | null
      avatarUrl: string | null
      role: string
      isVerified: boolean
      isActive: boolean
    }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<{
      id: string
      email: string
      firstName: string
      lastName: string
      phone: string | null
      avatarUrl: string | null
      role: string
      isVerified: boolean
      isActive: boolean
    }, { firstName?: string; lastName?: string; phone?: string | null; avatarUrl?: string | null }>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

    // Products
    getProducts: builder.query<{
      data: Array<{
        id: string
        title: string
        slug: string
        categoryId: string
        brand: string
        subcategory: string
        description: string
        price: number
        mrp: number | null
        discountPercent: number
        images: string[]
        tags: string[]
        status: string
        ratingAvg: number | null
        reviewCount: number
        category: { id: string; name: string; slug: string }
        inventory: { quantity: number; reserved: number } | null
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { page?: number; limit?: number; q?: string; categoryId?: string; brand?: string; subcategory?: string; minPrice?: number; maxPrice?: number; rating?: number; minDiscount?: number; inStock?: boolean; status?: string; sort?: string; order?: string }>({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query<{
      id: string
      title: string
      slug: string
      categoryId: string
      brand: string
      subcategory: string
      description: string
      price: number
      mrp: number | null
      discountPercent: number
      images: string[]
      tags: string[]
      status: string
      ratingAvg: number | null
      reviewCount: number
      category: { id: string; name: string; slug: string }
      inventory: { quantity: number; reserved: number } | null
      reviews: Array<{ id: string; rating: number; title: string | null; body: string | null; createdAt: string; user: { firstName: string; lastName: string } }>
    }, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getSellerProducts: builder.query<{
      data: Array<{
        id: string
        sellerId: string
        categoryId: string
        title: string
        slug: string
        description: string
        price: number
        mrp: number | null
        images: string[]
        tags: string[]
        status: string
        ratingAvg: number | null
        reviewCount: number
        createdAt: string
        updatedAt: string
        category: { id: string; name: string; slug: string }
        inventory: { quantity: number; reserved: number } | null
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/products',
        params: { ...params, sellerId: 'me' },
      }),
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation<{
      id: string
      sellerId: string
      categoryId: string
      title: string
      slug: string
      description: string
      price: number
      mrp: number | null
      images: string[]
      tags: string[]
      status: string
      createdAt: string
      updatedAt: string
    }, {
      title: string
      brand?: string
      subcategory?: string
      description: string
      price: number
      mrp?: number
      categoryId: string
      tags?: string[]
      images?: string[]
      discountPercent?: number
      stockQuantity?: number
    }>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation<{
      id: string
      sellerId: string
      categoryId: string
      title: string
      slug: string
      description: string
      price: number
      mrp: number | null
      images: string[]
      tags: string[]
      status: string
      updatedAt: string
    }, { id: string; body: {
      title?: string
      brand?: string
      subcategory?: string
      description?: string
      price?: number
      mrp?: number
      categoryId?: string
      tags?: string[]
      images?: string[]
      discountPercent?: number
      status?: string
      stockQuantity?: number
    }}>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    uploadProductImage: builder.mutation<{ url: string }, File>({
      query: (file) => ({
        url: '/products/images',
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type },
      }),
      transformResponse: (response: { url: string }) => ({
        url: new URL(response.url, new URL(baseUrl, window.location.origin)).toString(),
      }),
    }),
    
    // Categories
    getCategories: builder.query<Array<{
      id: string
      name: string
      slug: string
      description: string | null
      parentId: string | null
      children?: Array<{ id: string; name: string; slug: string }>
    }>, void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    
    // Cart
    getCart: builder.query<{
      id: string
      items: Array<{
        id: string
        productId: string
        quantity: number
        product: {
          id: string
          title: string
          price: number
          mrp: number | null
          images: string[]
        }
        subtotal: number
      }>
      subtotal: number
      itemCount: number
    }, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<{ id: string }, { productId: string; quantity: number }>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<{ id: string }, { productId: string; quantity: number }>({
      query: ({ productId, ...body }) => ({ url: `/cart/items/${productId}`, method: 'PATCH', body }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation<void, string>({
      query: (productId) => ({ url: `/cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<void, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    
    // Orders
    getOrders: builder.query<{
      data: Array<{
        id: string
        userId: string
        status: string
        subtotal: number
        tax: number
        shipping: number
        discount: number
        total: number
        couponCode: string | null
        shippingAddress: Record<string, any>
        billingAddress: Record<string, any>
        items: Array<{
          id: string
          productId: string
          sellerId: string
          title: string
          price: number
          quantity: number
          discount: number
          product: { id: string; title: string; images: string[]; price: number }
        }>
        payment: {
          id: string
          provider: string
          status: string
          amount: number
          providerRef: string
        } | null
        invoice: { id: string; number: string; pdfUrl: string } | null
        returns?: Array<{
          id: string
          orderId: string
          sellerId: string
          userId: string
          reason: string
          status: string
          createdAt: string
        }>
        createdAt: string
        updatedAt: string
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query<{
      id: string
      userId: string
      status: string
      subtotal: number
      tax: number
      shipping: number
      discount: number
      total: number
      couponCode: string | null
      shippingAddress: Record<string, any>
      billingAddress: Record<string, any>
      items: Array<{
        id: string
        productId: string
        sellerId: string
        title: string
        price: number
        quantity: number
        discount: number
        product: { id: string; title: string; images: string[]; price: number }
      }>
      payment: {
        id: string
        provider: string
        status: string
        amount: number
        providerRef: string
        createdAt: string
      } | null
      invoice: { id: string; number: string; pdfUrl: string } | null
      returns?: Array<{
        id: string
        orderId: string
        sellerId: string
        userId: string
        reason: string
        status: string
        createdAt: string
      }>
      createdAt: string
      updatedAt: string
    }, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    // Seller Orders - Get order items for a specific seller
    getSellerOrderItems: builder.query<{
      data: Array<{
        id: string
        orderId: string
        productId: string
        sellerId: string
        title: string
        price: number
        quantity: number
        discount: number
        subtotal: number
        product: {
          id: string
          title: string
          slug?: string
          brand?: string
          subcategory?: string
          description?: string
          images: string[]
          price: number
          mrp?: number | null
          status?: string
          ratingAvg?: number | null
          reviewCount?: number
        }
        order: {
          id: string
          userId: string
          status: string
          total: number
          subtotal: number
          shipping: number
          discount: number
          couponCode: string | null
          shippingAddress: Record<string, any>
          billingAddress: Record<string, any>
          payment: { id: string; provider: string; status: string; amount: number; providerRef: string } | null
          createdAt: string
          updatedAt: string
        }
        createdAt: string
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { sellerId: string; page?: number; limit?: number; status?: string }>({
      query: ({ sellerId, ...params }) => ({ url: `/orders/seller/${sellerId}`, params }),
      providesTags: ['Order'],
    }),
    // Seller Orders - Get distinct orders for a seller (grouped by order)
    getSellerOrders: builder.query<{
      data: Array<{
        id: string
        userId: string
        status: string
        total: number
        subtotal: number
        shipping: number
        discount: number
        couponCode: string | null
        shippingAddress: Record<string, any>
        billingAddress: Record<string, any>
        payment: { id: string; provider: string; status: string; amount: number; providerRef: string } | null
        items: Array<{
          id: string
          productId: string
          sellerId: string
          title: string
          price: number
          quantity: number
          discount: number
          subtotal: number
          product: {
            id: string
            title: string
            slug?: string
            brand?: string
            subcategory?: string
            description?: string
            images: string[]
            price: number
            mrp?: number | null
            status?: string
            ratingAvg?: number | null
            reviewCount?: number
          }
        }>
        returns?: Array<{
          id: string
          orderId: string
          sellerId: string
          userId: string
          reason: string
          status: string
          createdAt: string
        }>
        createdAt: string
        updatedAt: string
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { sellerId: string; page?: number; limit?: number; status?: string }>({
      query: ({ sellerId, ...params }) => ({ url: `/orders/seller/${sellerId}/orders`, params }),
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation<{
      id: string
      userId: string
      status: string
      subtotal: number
      tax: number
      shipping: number
      discount: number
      total: number
      couponCode: string | null
      shippingAddress: Record<string, any>
      billingAddress: Record<string, any>
      items: Array<{
        id: string
        productId: string
        sellerId: string
        title: string
        price: number
        quantity: number
        discount: number
        product: { id: string; title: string; images: string[]; price: number }
      }>
      payment: {
        id: string
        provider: string
        status: string
        amount: number
        providerRef: string
      } | null
    }, {
      shippingAddress: {
        fullName: string
        phone: string
        line1: string
        line2?: string
        city: string
        state: string
        postalCode: string
        country: string
      }
      paymentMethod: string
      couponCode?: string
    }>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    confirmPayment: builder.mutation<{
      id: string
      status: string
      payment: { id: string; provider: string; status: string; amount: number }
    }, { orderId: string; paymentId: string; providerRef: string; provider: string }>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/confirm-payment`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation<{
      id: string
      status: string
    }, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Order'],
    }),
    
    // Payments
    createPaymentIntent: builder.mutation<{
      provider: string
      orderId: string
      amount: number
      currency: string
      razorpayOrderId?: string
      razorpayKeyId?: string
      stripeClientSecret?: string
      upiIntent?: string
      walletBalance?: number
      orderTotal?: number
      remainingBalance?: number
      paymentId: string
    }, { orderId: string; provider: string }>({
      query: (body) => ({ url: '/payments/intent', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
    verifyPayment: builder.mutation<{ success: boolean; payment: any }, { paymentId: string; provider: string; providerRef: string; razorpayPaymentId?: string; razorpaySignature?: string; stripePaymentIntentId?: string }>({
      query: (body) => ({ url: '/payments/verify', method: 'POST', body }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    
    // Wallet
    getWallet: builder.query<{
      id: string
      userId: string
      balance: number
      transactions: Array<{
        id: string
        type: string
        amount: number
        description: string
        reference: string | null
        createdAt: string
      }>
    }, void>({
      query: () => '/wallet',
      providesTags: ['Payment'],
    }),
    addToWallet: builder.mutation<{ id: string; balance: number }, { amount: number; paymentMethod: string }>({
      query: (body) => ({ url: '/wallet/add', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),

    // Product Reviews
    getProductReviews: builder.query<{
      data: Array<{
        id: string
        productId: string
        userId: string
        rating: number
        title: string | null
        body: string | null
        isVerifiedPurchase: boolean
        createdAt: string
      }>
    }, string>({
      query: (productId) => `/products/${productId}/reviews`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProductReview: builder.mutation<{
      id: string
      productId: string
      userId: string
      rating: number
      title: string | null
      body: string | null
      isVerifiedPurchase: boolean
    }, { productId: string; rating: number; title?: string; body?: string }>({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }, 'Order'],
    }),

    // Order Return Request
    createReturnRequest: builder.mutation<{
      id: string
      orderId: string
      userId: string
      sellerId: string
      reason: string
      status: string
      createdAt: string
    }, { orderId: string; reason: string }>({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/return`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),
    processReturnRequest: builder.mutation<{
      message: string
      returnRequest: any
    }, { orderId: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }>({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/return/process`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Order'],
    }),

    // Seller Analytics
    getSellerAnalytics: builder.query<{
      period: string
      totalProducts: number
      totalOrders: number
      totalRevenue: number
      avgOrderValue: number
      statusCounts: Record<string, number>
      topProducts: Array<{ id: string; title: string; price: number; sales: number; revenue: number }>
      timeSeries: Array<{ date: string; revenue: number; orders: number }>
    }, { period?: string } | void>({
      query: (params) => ({
        url: '/orders/seller/me/analytics',
        params: params || undefined,
      }),
      providesTags: ['Order', 'Product'],
    }),

    // Addresses
    getAddresses: builder.query<Array<{
      id: string
      userId: string
      label: string
      line1: string
      line2?: string | null
      city: string
      state: string
      postalCode: string
      country: string
      isDefault: boolean
    }>, void>({
      query: () => '/users/addresses',
      providesTags: ['Address'],
    }),
    createAddress: builder.mutation<any, {
      label: string
      line1: string
      line2?: string
      city: string
      state: string
      postalCode: string
      country?: string
      isDefault?: boolean
    }>({
      query: (body) => ({ url: '/users/addresses', method: 'POST', body }),
      invalidatesTags: ['Address'],
    }),
    updateAddress: builder.mutation<any, {
      id: string
      body: {
        label?: string
        line1?: string
        line2?: string
        city?: string
        state?: string
        postalCode?: string
        country?: string
        isDefault?: boolean
      }
    }>({
      query: ({ id, body }) => ({ url: `/users/addresses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address'],
    }),

    // Password Management
    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/users/change-password', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),

    // Coupons
    validateCoupon: builder.mutation<{
      valid: boolean
      code: string
      description: string
      type: string
      value: number
      discount: number
    }, { code: string; subtotal: number }>({
      query: (body) => ({ url: '/orders/coupons/validate', method: 'POST', body }),
    }),
    getCoupons: builder.query<Array<{
      id: string
      code: string
      description: string
      type: string
      value: number
      minOrder?: number | null
      maxDiscount?: number | null
      startAt: string
      endAt: string
      isActive: boolean
    }>, void>({
      query: () => '/orders/coupons',
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation<any, {
      code: string
      description: string
      type: 'PERCENT' | 'FLAT'
      value: number
      minOrder?: number
      maxDiscount?: number
      startAt?: string
      endAt?: string
      usageLimit?: number
    }>({
      query: (body) => ({ url: '/orders/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupon'],
    }),

    // Notifications
    getNotifications: builder.query<{
      data: Array<{
        id: string
        userId: string
        type: string
        title: string
        body: string
        data?: any
        read: boolean
        createdAt: string
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/notifications',
        params: params || undefined,
      }),
      providesTags: ['Notification'],
    }),
    getUnreadNotificationCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<any, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    // Admin Endpoints
    getAdminStats: builder.query<{
      totalUsers: number
      totalCustomers: number
      totalSellers: number
      pendingKycCount: number
      pendingProductsCount: number
      totalRevenue: number
      totalOrders: number
    }, void>({
      query: () => '/users/admin/stats',
      providesTags: ['User', 'Order', 'Product'],
    }),
    getAdminSellers: builder.query<{
      data: Array<{
        id: string
        userId: string
        storeName: string
        gstin?: string | null
        kycStatus: string
        kycRejectionReason?: string | null
        totalRevenue: number
        totalOrders: number
        createdAt: string
        user: {
          id: string
          email: string
          firstName: string
          lastName: string
          phone?: string | null
          avatarUrl?: string | null
          isActive: boolean
        }
        _count: { products: number }
      }>
    }, { kycStatus?: string } | void>({
      query: (params) => ({
        url: '/users/admin/sellers',
        params: params || undefined,
      }),
      providesTags: ['User'],
    }),
    updateSellerKyc: builder.mutation<any, { sellerId: string; status: 'APPROVED' | 'REJECTED' | 'PENDING'; rejectionReason?: string }>({
      query: ({ sellerId, ...body }) => ({
        url: `/users/admin/sellers/${sellerId}/kyc`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User', 'Product'],
    }),
    getMySellerStatus: builder.query<{
      id: string
      userId: string
      storeName: string
      kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
      kycRejectionReason?: string | null
      totalRevenue?: number
      totalOrders?: number
    }, void>({
      query: () => '/users/seller/me',
      providesTags: ['User'],
    }),
    getAllUsers: builder.query<{
      data: Array<{
        id: string
        email: string
        firstName: string
        lastName: string
        phone?: string | null
        role: string
        isActive: boolean
        isVerified: boolean
        createdAt: string
      }>
      meta: { page: number; limit: number; total: number; totalPages: number }
    }, { page?: number; limit?: number; role?: string } | void>({
      query: (params) => ({
        url: '/users',
        params: params || undefined,
      }),
      providesTags: ['User'],
    }),
    updateUserStatus: builder.mutation<any, { userId: string; isActive?: boolean; role?: string }>({
      query: ({ userId, ...body }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    getAdminAlerts: builder.query<{
      infraAlerts: Array<{ id: string; source: string; severity: string; message: string; acknowledged: boolean; createdAt: string }>
      fraudAlerts: Array<{ id: string; userId?: string | null; orderId?: string | null; type: string; severity: string; details: any; resolved: boolean; createdAt: string }>
    }, void>({
      query: () => '/users/admin/alerts',
      providesTags: ['User'],
    }),
    acknowledgeAlert: builder.mutation<any, { id: string; type?: 'fraud' | 'infra' }>({
      query: ({ id, ...body }) => ({
        url: `/users/admin/alerts/${id}/acknowledge`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    createTestAlert: builder.mutation<any, { type: 'infra' | 'fraud'; severity?: string; message?: string }>({
      query: (body) => ({
        url: '/users/admin/alerts/test',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useConfirmPaymentMutation,
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
  useGetWalletQuery,
  useAddToWalletMutation,
  useGetSellerProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  useGetSellerOrderItemsQuery,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetProductReviewsQuery,
  useCreateProductReviewMutation,
  useCreateReturnRequestMutation,
  useProcessReturnRequestMutation,
  useGetSellerAnalyticsQuery,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useChangePasswordMutation,
  useValidateCouponMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAdminStatsQuery,
  useGetAdminSellersQuery,
  useUpdateSellerKycMutation,
  useGetMySellerStatusQuery,
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useGetAdminAlertsQuery,
  useAcknowledgeAlertMutation,
  useCreateTestAlertMutation,
} = api