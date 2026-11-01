import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Clock, CheckCircle2, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactUs() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitted(true)
    toast.success('Your message has been sent! Ticket ID: #TN-' + Math.floor(100000 + Math.random() * 900000))
  }

  return (
    <div className="px-4 py-12 bg-secondary-50/50 dark:bg-secondary-950/40 min-h-screen">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-extrabold text-secondary-900 dark:text-secondary-100"
          >
            Contact Customer Support
          </motion.h1>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400 max-w-lg mx-auto">
            Have an issue with an order, shipment, or vendor account? We're here to help you 24 hours a day.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Details Card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-5">Direct Channels</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary-400 uppercase">Email Support</p>
                    <a href="mailto:support@tradenest.in" className="text-sm font-bold text-secondary-900 dark:text-secondary-100 hover:text-primary-600">
                      support@tradenest.in
                    </a>
                    <p className="text-[11px] text-secondary-400 mt-0.5">Response within 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary-400 uppercase">Toll-Free Helpline</p>
                    <a href="tel:18001234567" className="text-sm font-bold text-secondary-900 dark:text-secondary-100 hover:text-emerald-600">
                      1800-123-4567
                    </a>
                    <p className="text-[11px] text-secondary-400 mt-0.5">Mon - Sun: 8:00 AM - 10:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary-400 uppercase">Headquarters</p>
                    <p className="text-sm font-bold text-secondary-900 dark:text-secondary-100">
                      TRADENEST Tower, 4th Floor
                    </p>
                    <p className="text-xs text-secondary-500">Outer Ring Road, Bangalore, KA 560103</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-gradient-to-br from-primary-600 to-indigo-700 p-6 text-white shadow-md">
              <h3 className="font-bold text-base mb-1">Instant AI Assistant</h3>
              <p className="text-xs text-white/80 leading-relaxed mb-4">
                Need fast order tracking or product advice? Click the purple AI assistant bubble at the bottom right for instant replies.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur">
                <Clock className="h-3.5 w-3.5" /> 24/7 Automated Agent
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-3 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">Message Received!</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
                  Thank you for reaching out. A support ticket has been created and our team will get back to your email shortly.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn btn-outline text-xs">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Send us a Message</h2>
                <p className="text-xs text-secondary-500 mb-6">Fill out the form below and we will contact you promptly.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2.5 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2.5 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1.5">
                    Subject / Order ID
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Query regarding Order #ord-1234 or Return"
                    className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2.5 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1.5">
                    How can we help? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail..."
                    className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2.5 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full py-3 inline-flex items-center justify-center gap-2 font-bold"
                >
                  <Send className="h-4 w-4" /> Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
