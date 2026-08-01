import { motion } from 'framer-motion'
import { useState } from 'react'
import { Truck, Box, RotateCcw, Eye, Download, Star } from 'lucide-react'
import { clsx } from 'clsx'

const mockOrders = [
  { id: 'ORD-2024-001', date: '2024-01-15', status: 'DELIVERED', total: 3499, items: 2, canReturn: true },
  { id: 'ORD-2024-002', date: '2024-01-10', status: 'SHIPPED', total: 15999, items: 1, tracking: 'TRK123456789' },
  { id: 'ORD-2024-003', date: '2024-01-05', status: 'PROCESSING', total: 4999, items: 3 },
  { id: 'ORD-2024-004', date: '2023-12-28', status: 'CANCELLED', total: 2999, items: 1 },
]

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Box },
  SHIPPED: { label: 'Shipped', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Truck },
  PROCESSING: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Box },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: RotateCcw },
  RETURNED: { label: 'Returned', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: RotateCcw },
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', icon: Box },
}

export default function Orders() {
  const [filter, setFilter] = useState('all')

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-secondary-900 dark:text-secondary-50"
          >
            My Orders
          </motion.h1>

          <div className="flex flex-wrap gap-2">
            {['all', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                )}
              >
                {f === 'all' ? 'All' : statusConfig[f]?.label || f}
              </button>
            ))}
          </div>
        </div>

        {mockOrders
          .filter((o) => filter === 'all' || o.status === filter)
          .map((order, i) => (
            <motion.article
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="card overflow-hidden"
            >
              <div className="p-4 sm:grid sm:grid-cols-[1fr_200px_150px_200px] sm:items-center gap-4">
                <div className="mb-4 flex items-center gap-4 sm:mb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-secondary-50">{order.id}</p>
                    <p className="text-sm text-secondary-500">{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-4 sm:mb-0 sm:justify-center">
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">{order.items} item{order.items > 1 ? 's' : ''}</span>
                  <span className="font-semibold text-secondary-900 dark:text-secondary-50">₹{order.total.toLocaleString()}</span>
                </div>

                <div className="mb-4 flex items-center justify-center gap-2 sm:mb-0">
                  const cfg = statusConfig[order.status];
                  <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', cfg.color)}>
                    <cfg.icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {order.tracking && (
                    <button className="btn btn-outline text-sm">
                      <Truck className="mr-1 h-4 w-4" />
                      Track
                    </button>
                  )}
                  <button className="btn btn-outline text-sm">
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </button>
                  {order.canReturn && order.status === 'DELIVERED' && (
                    <button className="btn btn-outline text-sm text-orange-600 hover:bg-orange-50 border-orange-200">
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Return
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <button className="btn btn-outline text-sm">
                      <Download className="mr-1 h-4 w-4" />
                      Invoice
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <button className="btn btn-outline text-sm">
                      <Star className="mr-1 h-4 w-4" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}

        {mockOrders.filter((o) => filter === 'all' || o.status === filter).length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <Box className="mx-auto mb-4 h-12 w-12 text-secondary-300 dark:text-secondary-600" />
            <h3 className="mb-2 text-lg font-medium text-secondary-900 dark:text-secondary-50">No orders found</h3>
            <p className="text-secondary-500">Try changing your filter or start shopping!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}