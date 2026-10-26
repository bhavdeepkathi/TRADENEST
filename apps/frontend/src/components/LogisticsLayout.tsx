import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import {
  Truck,
  Package,
  CheckCircle,
  Bell,
  LogOut,
  MapPin,
  Shield,
  Phone,
  Clock,
  Menu,
  X,
  Radio,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export default function LogisticsLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((s) => s.auth.user)
  const [isOnDuty, setIsOnDuty] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)

  const handleLogout = () => {
    dispatch(logout({ scope: 'logistics' }))
    toast.success('Signed out from Delivery Partner Portal')
    navigate('/login')
  }

  const notifications = [
    {
      id: 'notif-1',
      title: 'New Dispatch Assigned',
      desc: 'Order #TN-9821 assigned to your vehicle for Bandra West route.',
      time: '2 mins ago',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Priority Reseller Delivery',
      desc: 'Order #TN-9740 contains custom customer invoice. Hand over directly to recipient.',
      time: '15 mins ago',
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Pickup Confirmed',
      desc: 'Package picked up from Andheri Hub warehouse.',
      time: '1 hour ago',
      unread: false,
    },
  ]

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-secondary-900 dark:text-secondary-50">
                  TRADENEST <span className="text-indigo-600 dark:text-indigo-400">LOGISTICS</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                  FLEET PORTAL
                </span>
              </div>
              <p className="text-[11px] text-secondary-500 hidden sm:block">
                Hub: Mumbai Central Logistics Hub #04
              </p>
            </div>
          </div>

          {/* Center: Duty status toggle */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700">
            <button
              type="button"
              onClick={() => {
                setIsOnDuty(!isOnDuty)
                toast.success(isOnDuty ? 'Marked as Off Duty' : 'Marked as On Duty • Ready for dispatch')
              }}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <span className={clsx('h-2.5 w-2.5 rounded-full animate-pulse', isOnDuty ? 'bg-emerald-500' : 'bg-secondary-400')} />
              <span className={isOnDuty ? 'text-emerald-700 dark:text-emerald-400' : 'text-secondary-500'}>
                {isOnDuty ? 'Active on Duty (Dispatch Enabled)' : 'Off Duty'}
              </span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="p-2 rounded-lg text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 relative transition-colors"
                title="Dispatch Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                  2
                </span>
              </button>

              {/* Notification Drawer Popover */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-800 pb-2">
                    <h4 className="font-bold text-sm text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                      <Radio className="h-4 w-4 text-indigo-600 animate-pulse" />
                      Live Dispatch Notifications
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                      2 New
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={clsx(
                          'p-3 rounded-xl border text-xs transition-colors',
                          n.unread
                            ? 'bg-indigo-50/60 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800'
                            : 'bg-secondary-50 border-secondary-200 dark:bg-secondary-800/40 dark:border-secondary-800'
                        )}
                      >
                        <div className="flex items-center justify-between font-semibold text-secondary-900 dark:text-secondary-100">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-secondary-400">{n.time}</span>
                        </div>
                        <p className="text-secondary-600 dark:text-secondary-400 mt-1 leading-normal">
                          {n.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toast.success('All notifications marked as read')
                      setShowNotificationPanel(false)
                    }}
                    className="w-full text-center text-xs text-indigo-600 hover:underline font-semibold pt-1"
                  >
                    Mark All as Read
                  </button>
                </div>
              )}
            </div>

            {/* Partner Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-secondary-200 dark:border-secondary-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-secondary-900 dark:text-secondary-100">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Ramesh Kumar'}
                </p>
                <p className="text-[10px] text-secondary-500 font-mono">ID: TN-DP-409</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm text-xs flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-secondary-200 dark:border-secondary-800 py-4 bg-white dark:bg-secondary-900 text-center text-xs text-secondary-500">
        TRADENEST Logistics Fleet Management System • GPS Realtime Tracking Active
      </footer>
    </div>
  )
}
