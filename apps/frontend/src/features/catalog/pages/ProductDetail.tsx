import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { Star, Truck, Shield, RotateCcw, Heart, ShoppingCart, Minus, Plus, Share2 } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { addItem } from '../../cart/cartSlice'
import { toggle } from '../../wishlist/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'

const mockProduct = {
  id: 'prod-1',
  title: 'Premium Wireless Headphones',
  slug: 'premium-wireless-headphones',
  price: 2999,
  mrp: 4999,
  description: 'Experience crystal-clear sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort.',
  images: [
    'https://picsum.photos/seed/headphones1/600/600',
    'https://picsum.photos/seed/headphones2/600/600',
    'https://picsum.photos/seed/headphones3/600/600',
  ],
  rating: 4.5,
  reviewCount: 234,
  inStock: true,
  seller: 'AudioTech India',
  category: 'Electronics > Audio',
  highlights: ['Active Noise Cancellation', '30hr Battery', 'Bluetooth 5.2', 'Quick Charge'],
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((s) => s.cart.items)
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const isInWishlist = wishlistIds.includes(mockProduct.id)
  const inCart = cartItems.find((i) => i.productId === mockProduct.id)

  const handleAddToCart = () => {
    dispatch(addItem({ productId: mockProduct.id, quantity }))
  }

  const handleToggleWishlist = () => {
    dispatch(toggle(mockProduct.id))
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-secondary-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Products</Link>
          <span>/</span>
          <span className="text-secondary-900 dark:text-secondary-50 truncate max-w-[200px]">{mockProduct.title}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 lg:grid-cols-2"
        >
          <div>
            <div className="mb-4 aspect-square rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-800">
              <img
                src={mockProduct.images[selectedImage]}
                alt={mockProduct.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mockProduct.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={clsx(
                    'flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-colors',
                    i === selectedImage ? 'border-primary-500' : 'border-transparent hover:border-secondary-300'
                  )}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === selectedImage ? 'true' : 'false'}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-primary-600">{mockProduct.category}</p>
            <h1 className="mb-3 text-3xl font-bold text-secondary-900 dark:text-secondary-50">{mockProduct.title}</h1>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-secondary-900 dark:text-secondary-50">{mockProduct.rating}</span>
                <span className="text-secondary-500">({mockProduct.reviewCount} reviews)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {mockProduct.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-secondary-900 dark:text-secondary-50">₹{mockProduct.price.toLocaleString()}</span>
              {mockProduct.mrp && mockProduct.mrp > mockProduct.price && (
                <>
                  <span className="line-through text-xl text-secondary-400">₹{mockProduct.mrp.toLocaleString()}</span>
                  <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {Math.round(((mockProduct.mrp - mockProduct.price) / mockProduct.mrp) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="mb-6 border-t border-b border-secondary-200 py-4 dark:border-secondary-700">
              <p className="text-secondary-600 dark:text-secondary-300">{mockProduct.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Highlights</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {mockProduct.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-secondary-600 dark:text-secondary-300">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center border border-secondary-300 rounded-lg dark:border-secondary-600">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-x border-secondary-300 focus:outline-none dark:border-secondary-600"
                  min={1}
                  max={99}
                />
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="p-3 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!mockProduct.inStock}
                className="btn btn-primary flex-1 min-w-[200px] flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {inCart ? 'Update Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={clsx('btn flex-1 min-w-[200px] flex items-center justify-center gap-2', isInWishlist ? 'btn-primary' : 'btn-outline')}
              >
                <Heart className={clsx('h-5 w-5', isInWishlist ? 'fill-current' : '')} />
                {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <button className="btn btn-outline flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
                <Truck className="h-6 w-6 text-primary-600" />
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-50">Free Delivery</p>
                  <p className="text-sm text-secondary-500">On orders above ₹499</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
                <RotateCcw className="h-6 w-6 text-primary-600" />
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-50">7 Day Returns</p>
                  <p className="text-sm text-secondary-500">Easy return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
                <Shield className="h-6 w-6 text-primary-600" />
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-50">Secure Payment</p>
                  <p className="text-sm text-secondary-500">100% secure checkout</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                <span className="font-medium">Sold by:</span> {mockProduct.seller}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}