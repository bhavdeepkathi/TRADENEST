import { useLocation } from 'react-router-dom'
import { Shield, FileText, Lock } from 'lucide-react'

export default function LegalPage() {
  const location = useLocation()
  const isPrivacy = location.pathname.includes('privacy')

  return (
    <div className="px-4 py-12 bg-secondary-50/50 dark:bg-secondary-950/40 min-h-screen">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary-200 dark:bg-secondary-800 px-3.5 py-1 text-xs font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
            {isPrivacy ? <Shield className="h-4 w-4" /> : <FileText className="h-4 w-4" />} Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-900 dark:text-secondary-100">
            {isPrivacy ? 'TRADENEST Privacy Policy' : 'TRADENEST Terms of Service'}
          </h1>
          <p className="mt-2 text-xs text-secondary-500">
            Effective Date: November 2026 • Governing Law: Republic of India
          </p>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 sm:p-8 space-y-6 text-secondary-700 dark:text-secondary-300 text-sm leading-relaxed shadow-sm">
          {isPrivacy ? (
            <>
              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">1. Information We Collect</h2>
                <p>
                  We collect information necessary to process your transactions and provide personalized shopping experiences. This includes your name, email address, shipping destination, phone number, and encrypted transaction identifiers. We do not store raw credit/debit card details on our servers; payments are processed securely via PCI-DSS certified partners (Razorpay).
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">2. How We Use Your Data</h2>
                <p>
                  Your information is utilized solely to process orders, send dispatch alerts and Doorstep Delivery OTPs, process wallet refunds, and provide automated recommendations. We strictly never sell or rent your personal information to third-party advertisers.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">3. Data Security & Encryption</h2>
                <p>
                  All network traffic is encrypted using 256-bit Transport Layer Security (TLS). Account passwords are protected with cryptographic salted hashes.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">4. Your Privacy Rights</h2>
                <p>
                  You may view, update, or request the deletion of your account and personal data at any time by contacting support@tradenest.in or through your Profile settings.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">1. Acceptance of Terms</h2>
                <p>
                  By accessing or utilizing the TRADENEST website, application, or services, you agree to be legally bound by these Terms of Service. If you do not agree to these terms, please refrain from using our marketplace.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">2. Marketplace Platform Role</h2>
                <p>
                  TRADENEST operates as an online e-commerce platform facilitating transactions between independent registered merchants and prospective buyers. Sellers are solely responsible for ensuring the authenticity, legality, and warranty of goods listed under their store.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">3. User Conduct & Abuse Prevention</h2>
                <p>
                  Users agree not to engage in fraudulent chargebacks, systematic abuse of return policies, or unauthorized scraping of catalog data. Any accounts engaged in suspicious or abusive activities are subject to immediate suspension.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">4. Limitation of Liability</h2>
                <p>
                  TRADENEST is not liable for indirect, incidental, or consequential damages arising out of system downtime, network delays, or merchant supply chain interruptions beyond reasonable platform control.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
