import { Search, Eye, Edit, Truck, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const orders = [
  { id: 'ORD-001', customer: 'Rahul Sharma', email: 'rahul@email.com', items: 3, total: '₹2,499', status: 'Delivered', date: '2024-01-15', payment: 'Paid' },
  { id: 'ORD-002', customer: 'Priya Patel', email: 'priya@email.com', items: 1, total: '₹12,999', status: 'Shipped', date: '2024-01-14', payment: 'Paid' },
  { id: 'ORD-003', customer: 'Amit Kumar', email: 'amit@email.com', items: 2, total: '₹5,499', status: 'Processing', date: '2024-01-13', payment: 'Paid' },
  { id: 'ORD-004', customer: 'Sneha Reddy', email: 'sneha@email.com', items: 4, total: '₹8,999', status: 'Pending', date: '2024-01-12', payment: 'Pending' },
  { id: 'ORD-005', customer: 'Vikram Singh', email: 'vikram@email.com', items: 1, total: '₹1,299', status: 'Cancelled', date: '2024-01-11', payment: 'Refunded' },
  { id: 'ORD-006', customer: 'Kavya Nair', email: 'kavya@email.com', items: 2, total: '₹6,499', status: 'Shipped', date: '2024-01-10', payment: 'Paid' },
]

const statusStyles: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const paymentStyles: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Refunded: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusActions: Record<string, { label: string; icon: React.ReactNode }[]> = {
  Pending: [
    { label: 'Confirm', icon: <Truck className="h-4 w-4" /> },
    { label: 'Cancel', icon: <XCircle className="h-4 w-4" /> },
  ],
  Processing: [
    { label: 'Ship', icon: <Truck className="h-4 w-4" /> },
    { label: 'Cancel', icon: <XCircle className="h-4 w-4" /> },
  ],
  Shipped: [
    { label: 'Mark Delivered', icon: <Truck className="h-4 w-4" /> },
  ],
}

export default function SellerOrders() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const filteredOrders = orders
    .filter((o) => o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()))
    .filter((o) => statusFilter === 'All' || o.status === statusFilter)
    .sort((a, b) => {
      if (!sortConfig) return 0
      const aVal = a[sortConfig.key as keyof typeof a]
      const bVal = b[sortConfig.key as keyof typeof b]
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

  const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

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
                  <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Date <SortIcon sortKey="date" /></button>
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                  <td className="p-4 font-mono text-sm text-secondary-900 dark:text-secondary-50">{order.id}</td>
                  <td className="p-4">
                    <p className="font-medium text-secondary-900 dark:text-secondary-50">{order.customer}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">{order.email}</p>
                  </td>
                  <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{order.date}</td>
                  <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{order.items}</td>
                  <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">{order.total}</td>
                  <td className="p-4">
                    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', paymentStyles[order.payment])}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[order.status])}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="View order"><Eye className="h-4 w-4 text-secondary-500" /></button>
                      <button className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="Edit order"><Edit className="h-4 w-4 text-secondary-500" /></button>
                      {statusActions[order.status]?.map((action, i) => (
                        <button key={i} className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label={action.label}>
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">Showing 1 to 6 of 6 results</p>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" disabled>Previous</button>
            <button className="btn btn-outline btn-sm" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}