import { motion } from 'framer-motion'
import { RotateCcw, ShieldCheck, CheckCircle2, Clock, Wallet, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ReturnsPolicy() {
  const steps = [
    {
      num: '1',
      title: 'Submit Request Online',
      desc: 'Go to your Orders page, open the delivered order, and click "Return Product". Select your return reason and submit.',
    },
    {
      num: '2',
      title: 'Doorstep Courier Pickup',
      desc: 'Our logistics fleet arrives at your registered delivery address within 24-48 hours to collect the item in original condition.',
    },
    {
      num: '3',
      title: 'Instant Refund Credit',
      desc: 'As soon as the pickup is scanned or seller approves, your complete payment is credited directly to your TRADENEST Wallet or source account.',
    },
  ]

  return (
    <div className="px-4 py-12 bg-secondary-50/50 dark:bg-secondary-950/40 min-h-screen">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
            <RotateCcw className="h-4 w-4" /> 7-Day Hassle-Free Returns
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-900 dark:text-secondary-100">
            Returns, Exchanges & Refunds Policy
          </h1>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            Clear, transparent protection for every purchase on TRADENEST.
          </p>
        </div>

        {/* 3 Step Card */}
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, idx) => (
            <div key={idx} className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-black text-sm mb-3">
                {s.num}
              </div>
              <h3 className="font-bold text-base text-secondary-900 dark:text-secondary-100 mb-1">{s.title}</h3>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Policy Details */}
        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 sm:p-8 space-y-6 text-secondary-700 dark:text-secondary-300 text-sm leading-relaxed shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">1. Eligibility Criteria for Returns</h2>
            <p>
              Items are eligible for return or replacement within 7 calendar days of delivery if they meet any of the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Item was delivered in a physically damaged or defective condition.</li>
              <li>Item received is distinctly different from what was described or ordered (wrong color, model, size).</li>
              <li>Missing essential accessories, parts, or manuals.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">2. Condition of Returned Goods</h2>
            <p>
              Please keep the item in its original unused condition with all brand outer packaging, price tags, warranty cards, and user manuals intact. During pickup, our delivery rider will inspect the item before scanning the return handover.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">3. Non-Returnable Categories</h2>
            <p>
              For hygiene and security reasons, select items such as innerwear, opened cosmetics, digital gift cards, and consumable perishables cannot be returned unless received damaged or past expiry.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">4. Refund Timelines & Methods</h2>
            <p>
              <strong>TRADENEST Wallet:</strong> Instant credit upon return approval (zero waiting time).<br />
              <strong>UPI / Net Banking / Credit Card:</strong> 2 to 5 business days depending on your bank partner.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
