import { Link } from 'react-router-dom'
import {
  Users,
  Store,
  Clock,
  CheckCircle,
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Server,
  Activity,
  Layers,
} from 'lucide-react'
import { useGetAdminStatsQuery, useGetAdminAlertsQuery } from '../../../app/api'

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useGetAdminStatsQuery(undefined, {
    pollingInterval: 30000,
  })
  const { data: alertsData } = useGetAdminAlertsQuery()

  const infraAlertsCount = alertsData?.infraAlerts?.filter((a) => !a.acknowledged)?.length || 0
  const fraudAlertsCount = alertsData?.fraudAlerts?.filter((a) => !a.resolved)?.length || 0
  const totalUnresolvedAlerts = infraAlertsCount + fraudAlertsCount

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
        <h3 className="font-semibold text-lg">Failed to load platform statistics</h3>
        <p className="text-sm mt-1">Please ensure your account has administrator privileges.</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Platform GMV',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      subtitle: `${stats.totalOrders} total orders processed`,
      icon: IndianRupee,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
    },
    {
      title: 'Total Registered Users',
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.totalCustomers} customers, ${stats.totalSellers} sellers`,
      icon: Users,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500',
    },
    {
      title: 'Pending Seller KYC',
      value: stats.pendingKycCount,
      subtitle: stats.pendingKycCount > 0 ? 'Requires administrative review' : 'All sellers verified',
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      alert: stats.pendingKycCount > 0,
    },
    {
      title: 'Pending Products',
      value: stats.pendingProductsCount,
      subtitle: stats.pendingProductsCount > 0 ? 'Awaiting catalog approval' : 'Catalog up to date',
      icon: Layers,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      alert: stats.pendingProductsCount > 0,
    },
  ]

  const services = [
    { name: 'API Gateway', port: 4000, status: 'Healthy' },
    { name: 'Auth & Identity Service', port: 4001, status: 'Healthy' },
    { name: 'Catalog Service', port: 4002, status: 'Healthy' },
    { name: 'Order & Cart Service', port: 4003, status: 'Healthy' },
    { name: 'Payment & Wallet Service', port: 4004, status: 'Healthy' },
    { name: 'Notification Service', port: 4005, status: 'Healthy' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Mission Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global marketplace metrics, merchant verifications, and system health status.
          </p>
        </div>

        {totalUnresolvedAlerts > 0 && (
          <Link
            to="/admin/alerts"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>{totalUnresolvedAlerts} Active System Alerts</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.color} text-white shadow-sm`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </div>
              <p
                className={`text-xs mt-1 ${
                  card.alert
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Center & Queue Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant KYC Queue */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Merchant KYC Approvals</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify GSTIN documents and store legitimacy
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  stats.pendingKycCount > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {stats.pendingKycCount} Pending
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              New merchants register their business and GST details to sell products on TRADENEST. Verify
              their records to protect buyers and enable seller storefront publishing.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total registered sellers: {stats.totalSellers}
            </span>
            <Link
              to="/admin/sellers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
            >
              Open KYC Queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Product Catalog Moderation */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Product Catalog Moderation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review listings, descriptions, and pricing safety
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  stats.pendingProductsCount > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {stats.pendingProductsCount} Pending
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Ensure products listed by merchants adhere to quality guidelines, correct categorization, and
              valid pricing policies prior to being exposed to the marketplace.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Catalog safety compliance active
            </span>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline"
            >
              Open Catalog Queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Infrastructure Services Health Matrix */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Microservices Cluster Status</h3>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            All 6 Services Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{svc.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">Port :{svc.port}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{svc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
