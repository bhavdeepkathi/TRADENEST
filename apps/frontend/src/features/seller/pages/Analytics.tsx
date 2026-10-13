import { TrendingUp, TrendingDown, ShoppingBag, Package } from 'lucide-react'
import { useState } from 'react'

const analyticsData = {
  revenue: { value: '₹4,56,789', change: '+15.2%', trend: 'up' },
  orders: { value: '1,234', change: '+8.5%', trend: 'up' },
  visitors: { value: '45.6K', change: '+12.1%', trend: 'up' },
  conversion: { value: '3.24%', change: '-0.5%', trend: 'down' },
}

const topProducts = [
  { name: 'Wireless Headphones Pro', sales: 234, revenue: '₹11,69,766', conversion: '4.2%' },
  { name: 'Smart Watch Series 5', sales: 156, revenue: '₹20,27,844', conversion: '3.8%' },
  { name: 'Mechanical Keyboard RGB', sales: 189, revenue: '₹16,99,811', conversion: '3.5%' },
  { name: '4K Webcam Pro', sales: 98, revenue: '₹5,87,902', conversion: '2.9%' },
  { name: 'Portable SSD 1TB', sales: 167, revenue: '₹13,35,833', conversion: '3.1%' },
]

const trafficSources = [
  { source: 'Direct', visitors: 18240, percentage: 40 },
  { source: 'Organic Search', visitors: 11400, percentage: 25 },
  { source: 'Paid Ads', visitors: 9120, percentage: 20 },
  { source: 'Social Media', visitors: 4560, percentage: 10 },
  { source: 'Referral', visitors: 2280, percentage: 5 },
]

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30d')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Analytics</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Track your store performance and customer behavior.</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input w-auto"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(analyticsData).map(([key, data]) => (
          <div key={key} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400 capitalize">{key}</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-50 mt-1">{data.value}</p>
              </div>
              <div className={clsx('p-3 rounded-xl', key === 'revenue' ? 'bg-green-50 dark:bg-green-900/20' : key === 'orders' ? 'bg-blue-50 dark:bg-blue-900/20' : key === 'visitors' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-orange-50 dark:bg-orange-900/20')}>
                {data.trend === 'up' ? <TrendingUp className="h-6 w-6 text-green-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <span className={clsx('text-sm font-medium', data.trend === 'up' ? 'text-green-600' : 'text-red-600')}>
                {data.change}
              </span>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">vs previous period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Revenue Overview</h2>
          <div className="h-64 flex items-center justify-center bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">Chart placeholder - integrate with Recharts/Chart.js</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Orders Trend</h2>
          <div className="h-64 flex items-center justify-center bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">Chart placeholder - integrate with Recharts/Chart.js</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Product</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Sales</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Revenue</th>
                <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {topProducts.map((product) => (
                <tr key={product.name} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                        <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <span className="font-medium text-secondary-900 dark:text-secondary-50">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{product.sales}</td>
                  <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">{product.revenue}</td>
                  <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{product.conversion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="card">
        <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Traffic Sources</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {trafficSources.map((source) => (
            <div key={source.source} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-secondary-700 dark:text-secondary-300">{source.source}</div>
              <div className="flex-1 h-3 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm text-secondary-500 dark:text-secondary-400">{source.visitors.toLocaleString()}</div>
              <div className="w-12 text-right text-sm font-medium text-secondary-900 dark:text-secondary-50">{source.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}