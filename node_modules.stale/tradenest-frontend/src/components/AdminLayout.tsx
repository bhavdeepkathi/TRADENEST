import { Outlet, Link, useLocation, NavLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { clearCart } from '../features/cart/cartSlice'
import {
  LayoutDashboard,
  ShieldCheck,
  CheckSquare,
  Users,
  AlertTriangle,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import NotificationDrawer from './NotificationDrawer'
import { useGetUnreadNotificationCountQuery } from '../app/api'

const adminNavItems = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Sellers & KYC', href: '/admin/sellers', icon: ShieldCheck },
  { label: 'Product Moderation', href: '/admin/products', icon: CheckSquare },
  { label: 'User Directory', href: '/admin/users', icon: Users },
  { label: 'System Alerts', href: '/admin/alerts', icon: AlertTriangle },
]

export default function AdminLayout() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 20000,
  })

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearCart())
    toast.success('Logged out successfully')
  }

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeMobileSidebar = () => setMobileOpen(false)

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        id="admin-sidebar"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20',
          'lg:translate-x-0'
        )}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white">TRADENEST</span>
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Admin Portal</span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Admin navigation">
          <ul className="space-y-1.5 px-3">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={closeMobileSidebar}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                      !sidebarOpen && 'justify-center p-2.5'
                    )}
                    title={sidebarOpen ? undefined : item.label}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Admin User Info Footer */}
        <div className={clsx('p-3 border-t border-slate-800 transition-all duration-300', sidebarOpen ? 'px-4' : 'px-2')}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-indigo-400 border border-slate-700 flex-shrink-0 font-bold">
              {user?.firstName?.[0] || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-semibold uppercase">
                  {user?.role}
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Content Area */}
      <div className={clsx('flex-1 flex flex-col min-w-0 transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              System Online
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode switch */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setNotificationOpen(true)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {(unreadData?.count ?? 0) > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadData!.count > 9 ? '9+' : unreadData!.count}
                </span>
              )}
            </button>

            {/* Quick Link to Customer Storefront */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              View Storefront
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Global Notification Drawer */}
      <NotificationDrawer isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </div>
  )
}
