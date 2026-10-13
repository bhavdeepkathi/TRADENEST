import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from './store'

const baseUrl = import.meta.env.VITE_API_URL || '/api'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Product', 'Category', 'Order', 'User', 'Cart', 'Wishlist', 'Payment'],
  endpoints: (builder) => ({
    login: builder.mutation<{
      accessToken: string
      refreshToken: string
    }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<{
      message: string
    }, { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
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
    }, { page?: number; limit?: number; q?: string; categoryId?: string; brand?: string; subcategory?: string; minPrice?: number; maxPrice?: number; rating?: number; minDiscount?: number; inStock?: boolean; sort?: string; order?: string }>({
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
    }}>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
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
      createdAt: string
      updatedAt: string
    }, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
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
    }, { shippingAddressId: string; paymentMethod: string; couponCode?: string }>({
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
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
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
} = api