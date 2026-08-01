import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, Truck, Shield, Check } from 'lucide-react'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearCart } from '../../cart/cartSlice'
import toast from 'react-hot-toast'

const checkoutSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().length(6, 'Enter valid 6-digit PIN'),
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'UPI', 'WALLET']),
  saveAddress: z.boolean().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

const paymentMethods = [
  { id: 'RAZORPAY', label: 'Razorpay', desc: 'Cards, Netbanking, UPI, Wallets', icon: CreditCard },
  { id: 'STRIPE', label: 'Stripe', desc: 'International cards & wallets', icon: CreditCard },
  { id: 'UPI', label: 'UPI', desc: 'PhonePe, GPay, Paytm, BHIM', icon: CreditCard },
  { id: 'WALLET', label: 'TRADENEST Wallet', desc: 'Use your wallet balance', icon: CreditCard },
]

export default function Checkout() {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((s) => s.cart.items)
  const [step, setStep] = useState(1)
  const [processing, setProcessing] = useState(false)

  const mockProducts: Record<string, { title: string; price: number; image: string }> = {
    'prod-1': { title: 'Premium Wireless Headphones', price: 2999, image: 'https://picsum.photos/seed/headphones1/80/80' },
  }

  const items = cartItems.map((i) => ({ ...i, product: mockProducts[i.productId] })).filter((i) => i.product)
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shipping = subtotal > 499 ? 0 : 99
  const total = subtotal + shipping

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'RAZORPAY' },
  })

  const onSubmit = async (data: CheckoutForm) => {
    setProcessing(true)
    try {
      await new Promise((r) => setTimeout(r, 2000))
      dispatch(clearCart())
      toast.success('Order placed successfully!')
      setStep(3)
    } catch {
      toast.error('Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  if (step === 3) {
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
            <a href="/orders" className="btn btn-primary w-full">View Orders</a>
            <a href="/products" className="btn btn-outline w-full">Continue Shopping</a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-secondary-900 dark:text-secondary-50"
          >
            Checkout
          </motion.h1>
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <motion.div
                key={s}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * s }}
                className={clsx('flex items-center gap-2', s < 2 && 'after:content-[""] after:w-8 after:h-0.5 after:bg-secondary-300')}
              >
                <div className={clsx('flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium', step >= s ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-500 dark:bg-secondary-700')}>
                  {s}
                </div>
                <span className={clsx('hidden text-sm font-medium', step >= s ? 'text-primary-600' : 'text-secondary-500', s === 1 ? 'md:block' : 'md:block')}>
                  {s === 1 ? 'Shipping' : 'Payment'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="mb-6 text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary-600" />
                Shipping Address
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Full Name</label>
                  <input {...register('fullName')} id="fullName" className="input" />
                  {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Phone</label>
                  <input {...register('phone')} id="phone" type="tel" className="input" />
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
              className="card p-6"
            >
              <h2 className="mb-6 text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Payment Method
              </h2>

              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={clsx(
                      'relative flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all',
                      watch('paymentMethod') === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-secondary-200 hover:border-primary-300 dark:border-secondary-700'
                    )}
                  >
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value={method.id}
                      className="sr-only"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                      <method.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-secondary-900 dark:text-secondary-50">{method.label}</p>
                      <p className="text-sm text-secondary-500">{method.desc}</p>
                    </div>
                    {watch('paymentMethod') === method.id && (
                      <div className="absolute inset-0 rounded-lg ring-2 ring-primary-500/50" />
                    )}
                  </label>
                ))}
              </div>
            </motion.section>
          </div>

          <div>
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 card p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Order Summary</h2>

              <div className="mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img src={item.product.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-50 truncate">{item.product.title}</p>
                      <p className="text-sm text-secondary-500">Qty: {item.quantity}</p>
                      <p className="font-medium text-secondary-900 dark:text-secondary-50">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 border-t border-secondary-200 pt-4 dark:border-secondary-700">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Subtotal</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">₹{subtotal.toLocaleString()}</span>
                </div>
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
                disabled={processing}
                className="btn btn-primary w-full py-3 text-lg"
              >
                {processing ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-secondary-500">
                <Shield className="h-4 w-4" />
                <span>Secured by Razorpay & Stripe</span>
              </div>
            </motion.aside>
          </div>
        </form>
      </div>
    </div>
  )
}

import { clsx } from 'clsx'