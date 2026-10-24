import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CreditCard, Truck, Shield, Check, Loader2, AlertCircle, Wallet, Smartphone, Tag } from 'lucide-react'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearCart } from '../../cart/cartSlice'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCreateOrderMutation, useCreatePaymentIntentMutation, useVerifyPaymentMutation, useConfirmPaymentMutation, useGetCartQuery, useGetWalletQuery, useValidateCouponMutation } from '../../../app/api'

const checkoutSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().length(6, 'Enter valid 6-digit PIN'),
  paymentMethod: z.enum(['RAZORPAY', 'UPI', 'WALLET']),
  saveAddress: z.boolean().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message
    }
  }

  return fallback
}

const paymentMethods = [
  { id: 'UPI', label: 'UPI', desc: 'Pay with UPI apps via Razorpay', icon: Smartphone },
  { id: 'RAZORPAY', label: 'Cards & Netbanking', desc: 'Pay by card, netbanking or supported wallets', icon: CreditCard },
  { id: 'WALLET', label: 'TRADENEST Wallet', desc: 'Use your wallet balance', icon: Wallet },
]

const statusConfig = {
  RAZORPAY: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  UPI: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  WALLET: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
}

export default function Checkout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [step, setStep] = useState(1) // 1: address, 2: payment, 3: processing, 4: success
  const [processing, setProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [createOrder] = useCreateOrderMutation()
  const [createPaymentIntent] = useCreatePaymentIntentMutation()
  const [verifyPayment] = useVerifyPaymentMutation()
  const [confirmPayment] = useConfirmPaymentMutation()
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation()
  const { data: cart, isLoading: cartLoading, error: cartError } = useGetCartQuery(undefined, { skip: !accessToken })
  const { data: wallet } = useGetWalletQuery(undefined, { skip: !accessToken })

  const location = useLocation()
  const initialCouponCode = (location.state as any)?.couponCode || ''
  const initialDiscount = (location.state as any)?.discount || 0
  const [couponInput, setCouponInput] = useState(initialCouponCode)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    initialCouponCode && initialDiscount ? { code: initialCouponCode, discount: initialDiscount } : null
  )

  const items = cart?.items || []
  const subtotal = Number(cart?.subtotal || 0)
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const shipping = subtotal > 499 ? 0 : 99
  const total = Math.max(0, subtotal - discount) + shipping

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    try {
      const res = await validateCoupon({ code: couponInput.trim().toUpperCase(), subtotal }).unwrap()
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discount: res.discount })
        toast.success(`Coupon ${res.code} applied! Saved ₹${res.discount}`)
        setCouponInput('')
      } else {
        toast.error('Invalid coupon code')
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Invalid coupon code')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    toast.success('Coupon removed')
  }

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'RAZORPAY' },
  })

  const watchedPaymentMethod = watch('paymentMethod')

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async (orderId: string, razorpayOrderId: string, razorpayKeyId: string, amount: number, paymentMethod: 'RAZORPAY' | 'UPI'): Promise<RazorpayPaymentResponse> => {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK')
    }

    return new Promise<RazorpayPaymentResponse>((resolve, reject) => {
      const options = {
        key: razorpayKeyId,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'TRADENEST',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        method: paymentMethod === 'UPI' ? { upi: true } : undefined,
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI',
                instruments: [{ method: 'upi' as const }],
              },
            },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: (response: RazorpayPaymentResponse) => {
          resolve(response)
        },
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.email,
          contact: watch('phone') || '',
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'))
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed'))
      })
      rzp.open()
    })
  }

  const handleWalletPayment = async (orderId: string, paymentId: string) => {
    // Wallet payment is processed on backend
    const result = await verifyPayment({
      paymentId,
      provider: 'WALLET',
      providerRef: paymentId,
    }).unwrap()
    return result
  }

  const onSubmit = async (data: CheckoutForm) => {
    setProcessing(true)
    setError(null)
    
    try {
      // Step 1: Create the order from the authenticated server cart.
      const orderResult = await createOrder({
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          line1: data.addressLine1,
          line2: data.addressLine2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: 'IN',
        },
        paymentMethod: data.paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      }).unwrap()

      const order = orderResult
      const orderId = order.id

      // Step 2: Create payment intent
      const paymentResult = await createPaymentIntent({
        orderId,
        provider: data.paymentMethod,
      }).unwrap()

      setPaymentData({
        ...paymentResult,
        orderId,
        order,
      })

      // Step 3: Process payment based on method
      let verificationResult

      if (data.paymentMethod === 'RAZORPAY' || data.paymentMethod === 'UPI') {
        if (
          !paymentResult.razorpayOrderId ||
          !paymentResult.razorpayKeyId ||
          !Number.isFinite(paymentResult.amount) ||
          paymentResult.amount <= 0
        ) {
          throw new Error('Razorpay could not create a checkout session. Please try again.')
        }

        setStep(3)
        try {
          const razorpayResponse = await handleRazorpayPayment(
            orderId,
            paymentResult.razorpayOrderId,
            paymentResult.razorpayKeyId,
            paymentResult.amount,
            data.paymentMethod
          )
          
          // Verify payment on backend
          verificationResult = await verifyPayment({
            paymentId: paymentResult.paymentId,
            provider: data.paymentMethod,
            providerRef: paymentResult.razorpayOrderId,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
          }).unwrap()
        } catch (err: unknown) {
          // Payment cancelled or failed
          throw new Error(getErrorMessage(err, 'Razorpay payment failed'))
        }
      } else if (data.paymentMethod === 'WALLET') {
        setStep(3)
        try {
          verificationResult = await handleWalletPayment(orderId, paymentResult.paymentId)
        } catch (err: unknown) {
          throw new Error(getErrorMessage(err, 'Wallet payment failed'))
        }
      }

      // Step 4: Confirm payment and update the order before clearing the cart.
      if (verificationResult?.success) {
        await confirmPayment({
          orderId,
          paymentId: paymentResult.paymentId,
          providerRef: paymentResult.razorpayOrderId || paymentResult.paymentId,
          provider: data.paymentMethod,
        }).unwrap()
        await dispatch(clearCart())
        setStep(4)
        toast.success('Order placed successfully!')
        
        // Navigate to order confirmation after a short delay
        setTimeout(() => {
          navigate(`/orders/${orderId}`)
        }, 2000)
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Payment failed. Please try again.')
      setError(message)
      toast.error(message)
      setStep(2) // Go back to payment step
    } finally {
      setProcessing(false)
    }
  }

  if (cartLoading) {
    return <div className="px-4 py-16 text-center text-secondary-600 dark:text-secondary-400">Loading your cart...</div>
  }

  if (cartError || items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-secondary-600 dark:text-secondary-400">Your cart is empty. Add products before checkout.</p>
        <Link to="/products" className="btn btn-primary mt-5">Continue shopping</Link>
      </div>
    )
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-secondary-900 dark:text-secondary-50">Order Confirmed!</h1>
          <p className="mb-6 text-secondary-600 dark:text-secondary-400">Your order has been placed successfully.</p>
          <div className="space-y-3">
            <a href={`/orders/${paymentData?.orderId}`} className="btn btn-primary w-full">View Order</a>
            <a href="/products" className="btn btn-outline w-full">Continue Shopping</a>
          </div>
        </motion.div>
      </div>
    )
  }

  // Step 3: Processing
  if (step === 3) {
    return (
      <div className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <Loader2 className="h-16 w-16 text-primary-600 animate-spin" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-secondary-900 dark:text-secondary-50">Processing Payment...</h1>
          <p className="mb-6 text-secondary-600 dark:text-secondary-400">Please wait while we verify your payment.</p>
          <div className="text-sm text-secondary-500">
            Do not close this window or refresh the page.
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-secondary-900 dark:text-secondary-50"
            >
              Checkout
            </motion.h1>
            <Link to="/cart" className="mt-2 inline-flex items-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Return to cart
            </Link>
          </div>
          <div className="flex items-center gap-3" aria-label="Checkout progress">
            {[1, 2].map((s) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * s, duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors', step >= s ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-500 dark:bg-secondary-700 dark:text-secondary-300')}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </span>
                  <span className={clsx('text-xs font-medium sm:text-sm', step >= s ? 'text-primary-700 dark:text-primary-400' : 'text-secondary-500')}>
                    {s === 1 ? 'Shipping' : 'Payment'}
                  </span>
                </div>
                {s === 1 && <span className="h-px w-6 bg-secondary-300 dark:bg-secondary-600 sm:w-10" aria-hidden="true" />}
              </motion.div>
            ))}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="min-w-0 space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 sm:p-6"
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-secondary-900 dark:text-secondary-50 sm:mb-6">
                <Truck className="h-5 w-5 text-primary-600" />
                Shipping Address
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Full Name</label>
                  <input {...register('fullName')} id="fullName" className="input" defaultValue={user ? `${user.firstName} ${user.lastName}` : ''} />
                  {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Phone</label>
                  <input {...register('phone')} id="phone" type="tel" className="input" defaultValue={user?.phone || ''} />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="addressLine1" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Address Line 1</label>
                  <input {...register('addressLine1')} id="addressLine1" className="input" placeholder="House/Flat No, Building, Street" />
                  {errors.addressLine1 && <p className="mt-1 text-sm text-red-500">{errors.addressLine1.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="addressLine2" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Address Line 2 (Optional)</label>
                  <input {...register('addressLine2')} id="addressLine2" className="input" placeholder="Landmark, Area" />
                </div>
                <div>
                  <label htmlFor="city" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">City</label>
                  <input {...register('city')} id="city" className="input" />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>}
                </div>
                <div>
                  <label htmlFor="state" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">State</label>
                  <input {...register('state')} id="state" className="input" />
                  {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state.message}</p>}
                </div>
                <div>
                  <label htmlFor="postalCode" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">PIN Code</label>
                  <input {...register('postalCode')} id="postalCode" className="input" maxLength={6} />
                  {errors.postalCode && <p className="mt-1 text-sm text-red-500">{errors.postalCode.message}</p>}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input {...register('saveAddress')} id="saveAddress" type="checkbox" className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="saveAddress" className="text-sm text-secondary-600 dark:text-secondary-400">Save as default address</label>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5 sm:p-6"
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-secondary-900 dark:text-secondary-50 sm:mb-6">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Payment Method
              </h2>

              <div className="grid gap-3">
                {paymentMethods.map((method) => {
                  const isWallet = method.id === 'WALLET'
                  const walletBalance = wallet?.balance || 0
                  const insufficientFunds = isWallet && walletBalance < total
                  
                  return (
                    <label
                      key={method.id}
                      className={clsx(
                        'group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-secondary-900',
                        watchedPaymentMethod === method.id
                          ? 'border-primary-500 bg-primary-50 shadow-sm dark:bg-primary-900/20'
                          : 'border-secondary-200 hover:border-primary-300 dark:border-secondary-700',
                        insufficientFunds && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value={method.id}
                        className="h-5 w-5 shrink-0 accent-primary-600"
                        disabled={insufficientFunds}
                      />
                      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', statusConfig[method.id as keyof typeof statusConfig].color)}>
                        <method.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-secondary-900 dark:text-secondary-50">{method.label}</p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400">{method.desc}</p>
                        {isWallet && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="text-secondary-600 dark:text-secondary-400">Balance:</span>
                            <span className="font-medium text-secondary-900 dark:text-secondary-50">₹{walletBalance.toLocaleString()}</span>
                            {insufficientFunds && (
                              <span className="text-red-500">(Insufficient)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>

              {watchedPaymentMethod === 'WALLET' && wallet && wallet.balance < total && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>Insufficient wallet balance. Please add funds or choose another payment method.</span>
                  </div>
                </div>
              )}
            </motion.section>
          </div>

          <div className="min-w-0">
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-5 sm:p-6 lg:sticky lg:top-24"
            >
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Order Summary</h2>

              <div className="mb-4 max-h-60 space-y-4 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3">
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop'}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-50">{item.product.title}</p>
                      <p className="text-sm text-secondary-500">Qty: {item.quantity}</p>
                      <p className="font-medium text-secondary-900 dark:text-secondary-50">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mb-4 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs text-secondary-500">
                        (-₹{appliedCoupon.discount.toLocaleString()})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary-600" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="Coupon code"
                      className="flex-1 bg-transparent focus:outline-none text-xs uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="btn btn-primary text-xs px-3 py-1 disabled:opacity-50"
                    >
                      {isValidatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6 border-t border-secondary-200 pt-4 dark:border-secondary-700">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Subtotal</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Coupon Discount</span>
                    <span className="font-medium">-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Shipping</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">
                    {shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-secondary-200 pt-3 dark:border-secondary-700">
                  <span className="text-secondary-900 dark:text-secondary-50">Total</span>
                  <span className="text-primary-600">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing || (watchedPaymentMethod === 'WALLET' && wallet && wallet.balance < total)}
                className="btn btn-primary w-full py-3 text-lg"
              >
                {processing ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-secondary-500">
                <Shield className="h-4 w-4" />
                <span>
                  {watchedPaymentMethod === 'WALLET'
                    ? 'Paid securely with TRADENEST Wallet'
                    : 'Secured by Razorpay Checkout'}
                </span>
              </div>
            </motion.aside>
          </div>
        </form>
      </div>
    </div>
  )
}