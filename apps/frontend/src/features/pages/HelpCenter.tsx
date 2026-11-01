import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, Package, Truck, RotateCcw, CreditCard, User, HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

const faqCategories = [
  {
    id: 'orders',
    title: 'Orders & Tracking',
    icon: Package,
    faqs: [
      {
        q: 'How do I track my order in real-time?',
        a: 'You can track your order directly from the "Orders" page in your account. Click "View Details" to see the live stepper showing placement, confirmation, fleet dispatch, driver phone number, and distance to your doorstep.',
      },
      {
        q: 'What is the Doorstep Delivery OTP?',
        a: 'For security and fraud prevention, every order has a 4-digit Delivery OTP sent to your registered email and visible on your Order Details screen. Please provide this OTP to the delivery agent only when they hand over your package.',
      },
      {
        q: 'Can I cancel my order before it ships?',
        a: 'Yes! If your order is still in "Pending", "Confirmed", or "Processing" status, you can cancel it with one click from the Order Details page. Any prepaid amount will be instantly refunded to your TRADENEST Wallet.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    icon: Truck,
    faqs: [
      {
        q: 'What are the delivery charges?',
        a: 'We offer FREE shipping on all orders above ₹499 across India. For orders below ₹499, a nominal standard logistics fee of ₹40 is applied.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes between 2 to 4 business days in tier-1 metro cities (Mumbai, Delhi-NCR, Bangalore, Hyderabad, Chennai) and 3 to 6 days for the rest of India.',
      },
      {
        q: 'Do you offer Cash on Delivery (COD)?',
        a: 'Yes, Cash on Delivery is available across most serviceable pin codes throughout India.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    icon: RotateCcw,
    faqs: [
      {
        q: 'What is the return window?',
        a: 'You can request a return within 7 days of package delivery directly from your Order Details page. Simply select your reason and confirm.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Prepaid orders cancelled before shipment or approved returns are credited immediately to your TRADENEST Wallet or within 3-5 working days to your original bank / UPI payment account.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Wallet',
    icon: CreditCard,
    faqs: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards (Visa, MasterCard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking from all Indian banks, and TRADENEST Wallet balance.',
      },
      {
        q: 'How do coupon codes work?',
        a: 'Enter your promo code (e.g. WELCOME50) in the coupon input field on the Checkout page and click "Apply" to receive an immediate discount.',
      },
    ],
  },
]

export default function HelpCenter() {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('orders')
  const [openFaq, setOpenFaq] = useState<string | null>('orders-0')

  const currentCategory = faqCategories.find((c) => c.id === selectedCat) || faqCategories[0]

  return (
    <div className="px-4 py-12 bg-secondary-50/50 dark:bg-secondary-950/40 min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Hero Banner */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-950/60 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3"
          >
            <HelpCircle className="h-4 w-4" /> 24/7 Customer Care
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-900 dark:text-secondary-100">
            How can we help you today?
          </h1>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400 max-w-xl mx-auto">
            Find quick answers to common questions about your orders, shipments, returns, and account.
          </p>

          {/* Search Box */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics (e.g. tracking, OTP, refund, returns)..."
              className="w-full rounded-2xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 pl-12 pr-4 py-3 text-sm text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {faqCategories.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`flex flex-col items-center p-4 rounded-2xl border text-center transition ${
                  isSelected
                    ? 'border-primary-600 bg-white dark:bg-secondary-900 shadow-md ring-2 ring-primary-500/20 text-primary-600 dark:text-primary-400'
                    : 'border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 text-secondary-600 hover:border-secondary-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 ${isSelected ? 'bg-primary-50 dark:bg-primary-950/60' : 'bg-secondary-100 dark:bg-secondary-800'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">{cat.title}</span>
              </button>
            )
          })}
        </div>

        {/* FAQs Accordion */}
        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-6 flex items-center gap-2">
            <currentCategory.icon className="h-5 w-5 text-primary-600" /> {currentCategory.title} FAQs
          </h2>

          <div className="space-y-3">
            {currentCategory.faqs.map((faq, idx) => {
              const faqId = `${currentCategory.id}-${idx}`
              const isOpen = openFaq === faqId
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/40 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faqId)}
                    className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm text-secondary-900 dark:text-secondary-100 hover:text-primary-600"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-secondary-400" /> : <ChevronDown className="h-4 w-4 text-secondary-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-secondary-600 dark:text-secondary-300 leading-relaxed border-t border-secondary-100 dark:border-secondary-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact Strip */}
        <div className="mt-8 rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-secondary-900 dark:text-secondary-100 text-base">Still have questions?</h3>
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">Our support team is available round the clock to assist you.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/contact" className="btn btn-primary text-xs inline-flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> Contact Support Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
