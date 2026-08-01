import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingCart, Eye } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { toggle, clearWishlist } from '../wishlistSlice'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const mockProducts: Record<string, { title: string; price: number; mrp?: number; image: string; rating: number }> = {
  'prod-1': { title: 'Premium Wireless Headphones', price: 2999, mrp: 4999, image: 'https://picsum.photos/seed/headphones1/300/300', rating: 4.5 },
  'prod-2': { title: 'Smart Watch Series 5', price: 15999, mrp: 19999, image: 'https://picsum.photos/seed/watch1/300/300', rating: 4.7 },
  'prod-3': { title: 'Mechanical Keyboard', price: 4999, image: 'https://picsum.photos/seed/keyboard1/300/300', rating: 4.3 },
  'prod-4': { title: 'Portable Bluetooth Speaker', price: 2499, mrp: 3499, image: 'https://picsum.photos/seed/speaker1/300/300', rating: 4.2 },
}

export default function WishlistPage() {
  const dispatch = useAppDispatch()
  const productIds = useAppSelector((s) => s.wishlist.productIds)

  const items = productIds.map((id) => ({ id, ...mockProducts[id] })).filter((i) => i.title)

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
          <p className="mb-6 text-secondary-600 dark:text-secondary-400">Save items you love and buy them later.</p>
          <Link to="/products" className="btn btn-primary inline-flex">
            Start Shopping
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-secondary-900 dark:text-secondary-50"
          >
            My Wishlist ({items.length})
          </motion.h1>

          <button
            onClick={() => { if (confirm('Clear entire wishlist?')) { dispatch(clearWishlist()); toast.success('Wishlist cleared') }}}
            className="btn btn-outline text-sm text-red-600 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product, i) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="card overflow-hidden"
            >
              <Link to={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                <img src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                {product.mrp && product.mrp > product.price && (
                  <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                  </span>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); dispatch(toggle(product.id)); toast.success('Removed from wishlist') }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-lg transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </Link>

              <div className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="mb-2 line-clamp-2 font-medium text-secondary-900 dark:text-secondary-50 hover:text-primary-600">
                    {product.title}
                  </h3>
                </Link>

                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-50">★ {product.rating}</span>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xl font-bold text-secondary-900 dark:text-secondary-50">₹{product.price.toLocaleString()}</span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="line-through text-sm text-secondary-400">₹{product.mrp.toLocaleString()}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1 text-sm">
                    <ShoppingCart className="mr-1 h-4 w-4" />
                    Add to Cart
                  </button>
                  <Link to={`/products/${product.id}`} className="btn btn-outline flex-1 text-sm">
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}