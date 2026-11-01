import { motion } from 'framer-motion'
import { ShieldCheck, Truck, Users, Award, TrendingUp, Sparkles, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutUs() {
  const stats = [
    { value: '500,000+', label: 'Happy Customers' },
    { value: '50,000+', label: 'Verified Sellers' },
    { value: '19,000+', label: 'Pincodes Served' },
    { value: '99.8%', label: 'On-time Handover' },
  ]

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Customer-Centric Trust',
      desc: 'With secure escrow payments, verified merchant ratings, and Doorstep Delivery OTP verification, every transaction is 100% protected.',
    },
    {
      icon: Truck,
      title: 'Pan-India Fleet Network',
      desc: 'Our logistics infrastructure connects metro cities to tier-3 towns, providing rapid 2-4 day delivery and hassle-free doorstep pickups.',
    },
    {
      icon: Users,
      title: 'Empowering Sellers & Resellers',
      desc: 'We provide zero-onboarding-fee seller onboarding and Meesho-style zero-investment reselling with automated margin payouts.',
    },
    {
      icon: Sparkles,
      title: 'Next-Gen AI Commerce',
      desc: 'Built with intelligent recommendation algorithms and a 24/7 conversational shopping assistant to help you discover the exact products you love.',
    },
  ]

  return (
    <div className="bg-white dark:bg-secondary-900 min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-primary-50/60 via-white to-white dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-900">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-950/60 px-4 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300 mb-4"
          >
            About TRADENEST
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-secondary-900 dark:text-secondary-100 tracking-tight">
            Building India's Most Trusted & Empowering Marketplace
          </h1>
          <p className="mt-4 text-base sm:text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto leading-relaxed">
            TRADENEST was founded with a single mission: to provide Indian shoppers with unbeatable prices, guaranteed genuine products, and empower local entrepreneurs to sell and resell nationwide.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/40 py-10">
        <div className="mx-auto max-w-5xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, idx) => (
            <div key={idx}>
              <p className="text-3xl sm:text-4xl font-black text-primary-600 dark:text-primary-400">{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-secondary-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Why Millions Choose TRADENEST</h2>
            <p className="mt-2 text-sm text-secondary-500 max-w-md mx-auto">
              Our core principles ensure a world-class shopping experience from checkout to delivery.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {pillars.map((p, idx) => {
              const Icon = p.icon
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-secondary-200 dark:border-secondary-800 p-6 bg-white dark:bg-secondary-900 shadow-sm hover:shadow-md transition"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-2">{p.title}</h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-12 px-4 bg-primary-600 text-white text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black">Ready to Start Shopping or Selling?</h2>
          <p className="text-sm text-white/80 max-w-xl mx-auto">
            Explore thousands of curated items across electronics, fashion, beauty, and home, or start your seller journey today.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/products" className="btn bg-white text-primary-700 hover:bg-secondary-100 font-bold">
              Shop Now
            </Link>
            <Link to="/seller/dashboard" className="btn border border-white text-white hover:bg-white/10 font-bold">
              Sell on TRADENEST
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
