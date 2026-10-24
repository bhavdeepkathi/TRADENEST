import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAppSelector } from '../../../app/hooks'
import {
  useGetWalletQuery,
  useGetOrdersQuery,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useUpdateProfileMutation,
  useUploadProductImageMutation,
  useChangePasswordMutation,
  useAddToWalletMutation,
} from '../../../app/api'
import {
  User,
  Package,
  Heart,
  CreditCard,
  Settings,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  Lock,
  ArrowDown,
  ArrowUp,
  Eye,
  Loader2,
  X,
  Camera,
} from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'wallet', label: 'Wallet', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useAppSelector((s) => s.auth)

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileInfo user={user} />
      case 'orders':
        return <OrdersList />
      case 'addresses':
        return <Addresses />
      case 'wishlist':
        return <WishlistTab />
      case 'wallet':
        return <Wallet />
      case 'settings':
        return <SettingsTab />
      default:
        return null
    }
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 lg:grid-cols-4"
        >
          <aside className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-secondary-900 dark:text-secondary-50">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-secondary-500">{user?.email}</p>
                  <span className={clsx('inline-flex mt-1 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', user?.role === 'SELLER' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400')}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <nav className="mt-6 card overflow-hidden">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.id}
                  to={`/profile#${tab.id}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab(tab.id) }}
                  className={({ isActive }) => clsx(
                    'flex w-full items-center gap-3 px-4 py-3 transition-colors border-l-4',
                    activeTab === tab.id
                      ? 'bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/20'
                      : 'text-secondary-600 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:bg-secondary-800'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="lg:col-span-3">
            <div id="content" className="card p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>
        </motion.div>
      </div>
    </div>
  )
}

function ProfileInfo({ user }: { user: any }) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-secondary-900 dark:text-secondary-50">Profile Information</h2>
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <div>
          <label className="block mb-1 text-sm text-secondary-500">First Name</label>
          <p className="font-medium text-secondary-900 dark:text-secondary-50">{user?.firstName}</p>
        </div>
        <div>
          <label className="block mb-1 text-sm text-secondary-500">Last Name</label>
          <p className="font-medium text-secondary-900 dark:text-secondary-50">{user?.lastName}</p>
        </div>
        <div>
          <label className="block mb-1 text-sm text-secondary-500">Email</label>
          <p className="font-medium text-secondary-900 dark:text-secondary-50">{user?.email}</p>
        </div>
        <div>
          <label className="block mb-1 text-sm text-secondary-500">Phone</label>
          <p className="font-medium text-secondary-900 dark:text-secondary-50">{user?.phone || 'Not provided'}</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-1 text-sm text-secondary-500">Role</label>
          <p className="font-medium text-secondary-900 dark:text-secondary-50 capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={() => setShowEditModal(true)} className="btn btn-primary">Edit Profile</button>
        <button onClick={() => setShowPasswordModal(true)} className="btn btn-outline">Change Password</button>
      </div>

      {showEditModal && <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  )
}

function EditProfileModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null)
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [uploadImage, { isLoading: isUploading }] = useUploadProductImageMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let avatarUrl = user?.avatarUrl
      if (selectedFile) {
        const uploadRes = await uploadImage(selectedFile).unwrap()
        avatarUrl = uploadRes.url
      }
      await updateProfile({
        firstName,
        lastName,
        phone: phone || null,
        avatarUrl,
      }).unwrap()
      toast.success('Profile updated successfully')
      onClose()
    } catch {
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6 bg-white dark:bg-secondary-900 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Edit Profile</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full bg-secondary-100 overflow-hidden border">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 mx-auto mt-4 text-secondary-400" />
              )}
            </div>
            <label className="btn btn-outline btn-sm cursor-pointer">
              <Camera className="mr-1.5 h-4 w-4" />
              Change Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input w-full"
              placeholder="+91 9876543210"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={isUpdating || isUploading} className="btn btn-primary btn-sm">
              {(isUpdating || isUploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changePassword, { isLoading }] = useChangePasswordMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap()
      toast.success('Password changed successfully')
      onClose()
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to change password')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6 bg-white dark:bg-secondary-900 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Change Password</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OrdersList() {
  const { data: ordersResponse, isLoading, error, refetch } = useGetOrdersQuery({ page: 1, limit: 10 })
  const orders = ordersResponse?.data || []

  const statusColorMap: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    SHIPPED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PROCESSING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    RETURNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-50">My Orders</h2>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold text-secondary-900 dark:text-secondary-50">My Orders</h2>
        <div className="card p-6 text-center">
          <p className="text-red-500 mb-3">Failed to load orders.</p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-50">My Orders</h2>
        {orders.length > 0 && (
          <Link to="/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View All Orders →
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-secondary-400 mb-3" />
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-50 mb-1">No orders yet</h3>
          <p className="text-secondary-500 text-sm mb-4">You have not placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary btn-sm">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-secondary-100 dark:border-secondary-800">
                <div>
                  <span className="font-mono text-sm font-semibold text-secondary-900 dark:text-secondary-50">
                    Order #{order.id.slice(0, 10)}...
                  </span>
                  <p className="text-xs text-secondary-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColorMap[order.status] || 'bg-gray-100 text-gray-700')}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-secondary-50 text-sm">
                    ₹{Number(order.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-secondary-600 dark:text-secondary-400">
                  {order.items?.slice(0, 2).map((item) => (
                    <span key={item.id} className="bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded">
                      {item.title} × {item.quantity}
                    </span>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <span className="text-secondary-500 self-center">+{order.items.length - 2} more</span>
                  )}
                </div>
                <Link
                  to={`/orders/${order.id}`}
                  className="btn btn-outline btn-sm inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Addresses() {
  const { data: addresses, isLoading } = useGetAddressesQuery()
  const [deleteAddress] = useDeleteAddressMutation()
  const [showAddModal, setShowAddModal] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Delete this address?')) {
      try {
        await deleteAddress(id).unwrap()
        toast.success('Address removed')
      } catch {
        toast.error('Failed to remove address')
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-50">Saved Addresses</h2>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm inline-flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="card p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-secondary-400 mb-2" />
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">No saved addresses yet.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">Add New Address</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="card p-5 border border-secondary-200 dark:border-secondary-700 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary-900 dark:text-secondary-50">{addr.label}</span>
                {addr.isDefault && (
                  <span className="text-[11px] bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed">
                {addr.line1}
                {addr.line2 && <><br />{addr.line2}</>}
                <br />
                {addr.city}, {addr.state} - {addr.postalCode}
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-red-500 hover:text-red-700 text-xs inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddAddressModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}

function AddAddressModal({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState('Home')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [createAddress, { isLoading }] = useCreateAddressMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAddress({
        label,
        line1,
        line2: line2 || undefined,
        city,
        state,
        postalCode,
        country: 'IN',
        isDefault,
      }).unwrap()
      toast.success('Address added successfully')
      onClose()
    } catch {
      toast.error('Failed to add address')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6 bg-white dark:bg-secondary-900 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Add New Address</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Label (e.g., Home, Work)</label>
            <input type="text" required value={label} onChange={(e) => setLabel(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Street Address</label>
            <input type="text" required value={line1} onChange={(e) => setLine1(e.target.value)} className="input w-full" placeholder="Flat / House No., Street" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Landmark (Optional)</label>
            <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} className="input w-full" placeholder="Near Apollo Hospital" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">City</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">State</label>
              <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">PIN Code</label>
            <input type="text" required maxLength={6} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="input w-full" placeholder="560001" />
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm text-secondary-700 dark:text-secondary-300">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded" />
            Set as default delivery address
          </label>
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WishlistTab() {
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-50">My Wishlist</h2>
        <Link to="/wishlist" className="btn btn-primary btn-sm">View Wishlist Page ({wishlistIds.length})</Link>
      </div>
      <p className="text-secondary-600 dark:text-secondary-400">
        You have {wishlistIds.length} item(s) saved in your wishlist. Access your complete collection from the wishlist page.
      </p>
    </div>
  )
}

function Wallet() {
  const { data: wallet, isLoading } = useGetWalletQuery()
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false)

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-secondary-900 dark:text-secondary-50">TRADENEST Wallet</h2>
      <div className="card p-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
        <p className="text-secondary-600 dark:text-secondary-400 text-sm">Available Balance</p>
        {isLoading ? (
          <p className="text-3xl font-bold text-primary-600 animate-pulse mt-1">₹0.00</p>
        ) : (
          <p className="text-3xl font-bold text-primary-600 mt-1">₹{Number(wallet?.balance || 0).toLocaleString('en-IN')}</p>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={() => setShowAddMoneyModal(true)} className="btn btn-primary">Add Money to Wallet</button>
      </div>

      {wallet?.transactions && wallet.transactions.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-secondary-50">Recent Transactions</h3>
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {wallet.transactions.slice(0, 10).map((txn) => (
              <div key={txn.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg',
                    txn.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  )}>
                    {txn.type === 'CREDIT' ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-secondary-50">{txn.description}</p>
                    <p className="text-xs text-secondary-500">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <span className={clsx('font-semibold', txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600')}>
                  {txn.type === 'CREDIT' ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddMoneyModal && <AddMoneyModal onClose={() => setShowAddMoneyModal(false)} />}
    </div>
  )
}

function AddMoneyModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('500')
  const [addToWallet, { isLoading }] = useAddToWalletMutation()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount)
    if (!num || num <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      await addToWallet({ amount: num, paymentMethod: 'UPI' }).unwrap()
      toast.success(`₹${num} added to wallet successfully!`)
      onClose()
    } catch {
      toast.error('Failed to add money to wallet')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-sm p-6 bg-white dark:bg-secondary-900 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Add Money to Wallet</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">Enter Amount (₹)</label>
            <input
              type="number"
              min="10"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input w-full text-xl font-bold"
            />
          </div>

          <div className="flex gap-2">
            {['200', '500', '1000', '2000'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="btn btn-outline btn-sm flex-1 text-xs"
              >
                +₹{preset}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Top Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-secondary-900 dark:text-secondary-50">Settings</h2>
      <div className="space-y-4 max-w-md">
        <label className="flex items-center justify-between">
          <div>
            <p className="font-medium text-secondary-900 dark:text-secondary-50">Email Notifications</p>
            <p className="text-sm text-secondary-500">Receive order updates & promotions</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
        </label>
        <label className="flex items-center justify-between">
          <div>
            <p className="font-medium text-secondary-900 dark:text-secondary-50">Push Notifications</p>
            <p className="text-sm text-secondary-500">Get real-time alerts</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
        </label>
        <hr className="border-secondary-200 dark:border-secondary-700" />
        <p className="text-xs text-secondary-400">TRADENEST Security v1.0.0</p>
      </div>
    </div>
  )
}