import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Bell, Shield, Palette, Save, Loader2, X, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useUpdateProfileMutation, useChangePasswordMutation, useGetMySellerStatusQuery } from '../../../app/api'
import { useAppSelector } from '../../../app/hooks'

const settingsSchema = z.object({
  // General
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeDescription: z.string().optional(),
  storeUrl: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Notifications
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  orderNotifications: z.boolean(),
  marketingNotifications: z.boolean(),
  
  // Security
  twoFactorEnabled: z.boolean(),
  loginAlerts: z.boolean(),
  
  // Appearance
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string(),
})

type SettingsForm = z.infer<typeof settingsSchema>

const initialValues: SettingsForm = {
  storeName: 'My Awesome Store',
  storeDescription: 'Your one-stop shop for quality products',
  storeUrl: 'my-awesome-store',
  contactEmail: '',
  phone: '',
  address: '',
  emailNotifications: true,
  smsNotifications: false,
  orderNotifications: true,
  marketingNotifications: false,
  twoFactorEnabled: false,
  loginAlerts: true,
  theme: 'system',
  primaryColor: '#3B82F6',
}

function getSavedSettings(): SettingsForm {
  try {
    const saved = localStorage.getItem('tradenest_seller_settings')
    if (saved) {
      return { ...initialValues, ...JSON.parse(saved) }
    }
  } catch {}
  return initialValues
}

const tabs = [
  { id: 'general', label: 'General', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function SellerSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const { user } = useAppSelector((state) => state.auth)
  const { data: sellerStatus } = useGetMySellerStatusQuery()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: getSavedSettings(),
  })

  const [updateProfile] = useUpdateProfileMutation()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradenest_seller_settings')
      if (!saved) {
        if (sellerStatus?.storeName) {
          setValue('storeName', sellerStatus.storeName)
        }
        if (user?.email) {
          setValue('contactEmail', user.email)
        }
        if (user?.phone) {
          setValue('phone', user.phone)
        }
      }
    } catch {}
  }, [user, sellerStatus, setValue])

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true)
    try {
      localStorage.setItem('tradenest_seller_settings', JSON.stringify(data))
      if (data.phone) {
        await updateProfile({ phone: data.phone.replace(/[^\d+]/g, '') }).unwrap().catch(() => {})
      }
      toast.success('Settings saved successfully!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Settings</h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">Manage your store settings and preferences.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="border-b border-secondary-200 dark:border-secondary-700">
            <nav className="flex -mb-px" aria-label="Settings tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:hover:text-secondary-300 dark:hover:border-secondary-600'
                  )}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6" role="tabpanel">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Store Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Store Name *</label>
                    <input {...register('storeName')} className="input" aria-invalid={!!errors.storeName} />
                    {errors.storeName && <p className="mt-1 text-sm text-red-500">{errors.storeName.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Store URL</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 text-sm">tradenest.in/store/</span>
                      <input {...register('storeUrl')} className="input pl-36" placeholder="my-awesome-store" />
                    </div>
                    {errors.storeUrl && <p className="mt-1 text-sm text-red-500">{errors.storeUrl.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Store Description</label>
                    <textarea {...register('storeDescription')} rows={3} className="input" placeholder="Describe your store..." />
                  </div>
                </div>

                <div className="pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Contact Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Contact Email</label>
                      <input {...register('contactEmail')} type="email" className="input" aria-invalid={!!errors.contactEmail} />
                      {errors.contactEmail && <p className="mt-1 text-sm text-red-500">{errors.contactEmail.message}</p>}
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Phone</label>
                      <input {...register('phone')} type="tel" className="input" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Business Address</label>
                    <textarea {...register('address')} rows={2} className="input" placeholder="Enter your business address" />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6" role="tabpanel">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                    { key: 'orderNotifications', label: 'Order Updates', desc: 'Get notified about new orders and status changes' },
                    { key: 'marketingNotifications', label: 'Marketing Emails', desc: 'Receive promotional emails and updates' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-secondary-50">{item.label}</p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(item.key as keyof SettingsForm)}
                        className="h-5 w-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6" role="tabpanel">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Account Security</h3>
                <div className="space-y-4">
                  {[
                    { key: 'twoFactorEnabled', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
                    { key: 'loginAlerts', label: 'Login Alerts', desc: 'Get notified when a new device logs into your account' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-secondary-50">{item.label}</p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(item.key as keyof SettingsForm)}
                        className="h-5 w-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-2">Password</h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">
                    Update your account password regularly to keep your store secure.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="btn btn-outline flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6" role="tabpanel">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50">Theme</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setValue('theme', theme as 'light' | 'dark' | 'system')}
                      className={clsx(
                        'p-4 rounded-lg border-2 text-center transition-all',
                        watch('theme') === theme
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                      )}
                    >
                      <span className="capitalize text-sm font-medium text-secondary-900 dark:text-secondary-50">{theme}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Brand Color</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      {...register('primaryColor')}
                      className="h-10 w-10 rounded-lg border border-secondary-300 dark:border-secondary-600 cursor-pointer"
                    />
                    <input {...register('primaryColor')} className="input w-40 font-mono" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 bg-white dark:bg-secondary-900 shadow-xl border border-secondary-200 dark:border-secondary-800">
        <div className="flex items-center justify-between pb-3 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary-600" />
            Change Password
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800" aria-label="Close">
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
              placeholder="Enter current password"
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
              placeholder="Minimum 8 characters"
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
              placeholder="Re-enter new password"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm flex items-center gap-1.5">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
