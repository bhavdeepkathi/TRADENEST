import { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, ChevronDown, ChevronUp, Package, Truck, Wallet, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const sellerFaqs = [
  {
    q: 'How do I add a new product to my TRADENEST store?',
    a: 'Go to the "Add Product" tab from your sidebar menu. Enter the product title, select a category, upload clear product photos, set the MRP and selling price, and specify available inventory stock. Click "Publish Product" to immediately make it live for millions of buyers.',
  },
  {
    q: 'How do customer order pickups work?',
    a: 'When an order is placed, you will receive an in-app and email alert. Pack the product securely with a shipping label. A TRADENEST delivery partner is automatically assigned to collect the package directly from your registered store address.',
  },
  {
    q: 'What is the Doorstep Delivery OTP?',
    a: 'TRADENEST features end-to-end delivery safety. Every customer receives a unique 4-digit Doorstep Delivery OTP on their email. The logistics rider enters this OTP before the order status can be completed, ensuring guaranteed proof of delivery.',
  },
  {
    q: 'When and how do I receive my payouts?',
    a: 'As soon as an order is delivered and completed, your net revenue is credited directly to your TRADENEST Wallet. You can transfer your funds to your bank account or UPI ID at any time from the "Payouts & Wallet" page.',
  },
  {
    q: 'What are TRADENEST commission rates?',
    a: 'TRADENEST operates on a seller-friendly zero hidden fees model. You keep 100% of your earnings minus standard payment processing and logistics fees specified in your seller agreement.',
  },
  {
    q: 'How are customer returns handled?',
    a: 'Customers can request a return within 7 days of delivery. The return request appears on your Orders dashboard. You can review the reason and images, and approve or reject it. Approved returns are picked up by our logistics fleet and returned to your address.',
  },
]

export default function SellerHelp() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Seller Knowledge Base & Support</h1>
        <p className="text-sm text-secondary-500">Everything you need to grow your store and fulfill orders seamlessly</p>
      </div>

      {/* Quick Start Feature Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center mb-3">
            <Package className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-secondary-900 dark:text-secondary-100 text-sm">Product Catalog</h3>
          <p className="mt-1 text-xs text-secondary-500 leading-relaxed">
            High quality images and accurate category tags boost product search visibility by 3x.
          </p>
          <Link to="/seller/products/add" className="mt-3 inline-flex items-center text-xs font-semibold text-primary-600 hover:underline">
            Add Product →
          </Link>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3">
            <Truck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-secondary-900 dark:text-secondary-100 text-sm">Fulfillment & Pickup</h3>
          <p className="mt-1 text-xs text-secondary-500 leading-relaxed">
            Same-day packaging ensures our fleet dispatches your order within 24 hours.
          </p>
          <Link to="/seller/orders" className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline">
            Manage Orders →
          </Link>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-secondary-900 dark:text-secondary-100 text-sm">Instant Withdrawals</h3>
          <p className="mt-1 text-xs text-secondary-500 leading-relaxed">
            Withdraw your delivered earnings directly to UPI or your bank account with zero fees.
          </p>
          <Link to="/seller/payouts" className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline">
            View Payouts →
          </Link>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-secondary-900 dark:text-secondary-100 text-sm">KYC & Protection</h3>
          <p className="mt-1 text-xs text-secondary-500 leading-relaxed">
            Verified sellers enjoy automated fraud protection and priority customer support.
          </p>
          <Link to="/seller/settings" className="mt-3 inline-flex items-center text-xs font-semibold text-purple-600 hover:underline">
            KYC Status →
          </Link>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-2">Frequently Asked Questions</h2>
        <p className="text-xs text-secondary-500 mb-6">Find answers to common seller inquiries</p>

        <div className="space-y-3">
          {sellerFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="rounded-xl border border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/40 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm text-secondary-900 dark:text-secondary-100 hover:text-primary-600"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-secondary-400" /> : <ChevronDown className="h-4 w-4 text-secondary-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-secondary-600 dark:text-secondary-300 leading-relaxed border-t border-secondary-100 dark:border-secondary-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dedicated Seller Support Box */}
      <div className="rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-secondary-900 dark:text-secondary-100 text-base">Need Dedicated Seller Assistance?</h3>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Our Merchant Partner Specialists are available 7 days a week, 9 AM to 8 PM IST.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:merchant-support@tradenest.in"
            className="btn btn-outline bg-white dark:bg-secondary-900 text-xs inline-flex items-center gap-1.5"
          >
            <Mail className="h-3.5 w-3.5 text-primary-600" /> Email Support
          </a>
          <a
            href="tel:18001234567"
            className="btn btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Phone className="h-3.5 w-3.5" /> Call Merchant Helpline
          </a>
        </div>
      </div>
    </div>
  )
}
