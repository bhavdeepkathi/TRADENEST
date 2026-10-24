import { Package, ShoppingBag, DollarSign, TrendingUp, PlusCircle, Eye, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../../app/hooks'
import { useGetSellerAnalyticsQuery, useGetSellerOrdersQuery } from '../../../app/api'

const statusStyles: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SHIPPED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  RETURNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function SellerDashboard() {
  const user = useAppSelector((state) => state.auth.user)
  const sellerId = user?.id || 'me'
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetSellerAnalyticsQuery()
  const { data: ordersData, isLoading: isOrdersLoading } = useGetSellerOrdersQuery({ sellerId, page: 1, limit: 5 })

  const recentOrders = ordersData?.data || []

  const stats = [
    {
      label: 'Total Products',
      value: analytics ? analytics.totalProducts.toString() : '0',
      change: 'Active catalog',
      trend: 'up',
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Total Orders',
      value: analytics ? analytics.totalOrders.toLocaleString() : '0',
      change: 'Lifetime store orders',
      trend: 'up',
      icon: ShoppingBag,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Revenue',
      value: analytics ? `₹${analytics.totalRevenue.toLocaleString('en-IN')}` : '₹0',
      change: 'Gross store sales',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Avg Order Value',
      value: analytics ? `₹${analytics.avgOrderValue.toLocaleString('en-IN')}` : '₹0',
      change: 'Per order',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Dashboard</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Welcome back! Here's an overview of your store performance.</p>
        </div>
        <Link to="/seller/products/add" className="btn btn-primary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      {isAnalyticsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse h-32 bg-secondary-100 dark:bg-secondary-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-50 mt-1">{stat.value}</p>
                </div>
                <div className={clsx('p-3 rounded-xl', stat.bg)}>
                  <stat.icon className={clsx('h-6 w-6', stat.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <span className="text-xs text-secondary-500 dark:text-secondary-400">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="card">
        <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Recent Orders</h2>
            <Link to="/seller/orders" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
        </div>

        {isOrdersLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-secondary-500 dark:text-secondary-400">
            No orders received yet. Once customers purchase your items, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Order ID</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Items</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Total</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Date</th>
                  <th className="text-right p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="p-4 font-mono text-sm text-secondary-900 dark:text-secondary-50">#{order.id.slice(0, 8)}</td>
                    <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">
                      {order.items?.length || 1} item(s)
                    </td>
                    <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">
                      ₹{Number(order.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[order.status] || 'bg-gray-100 text-gray-700')}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-secondary-500 dark:text-secondary-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/seller/orders`}
                        className="p-1.5 inline-flex rounded hover:bg-secondary-100 dark:hover:bg-secondary-700"
                        aria-label="View order"
                      >
                        <Eye className="h-4 w-4 text-secondary-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}