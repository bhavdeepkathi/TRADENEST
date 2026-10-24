import { motion } from 'framer-motion'
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Truck, Box, RotateCcw, Eye, Download, Star, CreditCard, Wallet, Smartphone, CheckCircle, Clock, MapPin, Package, AlertCircle, X, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useGetOrderQuery, useCreateProductReviewMutation, useCreateReturnRequestMutation } from '../../../app/api'
import { useAppSelector } from '../../../app/hooks'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Box },
  SHIPPED: { label: 'Shipped', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Truck },
  PROCESSING: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Box },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: RotateCcw },
  RETURNED: { label: 'Returned', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: RotateCcw },
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', icon: Box },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Box },
}

const paymentStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  SUCCESS: { label: 'Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  INITIATED: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: RotateCcw },
}

const paymentMethodIcons: Record<string, any> = {
  RAZORPAY: CreditCard,
  STRIPE: CreditCard,
  UPI: Smartphone,
  WALLET: Wallet,
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { data: order, isLoading, error } = useGetOrderQuery(id || '', { skip: !id })
  const [createProductReview, { isLoading: isSubmittingReview }] = useCreateProductReviewMutation()
  const [createReturnRequest, { isLoading: isSubmittingReturn }] = useCreateReturnRequestMutation()

  const [isDownloading, setIsDownloading] = useState(false)
  const [reviewItem, setReviewItem] = useState<{ productId: string; title: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')

  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnReasonType, setReturnReasonType] = useState('Defective or damaged product')
  const [returnComment, setReturnComment] = useState('')

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-4xl animate-pulse">
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/4" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/2" />
            </div>
            <div className="card p-6 space-y-4">
              {[0,1,2].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="h-16 w-16 rounded-lg bg-secondary-200 dark:bg-secondary-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-3/4" />
                    <div className="h-3 bg-secondary-200 dark:bg-secondary-800 rounded w-1/2" />
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-red-500 mb-4">Order not found</p>
        <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
      </div>
    )
  }

  const cfg = statusConfig[order.status]
  const paymentCfg = order.payment ? paymentStatusConfig[order.payment.status] : null
  const paymentMethodIcon = order.payment ? paymentMethodIcons[order.payment.provider] : null
  const StatusIcon = cfg?.icon || Box
  const PaymentStatusIcon = paymentCfg?.icon || Clock
  const PaymentMethodIcon = paymentMethodIcon || CreditCard

  const shippingAddress = order.shippingAddress as Record<string, string>
  const activeReturn = order.returns && order.returns.length > 0 ? order.returns[0] : null
  const canReturnOrder = order.status === 'DELIVERED' && (!activeReturn || activeReturn.status === 'REJECTED')

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true)
      const res = await fetch(`/api/orders/${order.id}/invoice`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || 'Failed to download invoice')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${order.invoice?.number || order.id.slice(-8).toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Invoice downloaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Error downloading invoice')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewItem) return
    try {
      await createProductReview({
        productId: reviewItem.productId,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: reviewBody.trim() || undefined,
      }).unwrap()
      toast.success('Thank you! Your review has been submitted.')
      setReviewItem(null)
      setReviewTitle('')
      setReviewBody('')
      setReviewRating(5)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit review')
    }
  }

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullReason = returnComment.trim()
      ? `${returnReasonType}: ${returnComment.trim()}`
      : returnReasonType
    try {
      await createReturnRequest({
        orderId: order.id,
        reason: fullReason,
      }).unwrap()
      toast.success('Return request submitted successfully')
      setShowReturnModal(false)
      setReturnComment('')
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit return request')
    }
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link to="/orders" className="text-sm text-secondary-500 hover:text-primary-600 mb-2 inline-block">
              ← Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-50">Order Details</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', cfg?.color || statusConfig.PENDING.color)}>
              <StatusIcon className="h-3.5 w-3.5" fill="currentColor" />
              {cfg?.label || order.status}
            </span>
            {order.payment && (
              <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', paymentCfg?.color || 'bg-gray-100 text-gray-700')}>
                <PaymentStatusIcon className="h-3.5 w-3.5" fill="currentColor" />
                {paymentCfg?.label || order.payment.status}
              </span>
            )}
          </div>
        </motion.div>

        {/* Return Status & Lifecycle Card */}
        {activeReturn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              'mb-6 rounded-2xl border p-5 shadow-sm transition-all',
              activeReturn.status === 'APPROVED'
                ? 'border-green-200 bg-green-50/90 dark:border-green-800 dark:bg-green-950/30'
                : activeReturn.status === 'REJECTED'
                ? 'border-red-200 bg-red-50/90 dark:border-red-800 dark:bg-red-950/30'
                : 'border-purple-200 bg-purple-50/90 dark:border-purple-800 dark:bg-purple-950/40'
            )}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-purple-200/60 dark:border-purple-800/60">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  activeReturn.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300' :
                  activeReturn.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300' :
                  'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                )}>
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                      {activeReturn.status === 'APPROVED' ? 'Return Approved — Pickup Scheduled' :
                       activeReturn.status === 'REJECTED' ? 'Return Request Declined' :
                       'Return Request Under Review'}
                    </h3>
                    <span className={clsx(
                      'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                      activeReturn.status === 'APPROVED' ? 'bg-green-200 text-green-900 dark:bg-green-900/70 dark:text-green-200' :
                      activeReturn.status === 'REJECTED' ? 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-200' :
                      'bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200'
                    )}>
                      {activeReturn.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">
                    Requested on {new Date(activeReturn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              <p className="text-secondary-700 dark:text-secondary-300">
                <span className="font-medium text-secondary-900 dark:text-secondary-100">Return Reason:</span> {activeReturn.reason}
              </p>
            </div>

            {/* Step-by-Step Return Flow when PENDING */}
            {activeReturn.status === 'PENDING' && (
              <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/60">
                <p className="text-xs font-semibold text-secondary-900 dark:text-secondary-100 uppercase tracking-wider mb-3">
                  Return Progress & Next Steps
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/80 dark:bg-secondary-900/60 p-3 rounded-xl border border-secondary-200/80 dark:border-secondary-700">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-xs mb-1">
                      <CheckCircle className="h-4 w-4" />
                      1. Request Submitted
                    </div>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      Your return request has been submitted to the seller with your specified reason.
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-secondary-900/60 p-3 rounded-xl border border-amber-300 dark:border-amber-700">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs mb-1">
                      <Clock className="h-4 w-4 animate-spin" />
                      2. Seller Approval (Pending)
                    </div>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      The seller reviews and approves the return from their portal.
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-secondary-900/30 p-3 rounded-xl border border-secondary-200 dark:border-secondary-800 opacity-70">
                    <div className="flex items-center gap-2 text-secondary-500 font-medium text-xs mb-1">
                      <Truck className="h-4 w-4" />
                      3. Doorstep Pickup & Refund
                    </div>
                    <p className="text-xs text-secondary-500">
                      Courier collects item from your address; refund of ₹{Number(order.total || 0).toLocaleString('en-IN')} will be credited.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Pickup Details & Instructions */}
            {activeReturn.status === 'APPROVED' && (
              <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800/60 space-y-3">
                <div className="bg-white/90 dark:bg-secondary-900/70 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-sm mb-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    Doorstep Courier Pickup Scheduled
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-secondary-700 dark:text-secondary-300">
                    <div>
                      <span className="text-secondary-500 block">Pickup Location:</span>
                      <span className="font-medium text-secondary-900 dark:text-secondary-100">
                        {shippingAddress?.fullName ? `${shippingAddress.fullName}, ${shippingAddress.line1}, ${shippingAddress.city} - ${shippingAddress.postalCode}` : 'Your shipping address'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-500 block">Estimated Pickup Window:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">Within 24–48 hours</span>
                    </div>
                    <div>
                      <span className="text-secondary-500 block">Refund Amount:</span>
                      <span className="font-bold text-secondary-900 dark:text-secondary-100">₹{Number(order.total || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-secondary-500 block">Refund Method:</span>
                      <span className="font-medium text-secondary-900 dark:text-secondary-100">Original Payment ({order.payment?.provider || 'Bank Account'})</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-100/60 dark:bg-green-950/40 p-3 rounded-xl text-xs text-green-900 dark:text-green-300 space-y-1">
                  <p className="font-semibold">Handover Checklist:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-green-800 dark:text-green-300">
                    <li>Pack the product securely in its original packaging/box with all tags, accessories, and manuals.</li>
                    <li>Ensure all brand tags and price stickers are intact.</li>
                    <li>Hand over the package to the courier partner executive upon arrival. Pickup is 100% free; do not pay any cash.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Rejection notice */}
            {activeReturn.status === 'REJECTED' && (
              <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300">
                <p className="font-medium">The seller or support team declined this return request.</p>
                <p className="mt-0.5 text-red-600 dark:text-red-400">If you believe this decision is incorrect or the item arrived severely broken, please contact our 24/7 customer support.</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600" />
                Order Items ({order.items.length})
              </h2>
              
              <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                      <img 
                        src={item.product?.images[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop'} 
                        alt={item.title} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product?.id || ''}`} className="font-medium text-secondary-900 dark:text-secondary-50 hover:text-primary-600">
                        {item.title}
                      </Link>
                      <p className="text-sm text-secondary-500">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                      {item.discount > 0 && (
                        <p className="text-sm text-green-600">Discount: -₹{item.discount.toLocaleString()}</p>
                      )}
                      {order.status === 'DELIVERED' && (
                        <div className="mt-2">
                          <button
                            onClick={() => setReviewItem({ productId: item.product?.id || item.productId, title: item.title })}
                            className="text-xs btn btn-outline py-1 px-2.5 inline-flex items-center gap-1.5 text-primary-600 border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/30"
                          >
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            Write Review
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-secondary-900 dark:text-secondary-50">
                        ₹{(Number(item.price) * item.quantity - Number(item.discount)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Payment Details */}
            {order.payment && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                  <PaymentMethodIcon className="h-5 w-5 text-primary-600" fill="currentColor" />
                  Payment Details
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-secondary-500">Payment Method</p>
                    <p className="font-medium capitalize">{order.payment.provider.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Payment Status</p>
                    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', paymentCfg?.color || 'bg-gray-100 text-gray-700')}>
                      <PaymentStatusIcon className="h-3.5 w-3.5" fill="currentColor" />
                      {paymentCfg?.label || order.payment.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Amount Paid</p>
                    <p className="font-medium text-secondary-900 dark:text-secondary-50">₹{order.payment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Transaction ID</p>
                    <p className="font-mono text-sm text-secondary-900 dark:text-secondary-50">{order.payment.providerRef}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-secondary-500">Payment Date</p>
                    <p className="font-medium text-secondary-900 dark:text-secondary-50">{new Date(order.payment.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Shipping Address */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Shipping Address
              </h2>
              
              <address className="text-secondary-600 dark:text-secondary-300 not-italic">
                <p className="font-medium">{shippingAddress.line1}</p>
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                <p>{shippingAddress.country}</p>
              </address>
            </motion.section>
          </div>

          <div className="space-y-6">
            {/* Order Summary */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 sticky top-24"
            >
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Subtotal</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Shipping</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-50">
                    {order.shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${order.shipping.toLocaleString()}`}
                  </span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600 dark:text-secondary-400">Tax (18% GST)</span>
                    <span className="font-medium text-secondary-900 dark:text-secondary-50">₹{order.tax.toLocaleString()}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-secondary-200 pt-4 dark:border-secondary-700">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-secondary-900 dark:text-secondary-50">Total</span>
                  <span className="text-primary-600">₹{order.total.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-secondary-500">Inclusive of all taxes</p>
              </div>
            </motion.aside>

            {/* Order Timeline */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Order Timeline
              </h2>
              
              <div className="relative pl-4 border-l-2 border-secondary-200 dark:border-secondary-700">
                {[
                  { status: 'PENDING', label: 'Order Placed', time: order.createdAt, icon: Package },
                  { status: 'CONFIRMED', label: 'Order Confirmed', time: order.updatedAt, icon: CheckCircle },
                  { status: 'PROCESSING', label: 'Processing', time: order.updatedAt, icon: Box },
                  { status: 'SHIPPED', label: 'Shipped', time: order.updatedAt, icon: Truck },
                  { status: 'DELIVERED', label: 'Delivered', time: order.updatedAt, icon: Box },
                ].map((step, index) => {
                  const isCompleted = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].indexOf(order.status) >= 
                    ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].indexOf(step.status)
                  const isCurrent = order.status === step.status
                  
                  return (
                    <div key={step.status} className="relative mb-6 flex items-start">
                      <div className={clsx(
                        'absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2',
                        isCompleted ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-secondary-900 border-secondary-300',
                        isCurrent && 'ring-4 ring-primary-100 dark:ring-primary-900/30'
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <step.icon className={clsx('h-4 w-4', isCurrent ? 'text-primary-600' : 'text-secondary-400')} />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={clsx('font-medium', isCurrent ? 'text-primary-600' : 'text-secondary-900 dark:text-secondary-50')}>
                          {step.label}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {new Date(step.time).toLocaleString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          </div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <Link to="/orders" className="btn btn-outline">
            Back to Orders
          </Link>

          {/* Download Invoice Button */}
          <button
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin text-primary-600" /> : <Download className="h-4 w-4 text-primary-600" />}
            {isDownloading ? 'Generating...' : 'Download Invoice'}
          </button>

          {/* Write Review Button for delivered orders */}
          {order.status === 'DELIVERED' && order.items.length > 0 && (
            <button
              onClick={() => setReviewItem({ productId: order.items[0]?.product?.id || order.items[0]?.productId, title: order.items[0]?.title || 'Product' })}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              Write Review
            </button>
          )}

          {/* Return Product Button */}
          {canReturnOrder && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="btn btn-outline border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 inline-flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Return Product
            </button>
          )}
        </motion.div>

        {/* Product Review Modal */}
        {reviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-lg p-6 space-y-5 bg-white dark:bg-secondary-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                  Rate & Review Product
                </h3>
                <button
                  onClick={() => setReviewItem(null)}
                  className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Product</p>
                  <p className="font-medium text-secondary-900 dark:text-secondary-100 text-sm line-clamp-1">
                    {reviewItem.title}
                  </p>
                </div>

                {/* Star Rating Selector */}
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

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Review Headline (optional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Excellent build quality, worth the price!"
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  />
                </div>

                {/* Review Body */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Detailed Review
                  </label>
                  <textarea
                    rows={4}
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewItem(null)}
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

        {/* Return Order Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-lg p-6 space-y-5 bg-white dark:bg-secondary-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
                <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 flex items-center gap-2 text-orange-600">
                  <RotateCcw className="h-5 w-5" />
                  Request Product Return
                </h3>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <p className="text-xs text-secondary-500 mb-0.5">Order Reference</p>
                  <p className="font-mono text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {order.id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Reason for Return
                  </label>
                  <select
                    value={returnReasonType}
                    onChange={(e) => setReturnReasonType(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  >
                    <option value="Defective or damaged product">Defective or damaged product</option>
                    <option value="Received wrong item">Received wrong item</option>
                    <option value="Product quality not as expected">Product quality not as expected</option>
                    <option value="Item does not match description">Item does not match description</option>
                    <option value="Missing parts or accessories">Missing parts or accessories</option>
                    <option value="Other reason">Other reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Additional Details / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Provide additional details regarding the issue (optional)..."
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
                  />
                </div>

                <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3 text-xs text-orange-800 dark:text-orange-300">
                  <p className="font-medium">Return Policy Notice:</p>
                  <p className="mt-0.5">Returns are reviewed by the seller and platform support within 24-48 business hours. Please ensure the product is in its original packaging with all tags attached.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="btn btn-primary bg-orange-600 hover:bg-orange-700 border-orange-600 inline-flex items-center gap-2"
                  >
                    {isSubmittingReturn && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmittingReturn ? 'Submitting...' : 'Confirm Return Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}