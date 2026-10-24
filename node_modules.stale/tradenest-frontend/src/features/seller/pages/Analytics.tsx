import { TrendingUp, TrendingDown, ShoppingBag, Package, DollarSign, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useGetSellerAnalyticsQuery } from '../../../app/api'

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30d')
  const { data: analytics, isLoading } = useGetSellerAnalyticsQuery({ period: dateRange })

  const timeSeries = analytics?.timeSeries || []
  const maxRevenue = Math.max(...timeSeries.map((t) => t.revenue), 100)
  const maxOrders = Math.max(...timeSeries.map((t) => t.orders), 5)
  const topProducts = analytics?.topProducts || []

  // SVG dimensions
  const chartWidth = 500
  const chartHeight = 220
  const padding = 25

  // Generate SVG path for line chart
  const points = timeSeries.map((t, idx) => {
    const x = padding + (idx / Math.max(timeSeries.length - 1, 1)) * (chartWidth - padding * 2)
    const y = chartHeight - padding - (t.revenue / maxRevenue) * (chartHeight - padding * 2)
    return { x, y, date: t.date, revenue: t.revenue }
  })

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : ''
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : ''

  const kpis = [
    {
      label: 'Total Revenue',
      value: analytics ? `₹${analytics.totalRevenue.toLocaleString('en-IN')}` : '₹0',
      change: '+15.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Orders',
      value: analytics ? analytics.totalOrders.toLocaleString() : '0',
      change: '+8.5%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Avg Order Value',
      value: analytics ? `₹${analytics.avgOrderValue.toLocaleString('en-IN')}` : '₹0',
      change: '+4.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Active Products',
      value: analytics ? analytics.totalProducts.toString() : '0',
      change: 'Catalog size',
      trend: 'up',
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Analytics</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Track your store performance and sales metrics.</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input w-auto font-medium"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse h-32 bg-secondary-100 dark:bg-secondary-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">{kpi.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-50 mt-1">{kpi.value}</p>
                </div>
                <div className={clsx('p-3 rounded-xl', kpi.bg)}>
                  <kpi.icon className={clsx('h-6 w-6', kpi.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <span className="text-xs text-green-600 font-medium">{kpi.change}</span>
                <span className="text-xs text-secondary-400">vs last period</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Responsive Visual Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Overview Line Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Revenue Overview</h2>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Daily sales in ₹ (INR)</p>
            </div>
            <span className="text-sm font-bold text-primary-600">
              ₹{analytics ? analytics.totalRevenue.toLocaleString('en-IN') : '0'}
            </span>
          </div>

          {isLoading ? (
            <div className="h-56 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : timeSeries.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-secondary-500">
              No sales recorded for this period.
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56">
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartHeight - padding - ratio * (chartHeight - padding * 2)
                  return (
                    <line
                      key={ratio}
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="currentColor"
                      className="text-secondary-200 dark:text-secondary-800"
                      strokeDasharray="4 4"
                    />
                  )
                })}

                {/* Shaded Area */}
                {areaD && <path d={areaD} fill="url(#revenueGradient)" />}

                {/* Line Path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    className="fill-white stroke-primary-600 stroke-2 hover:r-5 transition-all cursor-pointer"
                  >
                    <title>{`${p.date}: ₹${p.revenue.toLocaleString('en-IN')}`}</title>
                  </circle>
                ))}
              </svg>
              <div className="flex justify-between text-[11px] text-secondary-400 px-2 mt-1">
                <span>{timeSeries[0]?.date}</span>
                <span>{timeSeries[timeSeries.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Orders Trend Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Orders Trend</h2>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Order count per day</p>
            </div>
            <span className="text-sm font-bold text-green-600">
              {analytics ? analytics.totalOrders : 0} orders
            </span>
          </div>

          {isLoading ? (
            <div className="h-56 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : timeSeries.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-secondary-500">
              No orders recorded for this period.
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56">
                {/* Horizontal baseline */}
                <line
                  x1={padding}
                  y1={chartHeight - padding}
                  x2={chartWidth - padding}
                  y2={chartHeight - padding}
                  stroke="currentColor"
                  className="text-secondary-300 dark:text-secondary-700"
                />

                {/* Bars */}
                {timeSeries.map((t, idx) => {
                  const usableWidth = chartWidth - padding * 2
                  const barWidth = Math.max(usableWidth / timeSeries.length - 3, 4)
                  const x = padding + idx * (usableWidth / timeSeries.length) + 1.5
                  const barHeight = (t.orders / maxOrders) * (chartHeight - padding * 2)
                  const y = chartHeight - padding - barHeight

                  return (
                    <rect
                      key={idx}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      rx="2"
                      className="fill-green-500 hover:fill-green-600 transition-colors cursor-pointer"
                    >
                      <title>{`${t.date}: ${t.orders} order(s)`}</title>
                    </rect>
                  )
                })}
              </svg>
              <div className="flex justify-between text-[11px] text-secondary-400 px-2 mt-1">
                <span>{timeSeries[0]?.date}</span>
                <span>{timeSeries[timeSeries.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="p-8 text-center text-secondary-500">
              No products sold yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Product</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Units Sold</th>
                  <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {topProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                          <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="font-medium text-secondary-900 dark:text-secondary-50">{product.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{product.sales} unit(s)</td>
                    <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">
                      ₹{product.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}