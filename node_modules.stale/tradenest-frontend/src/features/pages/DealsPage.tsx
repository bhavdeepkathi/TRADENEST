import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tag, Sparkles, Flame, Copy, Check, ArrowRight, ShoppingCart, Percent } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGetProductsQuery, useGetCouponsQuery } from '../../app/api'

export default function DealsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { data: coupons = [] } = useGetCouponsQuery()
  const { data: productsData, isLoading } = useGetProductsQuery({ page: 1, limit: 40 })

  const products = productsData?.data || []
  const discountedProducts = products.filter((p: any) => (p.discountPercent || 0) >= 15)

  const defaultCoupons = [
    { code: 'WELCOME50', description: 'Flat ₹50 OFF on first purchase above ₹499', type: 'FLAT', value: 50, minOrder: 499 },
    { code: 'FESTIVE15', description: '15% OFF on orders above ₹999 up to ₹300', type: 'PERCENT', value: 15, minOrder: 999 },
    { code: 'MEGA20', description: '20% OFF on all electronics and fashion above ₹1499', type: 'PERCENT', value: 20, minOrder: 1499 },
  ]

  const activeCoupons = coupons.length > 0 ? coupons : defaultCoupons

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Coupon code "${code}" copied to clipboard!`)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  return (
    <div className="bg-secondary-50/50 dark:bg-secondary-950/40 min-h-screen py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              <Flame className="h-4 w-4 text-yellow-300" /> Mega Deals & Clearance
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Huge Savings Across All Categories
            </h1>
            <p className="text-sm sm:text-base text-white/90">
              Enjoy verified merchant discounts, extra promo code savings, and free doorstep delivery on orders over ₹499.
            </p>
          </div>
          <Percent className="absolute -right-8 -bottom-10 h-64 w-64 text-white/10 rotate-12" />
        </div>

        {/* Coupons Carousel / Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                <Tag className="h-5 w-5 text-red-500" /> Available Promo Coupons
              </h2>
              <p className="text-xs text-secondary-500">Apply these promo codes at checkout for instant order discounts</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {activeCoupons.map((coupon: any, idx: number) => {
              const isCopied = copiedCode === coupon.code
              return (
                <div
                  key={idx}
                  className="rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-lg text-primary-600 dark:text-primary-400 tracking-wider bg-primary-50 dark:bg-primary-950/60 px-3 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {coupon.type === 'PERCENT' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 font-medium leading-relaxed">
                      {coupon.description}
                    </p>
                    {coupon.minOrder && (
                      <p className="text-[11px] text-secondary-400 mt-1">
                        Min. cart value: ₹{Number(coupon.minOrder).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="mt-4 btn btn-outline w-full text-xs font-bold flex items-center justify-center gap-1.5 py-2"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? 'Code Copied!' : 'Copy Code'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Discounted Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> Top Discounted Products
              </h2>
              <p className="text-xs text-secondary-500">Hand-picked bargains with verified seller pricing</p>
            </div>
            <Link to="/products" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              View Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 bg-secondary-200 dark:bg-secondary-800 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {discountedProducts.slice(0, 16).map((prod: any) => {
                const discount = prod.discountPercent || (prod.mrp ? Math.round(((Number(prod.mrp) - Number(prod.price)) / Number(prod.mrp)) * 100) : 0)
                const img = prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'

                return (
                  <Link
                    key={prod.id}
                    to={`/products/${prod.slug || prod.id}`}
                    className="group rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                        <img
                          src={img}
                          alt={prod.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2.5 left-2.5 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-black text-white shadow-md">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                          {prod.brand || 'TRADENEST'}
                        </span>
                        <h3 className="mt-1 font-semibold text-sm text-secondary-900 dark:text-secondary-100 line-clamp-2">
                          {prod.title}
                        </h3>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-lg font-black text-secondary-900 dark:text-secondary-50">
                            ₹{Number(prod.price).toLocaleString('en-IN')}
                          </span>
                          {prod.mrp && Number(prod.mrp) > Number(prod.price) && (
                            <span className="text-xs text-secondary-400 line-through">
                              ₹{Number(prod.mrp).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="btn btn-outline w-full text-xs font-bold group-hover:bg-primary-600 group-hover:text-white transition">
                        View Deal
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
