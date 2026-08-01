import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, Tag } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { removeItem, updateQuantity, clearCart } from '../cartSlice'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector((s) => s.cart.items)

  const mockProducts: Record<string, { title: string; price: number; mrp?: number; image: string }> = {
    'prod-1': { title: 'Premium Wireless Headphones', price: 2999, mrp: 4999, image: 'https://picsum.photos/seed/headphones1/200/200' },
    'prod-2': { title: 'Smart Watch Series 5', price: 15999, mrp: 19999, image: 'https://picsum.photos/seed/watch1/200/200' },
    'prod-3': { title: 'Mechanical Keyboard', price: 4999, image: 'https://picsum.photos/seed/keyboard1/200/200' },
  }

  const cartItems = items.map((item) => ({ ...item, product: mockProducts[item.productId] })).filter((i) => i.product)

  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = subtotal > 499 ? 0 : 99
  const total = subtotal + shipping

  if (cartItems.length === 0) {
    return (
      <div className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
              <svg className="h-10 w-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-secondary-900 dark:text-secondary-50">Your cart is empty</h1>
          <p className="mb-6 text-secondary-600 dark:text-secondary-400">Looks like you haven't added any products yet.</p>
          <Link to="/products" className="btn btn-primary inline-flex">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-3xl font-bold text-secondary-900 dark:text-secondary-50"
        >
          Shopping Cart ({cartItems.length})
        </motion.h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 overflow-hidden">
              <div className="hidden px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 sm:grid grid-cols-[1fr_120px_100px_120px_60px] gap-4 text-sm font-medium text-secondary-600 dark:text-secondary-400">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span></span>
              </div>

              <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {cartItems.map((item, i) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex gap-4 p-4 sm:grid sm:grid-cols-[1fr_120px_100px_120px_60px] sm:items-center"
                  >
                    <Link to={`/products/${item.product.slug || 'product'}`} className="flex gap-4 min-w-0">
                      <img src={item.product.image} alt={item.product.title} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-secondary-900 dark:text-secondary-50 truncate">{item.product.title}</h3>
                        <p className="text-sm text-secondary-500">Seller: Store Name</p>
                      </div>
                    </Link>

                    <div className="hidden sm:block text-right">
                      <p className="font-medium text-secondary-900 dark:text-secondary-50">₹{item.product.price.toLocaleString()}</p>
                      {item.product.mrp && item.product.mrp > item.product.price && (
                        <p className="text-sm line-through text-secondary-400">₹{item.product.mrp.toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 border border-secondary-300 rounded-lg w-full max-w-xs sm:max-w-none">
                      <button
                        onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) }))}
                        className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                        className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="hidden sm:block text-right font-medium text-secondary-900 dark:text-secondary-50">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </div>

                    <button
                      onClick={() => {
                        dispatch(removeItem(item.productId))
                        toast.success('Removed from cart')
                      }}
                      className="flex items-center justify-center p-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link to="/products" className="btn btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>

          <div>
            <div className="sticky top-24 card p-6">
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Shipping</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `₹${shipping.toLocaleString()}`
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-primary-600">Add ₹{499 - subtotal} more for free delivery!</p>
                )}
              </div>

              <div className="mb-4 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary-600" />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                  />
                  <button className="btn btn-primary text-sm px-3 py-1.5">Apply</button>
                </div>
              </div>

              <div className="mb-6 border-t border-secondary-200 pt-4 dark:border-secondary-700">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-secondary-900 dark:text-secondary-50">Total</span>
                  <span className="text-primary-600">₹{total.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-secondary-500">Inclusive of all taxes</p>
              </div>

              <Link to="/checkout" className="btn btn-primary w-full py-3 text-lg">
                Proceed to Checkout
              </Link>

              <p className="mt-4 text-center text-xs text-secondary-500">
                Secure checkout powered by Razorpay & Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}