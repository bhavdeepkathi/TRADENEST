import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, Tag } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { removeItem, updateQuantity, clearCart, setCartItems } from '../cartSlice'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import { useAddToCartMutation, useGetCartQuery, useGetProductsQuery, useUpdateCartItemMutation, useRemoveFromCartMutation, useClearCartMutation } from '../../../app/api'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const localItems = useAppSelector((s) => s.cart.items)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const hasSyncedLocalCart = useRef(false)
  const [addToCart] = useAddToCartMutation()
  const [updateCartItem] = useUpdateCartItemMutation()
  const [removeFromCart] = useRemoveFromCartMutation()
  const [clearCartApi] = useClearCartMutation()
  const { data: cart, isLoading, refetch } = useGetCartQuery(undefined, { skip: !accessToken })
  const { data: localProducts } = useGetProductsQuery({ page: 1, limit: 1000 })

  // Preserve guest cart items after login by adding any local quantity not on the server.
  useEffect(() => {
    if (!cart || isLoading || hasSyncedLocalCart.current) return
    hasSyncedLocalCart.current = true

    const serverItems = new Map(cart.items.map((item) => [item.productId, item.quantity]))
    const localItemsToSync = localItems.flatMap((item) => {
      const quantity = item.quantity - (serverItems.get(item.productId) ?? 0)
      return quantity > 0 ? [{ productId: item.productId, quantity }] : []
    })

    if (localItemsToSync.length > 0) {
      void Promise.all(localItemsToSync.map((item) => addToCart(item).unwrap()))
        .then(() => refetch())
        .catch(() => toast.error('Some guest cart items could not be synced. They are still saved on this device.'))
      return
    }

    dispatch(setCartItems(cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))))
  }, [cart, isLoading, localItems, dispatch, addToCart, refetch])

  const displayItems: any[] = cart?.items?.length ? cart.items : localItems.flatMap((item) => {
    const product = localProducts?.data.find((candidate) => candidate.id === item.productId)
    return product ? [{ ...item, id: item.productId, product, subtotal: product.price * item.quantity }] : []
  })

  const subtotal = cart?.subtotal ?? displayItems.reduce((sum, item) => sum + item.subtotal, 0)
  const shipping = subtotal > 499 ? 0 : 99
  const total = subtotal + shipping

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="space-y-4">
            {[0,1,2].map(i => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="h-20 w-20 rounded-lg bg-secondary-200 dark:bg-secondary-800" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-3/4" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/2" />
                  <div className="h-8 bg-secondary-200 dark:bg-secondary-800 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (displayItems.length === 0) {
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

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    try {
      if (!accessToken) {
        dispatch(updateQuantity({ productId, quantity }))
        return
      }
      await updateCartItem({ productId, quantity }).unwrap()
      dispatch(updateQuantity({ productId, quantity }))
      await refetch()
    } catch (err) {
      toast.error('Failed to update quantity')
    }
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      if (!accessToken) {
        dispatch(removeItem(productId))
        return
      }
      await removeFromCart(productId).unwrap()
      dispatch(removeItem(productId))
      await refetch()
      toast.success('Removed from cart')
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  const handleClearCart = async () => {
    try {
      if (!accessToken) {
        dispatch(clearCart())
        return
      }
      await clearCartApi().unwrap()
      dispatch(clearCart())
      await refetch()
      toast.success('Cart cleared')
    } catch (err) {
      toast.error('Failed to clear cart')
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-secondary-900 dark:text-secondary-50"
            >
              Shopping Cart
            </motion.h1>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
              {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-800">
              <div className="hidden bg-secondary-50 px-5 py-3 text-sm font-medium text-secondary-600 dark:bg-secondary-800/50 dark:text-secondary-400 sm:grid sm:grid-cols-[minmax(0,1fr)_90px_112px_100px_40px] sm:gap-4 md:grid-cols-[minmax(0,1fr)_100px_112px_110px_40px]">
                <span>Product</span>
                <span className="text-right">Price</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Total</span>
                <span aria-hidden="true"></span>
              </div>

              <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {displayItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(0.03 * i, 0.18), duration: 0.2 }}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 sm:grid-cols-[minmax(0,1fr)_90px_112px_100px_40px] sm:gap-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_100px_112px_110px_40px]"
                  >
                    <Link to={`/products/${item.product.slug}`} className="col-span-2 flex min-w-0 items-center gap-4 sm:col-span-1">
                      <img src={item.product.images[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop'} alt={item.product.title} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-secondary-900 dark:text-secondary-50">{item.product.title}</h3>
                        <p className="text-sm text-secondary-500">Seller: {item.product.seller?.storeName || 'TRADENEST'}</p>
                        <p className="mt-1 text-sm font-medium text-secondary-900 dark:text-secondary-50 sm:hidden">
                          ₹{item.subtotal.toLocaleString()}
                          <span className="ml-1 font-normal text-secondary-500">· {item.quantity} {item.quantity === 1 ? 'item' : 'items'}</span>
                        </p>
                      </div>
                    </Link>

                    <div className="hidden text-right sm:block">
                      <p className="font-medium text-secondary-900 dark:text-secondary-50">₹{item.product.price.toLocaleString()}</p>
                      {item.product.mrp && item.product.mrp > item.product.price && (
                        <p className="text-sm line-through text-secondary-400">₹{item.product.mrp.toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex w-fit items-center justify-center rounded-lg border border-secondary-300 dark:border-secondary-600">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-l-lg text-secondary-600 transition-colors hover:bg-secondary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:text-secondary-300 dark:hover:bg-secondary-700"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium text-secondary-900 dark:text-secondary-50">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-r-lg text-secondary-600 transition-colors hover:bg-secondary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:text-secondary-300 dark:hover:bg-secondary-700"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="hidden text-right font-medium text-secondary-900 dark:text-secondary-50 sm:block">
                      ₹{item.subtotal.toLocaleString()}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="flex h-10 w-10 items-center justify-center justify-self-end rounded-lg text-secondary-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-900/20 sm:justify-self-center"
                      aria-label={`Remove ${item.product.title} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
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

          <div className="min-w-0">
            <div className="card p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Subtotal ({displayItems.length} items)</span>
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
                  <div>
                    <p className="text-xs text-primary-600">Add ₹{499 - subtotal} more for free delivery!</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-700" role="progressbar" aria-label="Progress towards free delivery" aria-valuemin={0} aria-valuemax={499} aria-valuenow={Math.min(subtotal, 499)}>
                      <div className="h-full rounded-full bg-primary-600 transition-[width] duration-300" style={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }} />
                    </div>
                  </div>
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
                Secure checkout powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}