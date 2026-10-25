import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCheck, Bell, ShoppingBag, ShieldCheck, AlertCircle, Wallet, Info, UserCheck, PackageCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../app/api'
import { formatDistanceToNow } from '../utils/date'
import toast from 'react-hot-toast'

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const { data, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 30 },
    { skip: !isOpen, pollingInterval: isOpen ? 10000 : 0 }
  )
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()

  const notifications = data?.data || []
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap()
      toast.success('All marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleItemClick = async (item: any) => {
    if (!item.read) {
      try {
        await markRead(item.id).unwrap()
      } catch (e) {
        console.error(e)
      }
    }

    const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data
    if (data?.type === 'SELLER_REGISTRATION' || item.title?.toLowerCase().includes('seller')) {
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        navigate('/admin/sellers')
        onClose()
        return
      }
    }

    if (data?.orderId || item.title?.toLowerCase().includes('order')) {
      const orderId = data?.orderId
      if (user?.role === 'SELLER') {
        navigate(orderId ? `/seller/orders?search=${orderId}` : '/seller/orders')
      } else {
        navigate(orderId ? `/orders/${orderId}` : '/orders')
      }
      onClose()
      return
    }
  }

  const getIconForType = (type: string, title?: string) => {
    const t = (title || '').toLowerCase()
    if (t.includes('seller') || type === 'KYC_APPROVED' || type === 'KYC_REJECTED') {
      return <UserCheck className="h-4 w-4 text-indigo-500" />
    }
    if (t.includes('approved') || t.includes('delivered')) {
      return <PackageCheck className="h-4 w-4 text-emerald-500" />
    }
    switch (type) {
      case 'ORDER':
      case 'ORDER_STATUS_CHANGED':
      case 'ORDER_CONFIRMED':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />
      case 'KYC_APPROVED':
      case 'KYC_REJECTED':
        return <ShieldCheck className="h-4 w-4 text-indigo-500" />
      case 'WALLET_TOPUP':
      case 'WALLET_DEBIT':
      case 'PAYMENT':
        return <Wallet className="h-4 w-4 text-amber-500" />
      case 'ALERT':
      case 'SECURITY_ALERT':
        return <AlertCircle className="h-4 w-4 text-rose-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAll}
                      disabled={isMarkingAll}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close notifications"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-slate-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <Bell className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No notifications yet</p>
                    <p className="text-xs text-slate-400 mt-1">We'll alert you here when new updates arrive.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 rounded-lg transition-colors cursor-pointer text-left ${
                        item.read
                          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                          : 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-slate-700/60 mt-0.5">
                          {getIconForType(item.type, item.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {item.body}
                          </p>
                        </div>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
