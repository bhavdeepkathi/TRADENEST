import { motion } from 'framer-motion'
import { Truck, Clock, ShieldCheck, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ShippingPolicy() {
  return (
    <div className="px-4 py-12 bg-secondary-50/50 dark:bg-secondary-950/40 min-h-screen">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3">
            <Truck className="h-4 w-4" /> Shipping & Logistics Information
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-900 dark:text-secondary-100">
            TRADENEST Shipping & Delivery Policy
          </h1>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            Last updated: November 2026 • Valid for all pan-India shipments
          </p>
        </div>

        {/* Highlights */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
            <Clock className="h-6 w-6 text-primary-600 mb-2" />
            <h3 className="font-bold text-sm text-secondary-900 dark:text-secondary-100">2-4 Business Days</h3>
            <p className="text-xs text-secondary-500 mt-1">Average delivery timeline across major tier-1 and tier-2 metros.</p>
          </div>

          <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
            <Truck className="h-6 w-6 text-emerald-600 mb-2" />
            <h3 className="font-bold text-sm text-secondary-900 dark:text-secondary-100">Free Shipping</h3>
            <p className="text-xs text-secondary-500 mt-1">Applicable on all eligible orders having a cart value of ₹499 or higher.</p>
          </div>

          <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-bold text-sm text-secondary-900 dark:text-secondary-100">OTP-Secured Handover</h3>
            <p className="text-xs text-secondary-500 mt-1">Guaranteed doorstep verification via unique 4-digit customer delivery OTP.</p>
          </div>
        </div>

        {/* Full Details */}
        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 sm:p-8 space-y-6 text-secondary-700 dark:text-secondary-300 text-sm leading-relaxed shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">1. Order Processing & Dispatch</h2>
            <p>
              Once your order is successfully placed, the merchant partner is notified immediately to pack your items. In-stock products are handed over to our verified delivery fleet within 24 to 36 hours. You will receive an email confirmation with full tracking details as soon as the dispatch is logged.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">2. Real-Time Tracking & Fleet Updates</h2>
            <p>
              You can track your package 24/7 through your <Link to="/orders" className="text-primary-600 underline font-semibold">Orders</Link> dashboard. Each step displays the status, timestamp, driver details, and contact number once the order is out for delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">3. Doorstep Delivery OTP Protocol</h2>
            <p>
              To ensure no package is ever delivered to the wrong address or falsely marked as completed, TRADENEST enforces a mandatory 4-digit OTP. You will receive this OTP via email upon dispatch. Provide this code to the courier partner only when you inspect the physical parcel at your doorstep.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">4. Undeliverable Packages</h2>
            <p>
              If our delivery agent is unable to reach you after 3 separate delivery attempts, the package will be safely returned to the nearest local hub. In the case of prepaid orders, a full refund will be processed back to your TRADENEST Wallet.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
