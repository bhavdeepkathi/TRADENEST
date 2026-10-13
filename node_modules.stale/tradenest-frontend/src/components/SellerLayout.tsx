import { Outlet, Link, useLocation, NavLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { clearCart } from '../features/cart/cartSlice'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  PlusCircle,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const sellerNavItems = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/seller/inventory', icon: Package },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { label: 'Add Product', href: '/seller/products/add', icon: PlusCircle },
  { label: 'Analytics', href: '/seller/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/seller/settings', icon: Settings },
]

export default function SellerLayout() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearCart())
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeMobileSidebar = () => setMobileOpen(false)

  return (
    <div className="flex h-screen bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        id="seller-sidebar"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20',
          'lg:translate-x-0'
        )}
        aria-label="Seller navigation"
      >
        {/* Logo & Toggle */}
        <div className={clsx('flex h-16 items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-700', 'transition-all duration-300')}>
          <Link to="/seller/dashboard" className="flex items-center gap-2" aria-label="Seller Dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Package className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Seller Center</span>}
          </Link>
          <button
            onClick={toggleSidebar}
            className={clsx('p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-700 transition-colors', 'lg:hidden')}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main seller navigation">
          <ul className="space-y-1 px-3" role="list">
            {sellerNavItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={closeMobileSidebar}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      sidebarOpen
                        ? isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 hover:text-secondary-900 dark:hover:text-secondary-50'
                        : 'justify-center p-2.5'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={sidebarOpen ? undefined : item.label}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className={clsx('p-3 border-t border-secondary-200 dark:border-secondary-700 transition-all duration-300', sidebarOpen ? 'px-3' : 'px-2')}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
              <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-50 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 space-y-1">
              <Link
                to="/seller/profile"
                onClick={closeMobileSidebar}
                className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                to="/seller/help"
                onClick={closeMobileSidebar}
                className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className={clsx('flex-1 flex flex-col min-w-0 transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 w-full border-b border-secondary-200 dark:border-secondary-700 bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="seller-sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-700"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {sidebarOpen && (
                <Link to="/seller/dashboard" className="hidden lg:flex items-center gap-2 text-lg font-bold text-primary-600 dark:text-primary-400">
                  <Package className="h-6 w-6" />
                  Seller Center
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => toast.success('Notifications coming soon!')} className="relative p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-700 transition-colors" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">3</span>
              </button>

              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-secondary-600 dark:text-secondary-300">{user?.firstName}</span>
                <button onClick={handleLogout} className="btn btn-outline text-sm">
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}