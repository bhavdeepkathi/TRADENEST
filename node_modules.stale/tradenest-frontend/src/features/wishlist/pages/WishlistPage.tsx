import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { toggle, clearWishlist } from '../wishlistSlice'
import { addItem } from '../../cart/cartSlice'
import toast from 'react-hot-toast'
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  useClearBackendWishlistMutation,
  useAddToCartMutation,
  useGetProductsQuery,
} from '../../../app/api'
import { getApiErrorMessage } from '../../../app/apiError'

export default function WishlistPage() {
  const dispatch = useAppDispatch()
  const [addToCart] = useAddToCartMutation()
  const [removeFromWishlistApi] = useRemoveFromWishlistMutation()
  const [clearBackendWishlistApi] = useClearBackendWishlistMutation()

  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const localWishlistIds = useAppSelector((state) => state.wishlist.productIds)

  // If logged in, fetch from backend DB; otherwise fallback to client query
  const { data: backendWishlist, isLoading: isWishlistLoading } = useGetWishlistQuery(undefined, {
    skip: !accessToken,
  })

  // Fallback for guest users
  const { data: productsResponse, isLoading: isProductsLoading } = useGetProductsQuery(
    { page: 1, limit: 100 },
    { skip: !!accessToken || localWishlistIds.length === 0 }
  )

  const isLoading = accessToken ? isWishlistLoading : isProductsLoading

  // Compute items depending on auth status
  let items: Array<{ productId: string; product: any }> = []

  if (accessToken && backendWishlist?.items) {
    items = backendWishlist.items.map((i) => ({
      productId: i.productId,
      product: i.product,
    }))
  } else {
    items = (productsResponse?.data || [])
      .filter((p) => localWishlistIds.includes(p.id))
      .map((p) => ({ productId: p.id, product: p }))
  }

  const handleRemove = async (productId: string) => {
    dispatch(toggle(productId))
    if (accessToken) {
      try {
        await removeFromWishlistApi(productId).unwrap()
      } catch (err) {
        console.warn('Failed to remove from backend wishlist:', err)
      }
    }
    toast.success('Removed from wishlist')
  }

  const handleClearAll = async () => {
    dispatch(clearWishlist())
    if (accessToken) {
      try {
        await clearBackendWishlistApi().unwrap()
      } catch (err) {
        console.warn('Failed to clear backend wishlist:', err)
      }
    }
    toast.success('Wishlist cleared')
  }

  const handleAddToCart = async (productId: string) => {
    if (!accessToken) {
      dispatch(addItem({ productId, quantity: 1 }))
      toast.success('Added to cart')
      return
    }

    try {
      await addToCart({ productId, quantity: 1 }).unwrap()
      dispatch(addItem({ productId, quantity: 1 }))
      toast.success('Added to cart')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not add this product to your cart.'))
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 bg-secondary-200 dark:bg-secondary-800 rounded w-48 mb-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square bg-secondary-200 dark:bg-secondary-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-3/4" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/2" />
                  <div className="h-6 bg-secondary-200 dark:bg-secondary-800 rounded w-1/4" />
                  <div className="h-10 bg-secondary-200 dark:bg-secondary-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
              <Heart className="h-10 w-10 text-secondary-400" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-secondary-900 dark:text-secondary-50">Your wishlist is empty</h1>
          <p className="mb-6 text-secondary-600 dark:text-secondary-400">
            Explore our collection, tap the heart icon on any product, and save items you love.
          </p>
          <Link to="/products" className="btn btn-primary inline-flex items-center gap-2">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-secondary-900 dark:text-secondary-50"
            >
              My Wishlist ({items.length})
            </motion.h1>
            <p className="mt-1 text-sm text-secondary-500">Items saved across your devices</p>
          </div>
          <button
            onClick={handleClearAll}
            className="btn btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" /> Clear All
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ productId, product }) => {
            const primaryImg = product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
            const discount = product?.mrp && product?.price
              ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
              : 0

            return (
              <motion.article
                key={productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card group overflow-hidden flex flex-col justify-between border border-secondary-200 dark:border-secondary-800 rounded-xl hover:shadow-lg transition-all"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                    <img
                      src={primaryImg}
                      alt={product?.title || 'Product'}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                        {discount}% OFF
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(productId)}
                      title="Remove from wishlist"
                      className="absolute top-2 right-2 rounded-full bg-white/90 p-2 text-secondary-600 shadow backdrop-blur transition hover:bg-red-50 hover:text-red-600 dark:bg-secondary-900/90 dark:text-secondary-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      {product?.brand || 'TRADENEST'}
                    </p>
                    <Link
                      to={`/products/${product?.slug || product?.id}`}
                      className="mt-1 block font-semibold text-secondary-900 line-clamp-2 hover:text-primary-600 dark:text-secondary-100"
                    >
                      {product?.title}
                    </Link>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
                        ₹{Number(product?.price || 0).toLocaleString('en-IN')}
                      </span>
                      {product?.mrp && Number(product.mrp) > Number(product.price) && (
                        <span className="text-sm text-secondary-400 line-through">
                          ₹{Number(product.mrp).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleAddToCart(productId)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
