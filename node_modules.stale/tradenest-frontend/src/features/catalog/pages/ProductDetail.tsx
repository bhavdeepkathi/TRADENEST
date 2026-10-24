import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { Star, Truck, Shield, RotateCcw, Heart, ShoppingCart, Minus, Plus, Share2, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { addItem } from '../../cart/cartSlice'
import { toggle } from '../../wishlist/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { useAddToCartMutation, useGetProductQuery, useGetProductReviewsQuery, useCreateProductReviewMutation } from '../../../app/api'
import { getApiErrorMessage } from '../../../app/apiError'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((s) => s.cart.items)
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [addToCart] = useAddToCartMutation()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  
  // The catalog endpoint accepts both the product ID and its unique slug.
  const { data: product, isLoading, error } = useGetProductQuery(slug || '', { 
    skip: !slug 
  })
  const { data: reviewsData } = useGetProductReviewsQuery(product?.id || '', {
    skip: !product?.id,
  })
  const [createProductReview, { isLoading: isSubmittingReview }] = useCreateProductReviewMutation()
  const errorStatus = error && 'status' in error ? error.status : undefined

  const isInWishlist = product ? wishlistIds.includes(product.id) : false
  const inCart = product ? cartItems.find((i) => i.productId === product.id) : undefined
  const availableQuantity = product?.inventory
    ? Math.max(0, product.inventory.quantity - product.inventory.reserved)
    : 0

  const handleAddToCart = async () => {
    if (product) {
      if (accessToken) {
        try {
          await addToCart({ productId: product.id, quantity }).unwrap()
          dispatch(addItem({ productId: product.id, quantity }))
          toast.success('Added to cart')
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Could not add this product to your cart. Please try again.'))
        }
        return
      }
      dispatch(addItem({ productId: product.id, quantity }))
      toast.success('Added to cart')
    }
  }

  const handleToggleWishlist = () => {
    if (product) {
      dispatch(toggle(product.id))
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist')
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="aspect-square rounded-xl bg-secondary-200 dark:bg-secondary-800" />
              <div className="flex gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="h-20 w-20 rounded-lg bg-secondary-200 dark:bg-secondary-800" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/4" />
              <div className="h-8 bg-secondary-200 dark:bg-secondary-800 rounded w-3/4" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/2" />
              <div className="h-32 bg-secondary-200 dark:bg-secondary-800 rounded" />
              <div className="h-40 bg-secondary-200 dark:bg-secondary-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    const isProductNotFound = !slug || errorStatus === 404

    return (
      <div className="px-4 py-16 text-center">
        <p className="text-red-500">
          {isProductNotFound ? 'Product not found' : 'Unable to load product. Please try again.'}
        </p>
        <Link to="/products" className="mt-4 btn btn-primary inline-block">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-secondary-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Products</Link>
          <span>/</span>
          <Link to={`/products/${product.category.slug}`} className="hover:text-primary-600">{product.category.name}</Link>
          <span>/</span>
          <span className="text-secondary-900 dark:text-secondary-50 truncate max-w-[200px]">{product.title}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 lg:grid-cols-2"
        >
          <div>
            <div className="mb-4 aspect-square rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-800">
              <img
                src={product.images[selectedImage] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=600&fit=crop'}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
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
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-primary-600">{product.category.name} / {product.subcategory}</p>
            <h1 className="mb-3 text-3xl font-bold text-secondary-900 dark:text-secondary-50">{product.title}</h1>
            <p className="mb-4 text-sm font-medium text-secondary-500">Brand: {product.brand}</p>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-secondary-900 dark:text-secondary-50">{product.ratingAvg == null ? '4.5' : Number(product.ratingAvg).toFixed(1)}</span>
                <span className="text-secondary-500">({product.reviewCount || 0} reviews)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-secondary-900 dark:text-secondary-50">₹{Number(product.price).toLocaleString()}</span>
              {product.mrp && Number(product.mrp) > Number(product.price) && (
                <>
                  <span className="line-through text-xl text-secondary-400">₹{Number(product.mrp).toLocaleString()}</span>
                  <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="mb-6 border-t border-b border-secondary-200 py-4 dark:border-secondary-700">
              <p className="text-secondary-600 dark:text-secondary-300">{product.description}</p>
            </div>

            {product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Highlights</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.tags.map((tag) => (
                    <li key={tag} className="flex items-center gap-2 text-secondary-600 dark:text-secondary-300">
                      <span className="h-2 w-2 rounded-full bg-primary-500" />
                      {tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                  max={availableQuantity || 99}
                />
                <button
                  onClick={() => setQuantity((q) => Math.min(availableQuantity || 99, q + 1))}
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
                disabled={availableQuantity === 0}
                className="btn btn-primary flex-1 min-w-[200px] flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" />
                {availableQuantity === 0 ? 'Out of Stock' : inCart ? 'Update Cart' : 'Add to Cart'}
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
                <span className="font-medium">Sold by:</span> TRADENEST
              </p>
            </div>
          </div>
        </motion.div>

        {/* Customer Reviews Section */}
        <section className="mt-12 border-t border-secondary-200 pt-10 dark:border-secondary-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">
                Customer Ratings & Reviews
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={clsx(
                        'h-5 w-5',
                        s <= Math.round(Number(product.ratingAvg || 0))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-secondary-300 dark:text-secondary-600'
                      )}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-secondary-900 dark:text-secondary-50">
                  {Number(product.ratingAvg || 0).toFixed(1)} out of 5
                </span>
                <span className="text-sm text-secondary-500">
                  ({product.reviewCount || 0} customer ratings)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!accessToken) {
                  toast.error('Please sign in to write a review')
                  return
                }
                setShowReviewModal(true)
              }}
              className="btn btn-outline inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              Write a Review
            </button>
          </div>

          {/* Reviews List */}
          {((reviewsData?.data || product.reviews || []).length === 0) ? (
            <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center dark:border-secondary-700">
              <Star className="mx-auto h-8 w-8 text-secondary-400" />
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                No reviews yet for this product. Be the first to review it!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(reviewsData?.data || product.reviews || []).map((rev: any) => (
                <div
                  key={rev.id}
                  className="card p-5 space-y-2.5 bg-white dark:bg-secondary-800/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={clsx(
                            'h-4 w-4',
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-secondary-300 dark:text-secondary-600'
                          )}
                        />
                      ))}
                      {rev.isVerifiedPurchase && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-secondary-400">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {rev.title && (
                    <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 text-sm">
                      {rev.title}
                    </h4>
                  )}

                  {rev.body && (
                    <p className="text-sm text-secondary-600 dark:text-secondary-300 leading-relaxed">
                      {rev.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-lg p-6 space-y-5 bg-white dark:bg-secondary-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                  Rate & Review Product
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!product) return
                  try {
                    await createProductReview({
                      productId: product.id,
                      rating: reviewRating,
                      title: reviewTitle.trim() || undefined,
                      body: reviewBody.trim() || undefined,
                    }).unwrap()
                    toast.success('Thank you! Your review has been submitted.')
                    setShowReviewModal(false)
                    setReviewTitle('')
                    setReviewBody('')
                    setReviewRating(5)
                  } catch (err: any) {
                    toast.error(err?.data?.message || err?.message || 'Failed to submit review')
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Product</p>
                  <p className="font-medium text-secondary-900 dark:text-secondary-100 text-sm line-clamp-1">
                    {product.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={clsx(
                            'h-7 w-7 transition-colors',
                            (reviewHoverRating || reviewRating) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-secondary-300 dark:text-secondary-600'
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {reviewRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Review Headline (optional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Great product, highly recommended!"
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Detailed Review
                  </label>
                  <textarea
                    rows={4}
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Tell other shoppers what you liked or disliked about this product..."
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    {isSubmittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}