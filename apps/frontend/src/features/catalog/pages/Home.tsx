import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingCart, Heart, Truck, Shield, Star, Zap } from 'lucide-react'

const features = [
  { icon: Zap, title: 'AI Recommendations', desc: 'Personalized product suggestions powered by machine learning' },
  { icon: Shield, title: 'Secure Payments', desc: 'Razorpay, Stripe, UPI with end-to-end encryption' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Real-time tracking with multiple logistics partners' },
  { icon: Heart, title: 'Wishlist & Alerts', desc: 'Save favorites and get price drop notifications' },
  { icon: Star, title: 'Reviews & Ratings', desc: 'Verified purchase reviews with photo uploads' },
  { icon: ShoppingCart, title: 'Smart Cart', desc: 'Persistent cart with auto-coupon application' },
]

export default function Home() {
  return (
    <div className="px-4 py-16 sm:py-24">
      <section className="mx-auto max-w-7xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-4xl font-bold tracking-tight text-secondary-900 dark:text-secondary-50 sm:text-6xl"
        >
          Welcome to <span className="text-primary-600">TRADENEST</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-2xl text-lg text-secondary-600 dark:text-secondary-300"
        >
          India's next-gen AI-powered digital marketplace. Discover, buy, and sell with confidence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex gap-4 justify-center"
        >
          <Link to="/products" className="btn btn-primary text-lg px-8">
            Explore Products
          </Link>
          <Link to="/register" className="btn btn-outline text-lg px-8">
            Start Selling
          </Link>
        </motion.div>
      </section>

      <section className="mt-24 mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-secondary-900 dark:text-secondary-50">
          Why Choose TRADENEST?
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="card p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-secondary-900 dark:text-secondary-50">{f.title}</h3>
              <p className="text-secondary-600 dark:text-secondary-300">{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mt-24 mx-auto max-w-7xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-16"
        >
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to start selling?</h2>
          <p className="mb-8 mx-auto max-w-xl text-lg text-primary-100">
            Join thousands of sellers growing their business on TRADENEST. Free to start, pay only when you sell.
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 text-lg">
            Create Seller Account
          </Link>
        </motion.div>
      </section>
    </div>
  )
}