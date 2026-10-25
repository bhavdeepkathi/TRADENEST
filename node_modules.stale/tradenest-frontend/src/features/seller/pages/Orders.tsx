import { Search, Eye, Edit, Truck, XCircle, CheckCircle, ChevronDown, ChevronUp, Loader2, X, Package, MapPin, CreditCard, RotateCcw, Check, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useGetSellerOrdersQuery, useUpdateOrderStatusMutation, useProcessReturnRequestMutation } from '../../../app/api'
import { useAppSelector } from '../../../app/hooks'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const statusStyles: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SHIPPED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RETURNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const paymentStyles: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INITIATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const statusActions: Record<string, { label: string; nextStatus: string; icon: React.ReactNode }[]> = {
  PENDING: [
    { label: 'Approve Order', nextStatus: 'CONFIRMED', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
    { label: 'Cancel', nextStatus: 'CANCELLED', icon: <XCircle className="h-4 w-4 text-red-600" /> },
  ],
  CONFIRMED: [
    { label: 'Process', nextStatus: 'PROCESSING', icon: <Truck className="h-4 w-4 text-yellow-600" /> },
    { label: 'Cancel', nextStatus: 'CANCELLED', icon: <XCircle className="h-4 w-4 text-red-600" /> },
  ],
  PROCESSING: [
    { label: 'Ship', nextStatus: 'SHIPPED', icon: <Truck className="h-4 w-4 text-blue-600" /> },
    { label: 'Cancel', nextStatus: 'CANCELLED', icon: <XCircle className="h-4 w-4 text-red-600" /> },
  ],
  SHIPPED: [
    { label: 'Mark Delivered', nextStatus: 'DELIVERED', icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
  ],
}

export default function SellerOrders() {
  const { user } = useAppSelector((s) => s.auth)
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [viewingProduct, setViewingProduct] = useState<any | null>(null)
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation()
  const [processReturn, { isLoading: isProcessingReturn }] = useProcessReturnRequestMutation()
  const limit = 20

  const sellerId = user?.role === 'SELLER' ? 'me' : undefined
  const { data: ordersResponse, isLoading, error, refetch } = useGetSellerOrdersQuery(
    { sellerId: sellerId!, page, limit, status: statusFilter === 'All' ? undefined : statusFilter },
    { skip: !sellerId }
  )

  const handleStatusChange = async (orderId: string, nextStatus: string, label: string) => {
    try {
      await updateOrderStatus({ orderId, status: nextStatus }).unwrap()
      toast.success(nextStatus === 'CONFIRMED' ? 'Order approved successfully! Customer notified.' : `Order status updated to ${label}`)
      refetch()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: nextStatus } : null)
      }
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to update status to ${label}`)
    }
  }

  const handleProcessReturn = async (orderId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await processReturn({ orderId, status }).unwrap()
      toast.success(status === 'APPROVED' ? 'Return approved & inventory restocked' : 'Return request rejected')
      refetch()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? {
          ...prev,
          status: status === 'APPROVED' ? 'RETURNED' : prev.status,
          returns: prev.returns?.map((r: any) => r.status === 'PENDING' ? { ...r, status } : r),
        } : null)
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to process return request')
    }
  }

  // Auto-refetch when returning to seller orders page
  useEffect(() => {
    if (sellerId) refetch()
  }, [location.pathname, sellerId, refetch])

  const orders = ordersResponse?.data || []
  const meta = ordersResponse?.meta

  const filteredOrders = orders
    .filter((o) => o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.userId.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig) return 0
      const aVal = a[sortConfig.key as keyof typeof a]
      const bVal = b[sortConfig.key as keyof typeof b]
      if (aVal == null || bVal == null) return 0
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const SortIcon = ({ sortKey }: { sortKey: string }) => {
    if (sortConfig?.key !== sortKey) return <ChevronDown className="h-4 w-4 text-secondary-400" />
    return sortConfig?.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-primary-600" /> : <ChevronDown className="h-4 w-4 text-primary-600" />
  }

  const statusOptions = ['All', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Orders</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Manage and track all your customer orders.</p>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Order ID</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Items</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Total</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Payment</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 animate-pulse">
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-32" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-12" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Orders</h1>
        </div>
        <div className="card p-6 text-center">
          <p className="text-red-500">Failed to load orders. Please try again.</p>
          <button onClick={() => refetch()} className="mt-4 btn btn-primary">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Orders</h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">Manage and track all your customer orders.</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search orders by ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 pr-4"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800/50">
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Order ID</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Date <SortIcon sortKey="createdAt" /></button>
                </th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Items</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  <button onClick={() => handleSort('total')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Total <SortIcon sortKey="total" /></button>
                </th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Payment</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-secondary-500 dark:text-secondary-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="p-4 font-mono text-sm text-secondary-900 dark:text-secondary-50">{order.id.slice(0, 12)}...</td>
                    <td className="p-4">
                      <p className="font-medium text-secondary-900 dark:text-secondary-50">
                        Customer: {order.userId.slice(0, 12)}...
                      </p>
                    </td>
                    <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">
                      {order.items && order.items.length > 0 ? (
                        (() => {
                          const firstItem = order.items[0]
                          const firstProd = firstItem.product || firstItem
                          const productSlugOrId = (firstProd as any)?.slug || firstItem.productId || firstProd.id
                          return (
                            <div className="flex items-center gap-2.5">
                              {/* Thumbnail button */}
                              <button
                                type="button"
                                onClick={() => setViewingProduct(firstProd)}
                                className="h-10 w-10 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center shrink-0 overflow-hidden border border-secondary-200 dark:border-secondary-700 hover:border-primary-500 transition-colors group cursor-pointer"
                                title="Click to view product details"
                              >
                                {firstProd?.images?.[0] ? (
                                  <img src={firstProd.images[0]} alt={firstItem.title} className="h-10 w-10 object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <Package className="h-5 w-5 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                                )}
                              </button>
                              
                              <div className="flex flex-col min-w-0">
                                {/* Title button */}
                                <button
                                  type="button"
                                  onClick={() => setViewingProduct(firstProd)}
                                  className="font-medium text-secondary-900 dark:text-secondary-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left truncate max-w-[170px] cursor-pointer group inline-flex items-center gap-1"
                                  title={`Click to view product: ${firstItem.title}`}
                                >
                                  <span className="truncate">{firstItem.title}</span>
                                  <Eye className="h-3.5 w-3.5 text-secondary-400 group-hover:text-primary-600 shrink-0" />
                                </button>

                                <div className="flex items-center gap-2 text-xs text-secondary-500 mt-0.5">
                                  <span>Qty: {firstItem.quantity}</span>
                                  {/* Direct Store Link */}
                                  <Link
                                    to={`/products/${productSlugOrId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-0.5"
                                    title="Open store page in new tab"
                                  >
                                    Store <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                  {order.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrder(order)}
                                      className="text-secondary-600 hover:text-primary-600 hover:underline font-medium"
                                      title="View all items in this order"
                                    >
                                      +{order.items.length - 1} more
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })()
                      ) : (
                        <span className="text-secondary-400 italic">No items</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">₹{Number(order.total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      {order.payment && (
                        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', paymentStyles[order.payment.status])}>
                          {order.payment.status === 'SUCCESS' ? 'Paid' : order.payment.status === 'INITIATED' ? 'Pending' : order.payment.status}
                        </span>
                      )}
                      {!order.payment && (
                        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300')}>
                          No Payment
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit', statusStyles[order.status] || statusStyles.PENDING)}>
                          {order.status}
                        </span>
                        {order.returns?.some((r: any) => r.status === 'PENDING') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse w-fit">
                            <RotateCcw className="h-3 w-3" />
                            Return Req.
                          </span>
                        )}
                        {order.returns?.some((r: any) => r.status === 'APPROVED') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 w-fit">
                            <RotateCcw className="h-3 w-3" />
                            Return Approved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600 transition-colors"
                          title="View order details"
                          aria-label="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {statusActions[order.status]?.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleStatusChange(order.id, action.nextStatus, action.label)}
                            disabled={isUpdating}
                            className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                            title={action.label}
                            aria-label={action.label}
                          >
                            {action.icon}
                          </button>
                        ))}
                        {order.returns?.some((r: any) => r.status === 'PENDING') && (
                          <div className="flex items-center gap-1 border-l border-secondary-200 dark:border-secondary-700 pl-1 ml-1">
                            <button
                              onClick={() => handleProcessReturn(order.id, 'APPROVED')}
                              disabled={isProcessingReturn}
                              className="p-1.5 rounded bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors"
                              title="Approve Return & Restock Inventory"
                              aria-label="Approve Return"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleProcessReturn(order.id, 'REJECTED')}
                              disabled={isProcessingReturn}
                              className="p-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
                              title="Reject Return"
                              aria-label="Reject Return"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, meta.total)} of {meta.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 bg-white dark:bg-secondary-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-4">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
                  Order Details
                </h2>
                <p className="font-mono text-xs text-secondary-500 mt-0.5">
                  ID: {selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-xl text-sm">
              <div>
                <p className="text-xs text-secondary-500">Date</p>
                <p className="font-medium text-secondary-900 dark:text-secondary-100 mt-0.5">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Status</p>
                <span className={clsx('inline-flex mt-0.5 items-center px-2 py-0.5 rounded-full text-xs font-medium', statusStyles[selectedOrder.status] || statusStyles.PENDING)}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Payment</p>
                <span className={clsx('inline-flex mt-0.5 items-center px-2 py-0.5 rounded-full text-xs font-medium', paymentStyles[selectedOrder.payment?.status] || 'bg-gray-100 text-gray-700')}>
                  {selectedOrder.payment?.status || 'No Payment'}
                </span>
              </div>
              <div>
                <p className="text-xs text-secondary-500">Total</p>
                <p className="font-bold text-secondary-900 dark:text-secondary-50 mt-0.5">
                  ₹{Number(selectedOrder.total || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shippingAddress && (
              <div className="border border-secondary-200 dark:border-secondary-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-secondary-900 dark:text-secondary-100 font-semibold text-sm">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <h3>Delivery Address</h3>
                </div>
                <div className="text-xs text-secondary-600 dark:text-secondary-300 space-y-0.5 pl-6">
                  <p className="font-medium text-secondary-900 dark:text-secondary-100">{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.line1} {selectedOrder.shippingAddress.line2 || ''}</p>
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}</p>
                  {selectedOrder.shippingAddress.phone && <p>Contact: {selectedOrder.shippingAddress.phone}</p>}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 text-sm">
                  Items in this order ({selectedOrder.items?.length || 0})
                </h3>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  Tap an item to view product details
                </span>
              </div>
              <div className="divide-y divide-secondary-200 dark:divide-secondary-700 border border-secondary-200 dark:border-secondary-700 rounded-xl overflow-hidden bg-white dark:bg-secondary-800/40">
                {selectedOrder.items?.map((item: any) => {
                  const prod = item.product || item
                  return (
                    <div
                      key={item.id}
                      onClick={() => setViewingProduct(prod)}
                      className="p-3 flex items-center justify-between text-sm hover:bg-secondary-50 dark:hover:bg-secondary-800/80 cursor-pointer transition-colors group"
                      role="button"
                      tabIndex={0}
                      title="Tap to view what product is this"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center shrink-0 overflow-hidden border border-secondary-200 dark:border-secondary-700 group-hover:border-primary-500 transition-colors">
                          {prod?.images?.[0] ? (
                            <img src={prod.images[0]} alt={item.title} className="h-12 w-12 object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-secondary-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 transition-colors truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-secondary-500 flex items-center gap-2 mt-0.5">
                            <span>Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}</span>
                            <span className="text-primary-600 dark:text-primary-400 font-medium inline-flex items-center gap-0.5">
                              <Eye className="h-3 w-3" /> Tap to view product
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-secondary-900 dark:text-secondary-100 shrink-0 ml-3">
                        ₹{Number(item.subtotal || item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Customer Return Request Section in Modal */}
            {selectedOrder.returns && selectedOrder.returns.length > 0 && (
              <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50/50 dark:bg-purple-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-950 dark:text-purple-100 font-semibold text-sm">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    <h3>Customer Return Request</h3>
                  </div>
                  <span className={clsx(
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                    selectedOrder.returns[0].status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                    selectedOrder.returns[0].status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  )}>
                    {selectedOrder.returns[0].status}
                  </span>
                </div>
                <div className="text-sm text-secondary-700 dark:text-secondary-300 space-y-1">
                  <p><span className="font-medium text-secondary-900 dark:text-secondary-100">Reason:</span> {selectedOrder.returns[0].reason}</p>
                  <p className="text-xs text-secondary-500">Requested on: {new Date(selectedOrder.returns[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>

                {/* Returned Product Preview Card */}
                <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60">
                  <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 uppercase tracking-wider mb-2">
                    Item(s) Requested for Return (Click to View)
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => {
                      const prod = item.product || item
                      const productSlugOrId = prod.slug || item.productId || prod.id
                      return (
                        <div
                          key={item.id}
                          onClick={() => setViewingProduct(prod)}
                          className="flex items-center justify-between p-3 bg-white dark:bg-secondary-800 rounded-xl border border-purple-200 dark:border-purple-800/80 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm cursor-pointer transition-all group"
                          role="button"
                          tabIndex={0}
                          title="Click to view what product is this"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 rounded-lg bg-secondary-100 dark:bg-secondary-700 overflow-hidden flex items-center justify-center shrink-0 border border-secondary-200 dark:border-secondary-600">
                              {prod?.images?.[0] ? (
                                <img src={prod.images[0]} alt={item.title} className="h-12 w-12 object-cover" />
                              ) : (
                                <Package className="h-6 w-6 text-secondary-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 transition-colors truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-secondary-500">
                                Qty: {item.quantity} • ₹{Number(item.price).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <Link
                              to={`/products/${productSlugOrId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="btn btn-outline btn-xs inline-flex items-center gap-1 text-secondary-700 dark:text-secondary-300 hover:text-primary-600"
                              title="Open store page in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Store Page
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewingProduct(prod)
                              }}
                              className="btn btn-primary btn-xs inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                            >
                              <Eye className="h-3 w-3" />
                              View Product
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {selectedOrder.returns[0].status === 'PENDING' && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-100 dark:border-purple-800/60">
                    <button
                      onClick={() => handleProcessReturn(selectedOrder.id, 'REJECTED')}
                      disabled={isProcessingReturn}
                      className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject Return
                    </button>
                    <button
                      onClick={() => handleProcessReturn(selectedOrder.id, 'APPROVED')}
                      disabled={isProcessingReturn}
                      className="btn btn-primary btn-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve Return & Restock
                    </button>
                  </div>
                )}
                {selectedOrder.returns[0].status === 'APPROVED' && (
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    ✓ Return has been approved. The item inventory quantity has been automatically restocked.
                  </p>
                )}
                {selectedOrder.returns[0].status === 'REJECTED' && (
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                    ✕ Return request was rejected.
                  </p>
                )}
              </div>
            )}

            {/* Status Change Action Buttons */}
            {statusActions[selectedOrder.status] && (
              <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center justify-end gap-2">
                <span className="text-xs text-secondary-500 mr-auto">Change Status:</span>
                {statusActions[selectedOrder.status].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleStatusChange(selectedOrder.id, action.nextStatus, action.label)}
                    disabled={isUpdating}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Quick View Modal */}
      {viewingProduct && (
        <div
          onClick={() => setViewingProduct(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 bg-white dark:bg-secondary-900 shadow-2xl rounded-2xl border border-secondary-200 dark:border-secondary-700 cursor-default"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
              <div className="pr-4">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                  {viewingProduct.brand || 'Product Details'}
                </span>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 mt-1 line-clamp-2">
                  {viewingProduct.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="relative h-56 w-full rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center border border-secondary-200 dark:border-secondary-700">
              {viewingProduct.images?.[0] ? (
                <img
                  src={viewingProduct.images[0]}
                  alt={viewingProduct.title}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Package className="h-16 w-16 text-secondary-400" />
              )}
            </div>

            {/* Product Meta Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl text-xs">
              <div>
                <span className="text-secondary-500 block">Unit Price</span>
                <span className="text-base font-bold text-secondary-900 dark:text-secondary-100">
                  ₹{Number(viewingProduct.price || 0).toLocaleString('en-IN')}
                </span>
                {viewingProduct.mrp && Number(viewingProduct.mrp) > Number(viewingProduct.price) && (
                  <span className="text-secondary-400 line-through ml-1.5">
                    ₹{Number(viewingProduct.mrp).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div>
                <span className="text-secondary-500 block">Category</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {viewingProduct.subcategory || viewingProduct.category?.name || 'General'}
                </span>
              </div>
              <div>
                <span className="text-secondary-500 block">Product ID / SKU</span>
                <span className="font-mono text-secondary-800 dark:text-secondary-200">
                  {viewingProduct.id ? viewingProduct.id.slice(0, 16) + '...' : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-secondary-500 block">Status</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {viewingProduct.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Description */}
            {viewingProduct.description && (
              <div>
                <h4 className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1">
                  Product Description
                </h4>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 leading-relaxed max-h-28 overflow-y-auto">
                  {viewingProduct.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center justify-end gap-2">
              <Link
                to={`/products/${viewingProduct.slug || viewingProduct.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm inline-flex items-center gap-1.5 text-secondary-700 dark:text-secondary-300"
              >
                <ExternalLink className="h-3.5 w-3.5 text-secondary-500" />
                View Store Page
              </Link>
              {viewingProduct.id && (
                <button
                  onClick={() => {
                    const prodId = viewingProduct.id
                    setViewingProduct(null)
                    setSelectedOrder(null)
                    navigate(`/seller/products/${prodId}/edit`)
                  }}
                  className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit in Inventory
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}