import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CreditCard, Truck, Shield, Check, Loader2, AlertCircle, Wallet, Smartphone, Tag, Banknote, QrCode, Copy, CheckCircle, Clock } from 'lucide-react'
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
  paymentMethod: z.enum(['RAZORPAY', 'UPI', 'WALLET', 'COD']),
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
  { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay with cash upon doorstep delivery', icon: Banknote },
]

const statusConfig = {
  RAZORPAY: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  UPI: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  WALLET: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  COD: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
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
  const [upiId, setUpiId] = useState('customer@okaxis')
  const [activeUpiTab, setActiveUpiTab] = useState<'QR' | 'VPA'>('QR')
  const [qrDisplayMode, setQrDisplayMode] = useState<'ORIGINAL' | 'DYNAMIC'>('ORIGINAL')
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false)

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
      const options: any = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        name: 'TRADENEST',
        description: `Order Payment #${orderId.slice(0, 8)}`,
        order_id: razorpayOrderId,
        handler: (response: RazorpayPaymentResponse) => {
          resolve(response)
        },
        prefill: {
          name: ((user?.firstName || '') + ' ' + (user?.lastName || '')).trim(),
          email: user?.email || '',
          contact: watch('phone') || user?.phone || '',
          method: paymentMethod === 'UPI' ? 'upi' : undefined,
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: paymentMethod === 'UPI' ? '#10b981' : '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'))
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        reject(new Error(response?.error?.description || 'Payment failed'))
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

  const handleVerifyDirectUpi = async () => {
    if (!paymentData?.paymentId || !paymentData?.orderId) {
      toast.error('Payment session not found. Please try again.')
      return
    }
    setIsVerifyingUpi(true)
    setError(null)
    try {
      const userVpa = (upiId || 'customer@okhdfcbank').trim()
      const verifyResult = await verifyPayment({
        paymentId: paymentData.paymentId,
        provider: 'UPI',
        providerRef: paymentData.providerRef || `upi_${paymentData.orderId}`,
        upiId: userVpa,
        upiRef: `UPI-${Date.now().toString().slice(-8)}`,
      }).unwrap()

      if (verifyResult?.success) {
        await confirmPayment({
          orderId: paymentData.orderId,
          paymentId: paymentData.paymentId,
          providerRef: paymentData.providerRef || `upi_${paymentData.orderId}`,
          provider: 'UPI',
        }).unwrap()

        await dispatch(clearCart())
        setStep(4)
        toast.success('UPI Payment verified successfully!')
        setTimeout(() => {
          navigate(`/orders/${paymentData.orderId}`)
        }, 2000)
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'UPI verification failed. Please try again.')
      setError(msg)
      toast.error(msg)
    } finally {
      setIsVerifyingUpi(false)
    }
  }

  const handleGatewayUpi = async () => {
    if (!paymentData?.orderId || !paymentData?.razorpayOrderId || !paymentData?.razorpayKeyId) {
      toast.error('Razorpay session not available. Please retry.')
      return
    }
    setIsVerifyingUpi(true)
    setError(null)
    try {
      const razorpayResponse = await handleRazorpayPayment(
        paymentData.orderId,
        paymentData.razorpayOrderId,
        paymentData.razorpayKeyId,
        paymentData.amount,
        'UPI'
      )

      const verifyResult = await verifyPayment({
        paymentId: paymentData.paymentId,
        provider: 'UPI',
        providerRef: paymentData.razorpayOrderId,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
      }).unwrap()

      if (verifyResult?.success) {
        await confirmPayment({
          orderId: paymentData.orderId,
          paymentId: paymentData.paymentId,
          providerRef: paymentData.razorpayOrderId,
          provider: 'UPI',
        }).unwrap()

        await dispatch(clearCart())
        setStep(4)
        toast.success('UPI Payment confirmed via gateway!')
        setTimeout(() => {
          navigate(`/orders/${paymentData.orderId}`)
        }, 2000)
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Gateway UPI payment failed or was cancelled')
      setError(msg)
      toast.error(msg)
    } finally {
      setIsVerifyingUpi(false)
    }
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

      // If user chose UPI: Transition directly to Step 3 interactive payment screen
      if (data.paymentMethod === 'UPI') {
        setStep(3)
        return
      }

      // Step 3: Process other payment methods
      let verificationResult

      if (data.paymentMethod === 'RAZORPAY') {
        if (
          !paymentResult.razorpayOrderId ||
          !paymentResult.razorpayKeyId ||
          !Number.isFinite(paymentResult.amount) ||
          paymentResult.amount <= 0
        ) {
          throw new Error('Razorpay could not create a payment session. Please try again.')
        }

        setStep(3)
        try {
          const razorpayResponse = await handleRazorpayPayment(
            orderId,
            paymentResult.razorpayOrderId,
            paymentResult.razorpayKeyId,
            paymentResult.amount,
            'RAZORPAY'
          )
          
          verificationResult = await verifyPayment({
            paymentId: paymentResult.paymentId,
            provider: 'RAZORPAY',
            providerRef: paymentResult.razorpayOrderId,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
          }).unwrap()
        } catch (err: unknown) {
          throw new Error(getErrorMessage(err, 'Card payment was cancelled or failed'))
        }
      } else if (data.paymentMethod === 'WALLET') {
        setStep(3)
        try {
          verificationResult = await handleWalletPayment(orderId, paymentResult.paymentId)
        } catch (err: unknown) {
          throw new Error(getErrorMessage(err, 'Wallet payment failed'))
        }
      } else if (data.paymentMethod === 'COD') {
        setStep(3)
        try {
          verificationResult = await verifyPayment({
            paymentId: paymentResult.paymentId,
            provider: 'COD',
            providerRef: paymentResult.providerRef || `cod_${orderId}`,
          }).unwrap()
        } catch (err: unknown) {
          throw new Error(getErrorMessage(err, 'Failed to process Cash on Delivery request'))
        }
      }

      // Step 4: Confirm payment and update the order before clearing the cart.
      if (verificationResult?.success) {
        await confirmPayment({
          orderId,
          paymentId: paymentResult.paymentId,
          providerRef: paymentResult.providerRef || paymentResult.razorpayOrderId || paymentResult.paymentId,
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

  // Step 3: Dedicated Interactive UPI Payment Screen
  if (step === 3 && (watchedPaymentMethod === 'UPI' || paymentData?.provider === 'UPI')) {
    const orderTotal = paymentData?.amount || total
    const merchantVpa = paymentData?.upiVpa || 'bhavdeepbhukan129@okhdfcbank'
    const merchantName = (paymentData as any)?.upiMerchantName || 'Bhavdeep Bhukan'
    const qrData = paymentData?.upiIntent || `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&aid=uGICAgMCjr6boHA&am=${orderTotal.toFixed(2)}&cu=INR&tr=${paymentData?.orderId || ''}&tn=Order%20Payment`

    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Smartphone className="h-3.5 w-3.5" />
              Step 3: Complete UPI Payment
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-50">
              Pay ₹{orderTotal.toLocaleString()}
            </h1>
            <p className="mt-1 text-sm text-secondary-500">
              Order ID: <span className="font-mono font-medium text-secondary-700 dark:text-secondary-300">#{paymentData?.orderId?.slice(0, 8)}</span>
            </p>
          </div>

          <div className="card p-6 sm:p-8 space-y-6 bg-white dark:bg-secondary-900 shadow-xl border border-secondary-200 dark:border-secondary-800 rounded-2xl">
            {/* Payee Details Card */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  B
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-secondary-900 dark:text-secondary-100 text-sm sm:text-base">
                      {merchantName}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100">
                      ✓ Verified Payee
                    </span>
                  </div>
                  <div className="text-xs text-secondary-600 dark:text-secondary-400 font-mono mt-0.5">
                    {merchantVpa}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(merchantVpa)
                  toast.success('UPI ID copied to clipboard!')
                }}
                className="btn btn-sm btn-outline text-xs flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                title="Copy UPI ID"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>

            {/* Tabs for QR Code and UPI ID */}
            <div className="flex rounded-xl bg-secondary-100 p-1 dark:bg-secondary-800">
              <button
                type="button"
                onClick={() => setActiveUpiTab('QR')}
                className={clsx(
                  'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2',
                  activeUpiTab === 'QR'
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-secondary-900 dark:text-emerald-400'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400'
                )}
              >
                <QrCode className="h-4 w-4" />
                <span>Scan QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveUpiTab('VPA')}
                className={clsx(
                  'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2',
                  activeUpiTab === 'VPA'
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-secondary-900 dark:text-emerald-400'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400'
                )}
              >
                <Smartphone className="h-4 w-4" />
                <span>Enter UPI ID / VPA</span>
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: QR CODE */}
            {activeUpiTab === 'QR' && (
              <div className="flex flex-col items-center text-center space-y-4">
                {/* QR Display Mode Toggle */}
                <div className="inline-flex rounded-lg bg-secondary-100 p-1 dark:bg-secondary-800 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setQrDisplayMode('ORIGINAL')}
                    className={clsx(
                      'px-3 py-1.5 rounded-md transition-all',
                      qrDisplayMode === 'ORIGINAL'
                        ? 'bg-white text-secondary-900 shadow-xs font-semibold dark:bg-secondary-700 dark:text-secondary-100'
                        : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900'
                    )}
                  >
                    Original GPay QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrDisplayMode('DYNAMIC')}
                    className={clsx(
                      'px-3 py-1.5 rounded-md transition-all',
                      qrDisplayMode === 'DYNAMIC'
                        ? 'bg-white text-secondary-900 shadow-xs font-semibold dark:bg-secondary-700 dark:text-secondary-100'
                        : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900'
                    )}
                  >
                    Dynamic QR (₹{orderTotal} Auto-filled)
                  </button>
                </div>

                {qrDisplayMode === 'ORIGINAL' ? (
                  <div className="p-2 bg-white rounded-2xl border-2 border-emerald-500 shadow-md max-w-[280px]">
                    <img
                      src="/upi-qr.jpg"
                      alt="Bhavdeep Bhukan Google Pay QR"
                      className="w-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`}
                      alt="Dynamic UPI Payment QR Code"
                      className="h-48 w-48 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <p className="font-semibold text-secondary-900 dark:text-secondary-50 text-base">
                    Scan with any UPI App on Mobile
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    Google Pay • PhonePe • Paytm • BHIM • Cred • Any Bank UPI
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyDirectUpi}
                  disabled={isVerifyingUpi}
                  className="btn btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md font-semibold text-white"
                >
                  {isVerifyingUpi ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  <span>{isVerifyingUpi ? 'Verifying Payment...' : 'I Have Paid • Verify & Complete Order'}</span>
                </button>
              </div>
            )}

            {/* TAB 2: UPI ID (VPA) */}
            {activeUpiTab === 'VPA' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                    Popular UPI Handles
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'Google Pay', handle: '@okhdfcbank' },
                      { name: 'Google Pay (Axis)', handle: '@okaxis' },
                      { name: 'PhonePe', handle: '@ybl' },
                      { name: 'Paytm', handle: '@paytm' },
                    ].map((app) => (
                      <button
                        key={app.name}
                        type="button"
                        onClick={() => {
                          const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'customer'
                          setUpiId(prefix + app.handle)
                        }}
                        className="p-2 text-xs rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-emerald-500 bg-white dark:bg-secondary-800 text-left transition-colors"
                      >
                        <span className="block font-semibold text-secondary-900 dark:text-secondary-100">{app.name}</span>
                        <span className="text-[11px] text-secondary-500">{app.handle}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Enter Your UPI ID (VPA)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@paytm or yourname@okhdfcbank"
                      className="input text-base w-full pr-28 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setUpiId('bhavdeepbhukan129@okhdfcbank')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded dark:bg-emerald-800 dark:text-emerald-200"
                    >
                      Fill My VPA
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-secondary-500">
                    Enter your virtual payment address or click Fill My VPA for testing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyDirectUpi}
                  disabled={isVerifyingUpi}
                  className="btn btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md font-semibold text-white"
                >
                  {isVerifyingUpi ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}
                  <span>{isVerifyingUpi ? 'Verifying UPI Payment...' : `Verify & Pay ₹${orderTotal.toLocaleString()}`}</span>
                </button>
              </div>
            )}

            {/* Alternative: Gateway Popup */}
            <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700 text-center space-y-3">
              <button
                type="button"
                onClick={handleGatewayUpi}
                disabled={isVerifyingUpi}
                className="btn btn-outline w-full py-2.5 text-xs text-secondary-700 dark:text-secondary-300"
              >
                Launch Razorpay Gateway Popup
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-secondary-500 hover:text-red-500 underline"
              >
                Cancel & Change Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Generic Processing for other methods
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

              {watchedPaymentMethod === 'UPI' && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-900/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    <Smartphone className="h-5 w-5 text-emerald-600" />
                    <span>Pay via UPI Gateway (GPay, PhonePe, Paytm, QR)</span>
                  </div>

                  <p className="text-xs text-secondary-600 dark:text-secondary-300">
                    Clicking &ldquo;Pay with UPI&rdquo; will open the secure Razorpay payment window to scan a QR code or pay using Google Pay, PhonePe, Paytm, or BHIM.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      UPI ID / VPA (Optional pre-fill)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                        className="input text-sm w-full pr-28"
                      />
                      <button
                        type="button"
                        onClick={() => setUpiId('success@razorpay')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-medium bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded dark:bg-emerald-800 dark:text-emerald-200"
                        title="Auto-fill verified test UPI ID"
                      >
                        Test UPI ID
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-secondary-500">
                    <span className="font-medium text-secondary-700 dark:text-secondary-300">Apps:</span>
                    <span className="rounded bg-white px-2 py-0.5 border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700">Google Pay</span>
                    <span className="rounded bg-white px-2 py-0.5 border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700">PhonePe</span>
                    <span className="rounded bg-white px-2 py-0.5 border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700">Paytm</span>
                    <span className="rounded bg-white px-2 py-0.5 border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700">BHIM QR</span>
                  </div>
                </div>
              )}

              {watchedPaymentMethod === 'COD' && (
                <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                    <span>Cash on Delivery selected. Please keep exact cash of ₹{total.toLocaleString()} ready for the courier.</span>
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
                {processing ? 'Placing Order...' : watchedPaymentMethod === 'COD' ? `Place Cash on Delivery Order - ₹${total.toLocaleString()}` : watchedPaymentMethod === 'UPI' ? `Proceed to UPI Payment (QR / VPA) - ₹${total.toLocaleString()}` : `Pay ₹${total.toLocaleString()}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-secondary-500">
                <Shield className="h-4 w-4" />
                <span>
                  {watchedPaymentMethod === 'WALLET'
                    ? 'Paid securely with TRADENEST Wallet'
                    : watchedPaymentMethod === 'COD'
                    ? 'Pay with cash upon doorstep delivery'
                    : watchedPaymentMethod === 'UPI'
                    ? 'Instant UPI Payment with GPay, PhonePe, Paytm or BHIM'
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