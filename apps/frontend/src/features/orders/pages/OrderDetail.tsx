import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { Truck, Box, RotateCcw, Eye, Download, Star, CreditCard, Wallet, Smartphone, CheckCircle, Clock, MapPin, Package, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useGetOrderQuery } from '../../../app/api'

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
  const { data: order, isLoading, error } = useGetOrderQuery(id || '', { skip: !id })

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
  const billingAddress = order.billingAddress as Record<string, string>

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
                      <Link to={`/products/${item.product?.slug || ''}`} className="font-medium text-secondary-900 dark:text-secondary-50 hover:text-primary-600">
                        {item.title}
                      </Link>
                      <p className="text-sm text-secondary-500">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                      {item.discount > 0 && (
                        <p className="text-sm text-green-600">Discount: -₹{item.discount.toLocaleString()}</p>
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
          className="mt-8 flex flex-wrap gap-4"
        >
          <Link to="/orders" className="btn btn-outline">
            Back to Orders
          </Link>
          {order.invoice && (
            <a 
              href={order.invoice.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <Download className="mr-1 h-4 w-4" />
              Download Invoice
            </a>
          )}
          {order.status === 'DELIVERED' && (
            <button className="btn btn-primary">
              <Star className="mr-1 h-4 w-4" />
              Write Review
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}