import { motion } from 'framer-motion'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, Truck, Shield, RotateCcw, Heart, ShoppingCart, Minus, Plus, Share2, X, Loader2, Zap, Sparkles, TrendingUp, CheckCircle2, MessageCircle, MessageSquare, HelpCircle, Send, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { addItem } from '../../cart/cartSlice'
import { toggle } from '../../wishlist/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { useAddToCartMutation, useGetProductQuery, useGetProductReviewsQuery, useCreateProductReviewMutation, useGetRecommendationsQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation, useGetProductQuestionsQuery, useAskProductQuestionMutation, useAnswerProductQuestionMutation } from '../../../app/api'
import { getApiErrorMessage } from '../../../app/apiError'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((s) => s.cart.items)
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const currentUser = useAppSelector((s) => s.auth.user)
  const [addToCart] = useAddToCartMutation()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')

  // Reseller state
  const [showResellModal, setShowResellModal] = useState(false)
  const [customResalePrice, setCustomResalePrice] = useState<number | ''>('')

  // WhatsApp share state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppMargin, setWhatsAppMargin] = useState<number>(300)
  const [whatsAppType, setWhatsAppType] = useState<'standard' | 'reseller'>('reseller')
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)

  // Customer Q&A state
  const [showAskModal, setShowAskModal] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [questionFilter, setQuestionFilter] = useState('')
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  
  // The catalog endpoint accepts both the product ID and its unique slug.
  const { data: product, isLoading, error } = useGetProductQuery(slug || '', { 
    skip: !slug 
  })
  const { data: reviewsData } = useGetProductReviewsQuery(product?.id || '', {
    skip: !product?.id,
  })
  const { data: questionsData } = useGetProductQuestionsQuery(product?.id || '', {
    skip: !product?.id,
  })
  const { data: recommendations = [], isLoading: isLoadingRecs } = useGetRecommendationsQuery(
    { productId: product?.id, categoryId: product?.category?.id || (product as any)?.categoryId, limit: 4 },
    { skip: !product?.id }
  )
  const [createProductReview, { isLoading: isSubmittingReview }] = useCreateProductReviewMutation()
  const [askProductQuestion, { isLoading: isSubmittingQuestion }] = useAskProductQuestionMutation()
  const [answerProductQuestion, { isLoading: isSubmittingAnswer }] = useAnswerProductQuestionMutation()
  const [addToWishlistMutation] = useAddToWishlistMutation()
  const [removeFromWishlistMutation] = useRemoveFromWishlistMutation()
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

  const handleBuyNow = async () => {
    if (!product) return
    if (availableQuantity === 0) {
      toast.error('This product is out of stock')
      return
    }
    if (accessToken) {
      try {
        await addToCart({ productId: product.id, quantity }).unwrap()
      } catch (error) {
        // Continue to checkout with local cart
      }
    }
    dispatch(addItem({ productId: product.id, quantity }))
    navigate('/checkout')
  }

  const handleToggleWishlist = async () => {
    if (product) {
      const willBeInWishlist = !isInWishlist
      dispatch(toggle(product.id))
      toast.success(willBeInWishlist ? 'Added to wishlist' : 'Removed from wishlist')
      if (accessToken) {
        try {
          if (willBeInWishlist) {
            await addToWishlistMutation(product.id).unwrap()
          } else {
            await removeFromWishlistMutation(product.id).unwrap()
          }
        } catch (e) {
          console.warn('Failed to sync wishlist with backend:', e)
        }
      }
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

            <div className="mb-6 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-secondary-900 dark:text-secondary-50">₹{Number(product.price).toLocaleString()}</span>
              {product.mrp && Number(product.mrp) > Number(product.price) && (
                <>
                  <span className="line-through text-xl text-secondary-400">₹{Number(product.mrp).toLocaleString()}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% OFF
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString()}
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

            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={availableQuantity === 0}
                className="btn btn-outline flex-1 min-w-[160px] py-3 text-base flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" />
                {availableQuantity === 0 ? 'Out of Stock' : inCart ? 'Update Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={availableQuantity === 0}
                className="btn btn-primary flex-1 min-w-[160px] py-3 text-base flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-5 w-5 fill-current" />
                Buy Now
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setCustomResalePrice(Math.round(Number(product.price) * 1.3))
                  setShowResellModal(true)
                }}
                className="btn border border-emerald-500 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600 flex-1 min-w-[180px] flex items-center justify-center gap-2 font-medium"
              >
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                💼 Resell & Earn Margin
              </button>
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="btn bg-[#25D366] hover:bg-[#20ba59] text-white flex-1 min-w-[180px] flex items-center justify-center gap-2 font-semibold shadow-sm"
                title="Share on WhatsApp with custom margin"
              >
                <MessageCircle className="h-5 w-5 fill-current" />
                WhatsApp Share
              </button>
              <button
                onClick={handleToggleWishlist}
                className={clsx('btn flex-1 min-w-[140px] flex items-center justify-center gap-2', isInWishlist ? 'btn-primary' : 'btn-outline')}
              >
                <Heart className={clsx('h-5 w-5', isInWishlist ? 'fill-current' : '')} />
                {isInWishlist ? 'In Wishlist' : 'Wishlist'}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.title, url: window.location.href }).catch(() => {})
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('Product link copied to clipboard')
                  }
                }}
                className="btn btn-outline flex items-center justify-center gap-2"
                title="Share product link"
              >
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

        {/* ✨ AI Recommended Similar Products Section */}
        {recommendations.length > 0 && (
          <section className="mt-12 border-t border-secondary-200 pt-10 dark:border-secondary-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                    AI Recommendations
                  </span>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">
                    Similar Products You May Like
                  </h2>
                </div>
                <p className="text-sm text-secondary-500 mt-1">
                  Customers who viewed this item also explored these related picks
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => {
                const recDiscount = rec.mrp && Number(rec.mrp) > Number(rec.price)
                  ? Math.round(((Number(rec.mrp) - Number(rec.price)) / Number(rec.mrp)) * 100)
                  : 0
                return (
                  <Link
                    key={rec.id}
                    to={`/product/${rec.slug}`}
                    className="card group overflow-hidden flex flex-col hover:shadow-lg transition-all border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-800/60"
                  >
                    <div className="aspect-square relative overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                      <img
                        src={rec.images?.[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop'}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {recDiscount > 0 && (
                        <span className="absolute top-2 left-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                          {recDiscount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        {rec.category && (
                          <span className="text-xs text-primary-600 font-medium">
                            {rec.category.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {rec.title}
                        </h3>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-base text-secondary-900 dark:text-secondary-50">
                            ₹{Number(rec.price).toLocaleString()}
                          </span>
                          {rec.mrp && Number(rec.mrp) > Number(rec.price) && (
                            <span className="line-through text-xs text-secondary-400">
                              ₹{Number(rec.mrp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {rec.ratingAvg != null && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-secondary-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{Number(rec.ratingAvg).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

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

        {/* Customer Questions & Answers Section */}
        <section className="mt-12 border-t border-secondary-200 pt-10 dark:border-secondary-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">
                  Customer Questions & Answers
                </h2>
              </div>
              <p className="text-sm text-secondary-500 mt-1">
                Have doubts about this product? Find answers from verified buyers and the seller.
              </p>
            </div>

            <button
              onClick={() => {
                if (!accessToken) {
                  toast.error('Please sign in to ask a question')
                  return
                }
                setShowAskModal(true)
              }}
              className="btn btn-outline inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <MessageSquare className="h-4 w-4 text-primary-600" />
              Ask a Question
            </button>
          </div>

          {/* Search bar inside questions */}
          {(questionsData?.data && questionsData.data.length > 0) && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search questions & answers..."
                value={questionFilter}
                onChange={(e) => setQuestionFilter(e.target.value)}
                className="w-full sm:max-w-md rounded-lg border border-secondary-300 bg-white px-4 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100"
              />
            </div>
          )}

          {/* Questions List */}
          {(!questionsData?.data || questionsData.data.length === 0) ? (
            <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center dark:border-secondary-700">
              <HelpCircle className="mx-auto h-8 w-8 text-secondary-400" />
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                No questions asked yet for this product. Be the first to ask!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionsData.data
                .filter((q) =>
                  !questionFilter ||
                  q.question.toLowerCase().includes(questionFilter.toLowerCase()) ||
                  (q.answer && q.answer.toLowerCase().includes(questionFilter.toLowerCase()))
                )
                .map((q) => (
                  <div key={q.id} className="card p-5 space-y-3 bg-white dark:bg-secondary-800/60 border border-secondary-200 dark:border-secondary-700/60">
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-base text-primary-600 dark:text-primary-400">Q:</span>
                      <div className="flex-1">
                        <p className="font-semibold text-secondary-900 dark:text-secondary-100 text-sm sm:text-base">
                          {q.question}
                        </p>
                        <p className="text-xs text-secondary-400 mt-1">
                          Asked by {q.userName || 'Shopper'} • {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {q.answer ? (
                      <div className="flex items-start gap-3 pl-2 sm:pl-4 border-l-2 border-emerald-500/50 bg-secondary-50/70 dark:bg-secondary-900/40 p-3 rounded-r-lg">
                        <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">A:</span>
                        <div className="flex-1">
                          <p className="text-sm text-secondary-700 dark:text-secondary-200 leading-relaxed">
                            {q.answer}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {q.answeredBy || 'Verified Seller'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-4 text-xs text-secondary-500 italic flex items-center justify-between">
                        <span>Awaiting answer from seller...</span>
                        {(currentUser?.role === 'SELLER' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                          <button
                            onClick={() => {
                              setAnsweringQuestionId(answeringQuestionId === q.id ? null : q.id)
                              setAnswerText('')
                            }}
                            className="btn btn-outline btn-xs text-primary-600 border-primary-500"
                          >
                            Answer this
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline Seller/Admin Answer Input */}
                    {answeringQuestionId === q.id && (
                      <div className="pt-2 pl-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
                        <textarea
                          rows={2}
                          placeholder="Type seller answer here..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          className="w-full rounded-lg border border-secondary-300 bg-white p-2.5 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setAnsweringQuestionId(null)}
                            className="btn btn-outline btn-xs"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={!answerText.trim() || isSubmittingAnswer}
                            onClick={async () => {
                              try {
                                await answerProductQuestion({
                                  questionId: q.id,
                                  answer: answerText.trim(),
                                }).unwrap()
                                toast.success('Answer published!')
                                setAnsweringQuestionId(null)
                                setAnswerText('')
                              } catch (err: any) {
                                toast.error(err?.data?.message || 'Failed to submit answer')
                              }
                            }}
                            className="btn btn-primary btn-xs inline-flex items-center gap-1"
                          >
                            {isSubmittingAnswer ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Publish Answer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Ask Question Modal */}
        {showAskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-lg p-6 space-y-4 bg-white dark:bg-secondary-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary-600" />
                  Ask a Question
                </h3>
                <button
                  onClick={() => setShowAskModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!product || !questionText.trim()) return
                  try {
                    await askProductQuestion({
                      productId: product.id,
                      question: questionText.trim(),
                    }).unwrap()
                    toast.success('Your question has been submitted!')
                    setShowAskModal(false)
                    setQuestionText('')
                  } catch (err: any) {
                    toast.error(err?.data?.message || err?.message || 'Failed to submit question')
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
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Your Question
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g. Does this support fast charging? What is the warranty period?"
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Keep your question focused on product features, specifications, and compatibility.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAskModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuestion || !questionText.trim()}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    {isSubmittingQuestion && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmittingQuestion ? 'Posting...' : 'Post Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 1-Click WhatsApp Reseller & Share Modal */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-lg p-6 space-y-5 bg-white dark:bg-secondary-900 shadow-2xl border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366]">
                    <MessageCircle className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50">
                      Share via WhatsApp
                    </h3>
                    <p className="text-xs text-secondary-500">Instant catalog & product promotion on WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 bg-secondary-100 dark:bg-secondary-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setWhatsAppType('reseller')}
                  className={clsx(
                    'py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                    whatsAppType === 'reseller'
                      ? 'bg-white dark:bg-secondary-900 text-emerald-600 dark:text-emerald-400 shadow'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900'
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  Reseller Mode (Margin)
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppType('standard')}
                  className={clsx(
                    'py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                    whatsAppType === 'standard'
                      ? 'bg-white dark:bg-secondary-900 text-primary-600 shadow'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900'
                  )}
                >
                  <Share2 className="h-4 w-4" />
                  Direct Share (Best Price)
                </button>
              </div>

              {/* Reseller Margin Input */}
              {whatsAppType === 'reseller' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Your Reseller Profit Margin per Unit:
                    </label>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Cost: ₹{Number(product.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={whatsAppMargin}
                      onChange={(e) => setWhatsAppMargin(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 300"
                      className="w-full rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-secondary-800 pl-8 pr-4 py-2 text-sm font-bold text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 pt-1">
                    <span>Final Price for Buyer:</span>
                    <span className="font-extrabold text-sm">
                      ₹{(Number(product.price) + Number(whatsAppMargin || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Preview Box */}
              <div>
                <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-1.5">
                  WhatsApp Message Preview:
                </p>
                <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-[#EFEAE2] dark:bg-secondary-800/70 p-3.5 text-xs text-secondary-900 dark:text-secondary-100 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                  {`🛍️ *Special Offer on TradeNest!*

*${product.title}*
🏷️ *Deal Price:* ₹${(Number(product.price) + (whatsAppType === 'reseller' ? Number(whatsAppMargin || 0) : 0)).toLocaleString()} ${product.mrp && Number(product.mrp) > (Number(product.price) + (whatsAppType === 'reseller' ? Number(whatsAppMargin || 0) : 0)) ? `(MRP: ~₹${Number(product.mrp).toLocaleString()}~)` : ''}
${product.brand ? `🏢 *Brand:* ${product.brand}\n` : ''}📦 *Key Highlights:*
• 100% Genuine Quality Product
• Fast & Reliable Doorstep Delivery 🚚
• Cash on Delivery (COD) Available 💵
• 7-Day Easy Replacement / Returns 🔄

🔗 *Tap to view product & order:*
${window.location.href}`}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const message = `🛍️ *Special Offer on TradeNest!*

*${product.title}*
🏷️ *Deal Price:* ₹${(Number(product.price) + (whatsAppType === 'reseller' ? Number(whatsAppMargin || 0) : 0)).toLocaleString()} ${product.mrp && Number(product.mrp) > (Number(product.price) + (whatsAppType === 'reseller' ? Number(whatsAppMargin || 0) : 0)) ? `(MRP: ~₹${Number(product.mrp).toLocaleString()}~)` : ''}
${product.brand ? `🏢 *Brand:* ${product.brand}\n` : ''}📦 *Key Highlights:*
• 100% Genuine Quality Product
• Fast & Reliable Doorstep Delivery 🚚
• Cash on Delivery (COD) Available 💵
• 7-Day Easy Replacement / Returns 🔄

🔗 *Tap to view product & order:*
${window.location.href}`
                    navigator.clipboard.writeText(message)
                    setCopiedWhatsApp(true)
                    toast.success('WhatsApp text copied to clipboard!')
                    setTimeout(() => setCopiedWhatsApp(false), 2500)
                  }}
                  className="btn btn-outline flex-1 flex items-center justify-center gap-1.5 text-xs"
                >
                  {copiedWhatsApp ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copiedWhatsApp ? 'Copied!' : 'Copy Text'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const message = `🛍️ *Special Offer on TradeNest!*

*${product.title}*
🏷️ *Deal Price:* ₹${(Number(product.price) + (whatsAppType === 'reseller' ? Number(whatsAppMargin || 0) : 0)).toLocaleString()} ${product.mrp && Number(product.mrp) > (Number(product.price) + (whatsAppType === 'reseller' ? Number(whatsAppMargin || 0) : 0)) ? `(MRP: ~₹${Number(product.mrp).toLocaleString()}~)` : ''}
${product.brand ? `🏢 *Brand:* ${product.brand}\n` : ''}📦 *Key Highlights:*
• 100% Genuine Quality Product
• Fast & Reliable Doorstep Delivery 🚚
• Cash on Delivery (COD) Available 💵
• 7-Day Easy Replacement / Returns 🔄

🔗 *Tap to view product & order:*
${window.location.href}`
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
                  }}
                  className="btn bg-[#25D366] hover:bg-[#20ba59] text-white flex-1 flex items-center justify-center gap-1.5 text-xs font-bold shadow"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  Open in WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Reseller Modal */}
        {showResellModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-lg p-6 space-y-5 bg-white dark:bg-secondary-900 shadow-2xl border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50">
                      Resell & Earn Margin
                    </h3>
                    <p className="text-xs text-secondary-500">Sell at your chosen price. We deliver directly to your customer.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResellModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop'}
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm text-secondary-900 dark:text-secondary-100 line-clamp-1">{product.title}</p>
                      <p className="text-xs text-secondary-500">Quantity: {quantity} unit(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary-500">Platform Cost</p>
                    <p className="font-bold text-secondary-900 dark:text-secondary-100">₹{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                    Set Customer Bill / Selling Price (per unit)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-500 font-bold">₹</span>
                    <input
                      type="number"
                      min={Number(product.price)}
                      value={customResalePrice}
                      onChange={(e) => setCustomResalePrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      placeholder={`e.g. ${Math.round(Number(product.price) * 1.35)}`}
                      className="w-full rounded-lg border border-secondary-300 bg-white pl-8 pr-4 py-2.5 text-base font-semibold text-secondary-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                    />
                  </div>
                  <p className="text-xs text-secondary-500">
                    Minimum recommended price: ₹{Number(product.price).toLocaleString()}
                  </p>
                </div>

                {/* Profit Margin Preview Box */}
                {customResalePrice !== '' && Number(customResalePrice) >= Number(product.price) ? (
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">Customer Bill Amount:</span>
                      <span className="font-bold text-emerald-950 dark:text-emerald-100">₹{(Number(customResalePrice) * quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">Platform Cost (You pay):</span>
                      <span className="font-medium text-secondary-600 dark:text-secondary-400">₹{(Number(product.price) * quantity).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-emerald-200 dark:border-emerald-800/80 pt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Your Reseller Profit:
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        +₹{((Number(customResalePrice) - Number(product.price)) * quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
                    Please enter a selling price equal to or higher than platform cost (₹{Number(product.price).toLocaleString()}).
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-800/40 p-3 rounded-lg">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Invoice generated for the customer will strictly show <strong>₹{customResalePrice || 0}</strong>.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Shipped directly to the customer's delivery address without platform pricing.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Margin profit is credited directly to your TRADENEST Wallet upon delivery.</span>
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResellModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!customResalePrice || Number(customResalePrice) < Number(product.price)}
                    onClick={() => {
                      setShowResellModal(false)
                      dispatch(addItem({ productId: product.id, quantity }))
                      navigate('/checkout', {
                        state: {
                          isReseller: true,
                          resellerPrice: Number(customResalePrice),
                          productId: product.id,
                          quantity,
                        },
                      })
                    }}
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Proceed to Reseller Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}