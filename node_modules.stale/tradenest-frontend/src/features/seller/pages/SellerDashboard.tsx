import { Package, ShoppingBag, DollarSign, TrendingUp, PlusCircle, Eye, Edit, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Total Products', value: '156', change: '+12%', trend: 'up', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Total Orders', value: '1,234', change: '+8%', trend: 'up', icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { label: 'Revenue', value: '₹4,56,789', change: '+15%', trend: 'up', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { label: 'Conversion Rate', value: '3.24%', change: '-0.5%', trend: 'down', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
]

const recentOrders = [
  { id: 'ORD-001', customer: 'Rahul Sharma', items: 3, total: '₹2,499', status: 'Delivered', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Priya Patel', items: 1, total: '₹12,999', status: 'Shipped', date: '2024-01-14' },
  { id: 'ORD-003', customer: 'Amit Kumar', items: 2, total: '₹5,499', status: 'Processing', date: '2024-01-13' },
  { id: 'ORD-004', customer: 'Sneha Reddy', items: 4, total: '₹8,999', status: 'Pending', date: '2024-01-12' },
  { id: 'ORD-005', customer: 'Vikram Singh', items: 1, total: '₹1,299', status: 'Cancelled', date: '2024-01-11' },
]

const statusStyles: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function SellerDashboard() {
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
              <span className={clsx('text-sm font-medium', stat.trend === 'up' ? 'text-green-600' : 'text-red-600')}>
                {stat.change}
              </span>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Recent Orders</h2>
            <Link to="/seller/orders" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Order ID</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Items</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Total</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Date</th>
                <th className="text-right p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                  <td className="p-4 font-mono text-sm text-secondary-900 dark:text-secondary-50">{order.id}</td>
                  <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{order.customer}</td>
                  <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{order.items}</td>
                  <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">{order.total}</td>
                  <td className="p-4">
                    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[order.status])}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-secondary-500 dark:text-secondary-400">{order.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="View order"><Eye className="h-4 w-4 text-secondary-500" /></button>
                      <button className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="Edit order"><Edit className="h-4 w-4 text-secondary-500" /></button>
                      <button className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="More options"><MoreHorizontal className="h-4 w-4 text-secondary-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}