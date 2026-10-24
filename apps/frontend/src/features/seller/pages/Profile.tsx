import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Camera, Save, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppSelector } from '../../../app/hooks'
import { useUpdateProfileMutation, useUploadProductImageMutation } from '../../../app/api'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function SellerProfile() {
  const { user } = useAppSelector((state) => state.auth)
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [updateProfile] = useUpdateProfileMutation()
  const [uploadImage] = useUploadProductImageMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      bio: '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true)
    try {
      let avatarUrl = user?.avatarUrl || undefined
      if (selectedFile) {
        const uploadRes = await uploadImage(selectedFile).unwrap()
        avatarUrl = uploadRes.url
      }

      // Clean phone number
      const cleanPhone = data.phone ? data.phone.replace(/[^\d+]/g, '') : undefined
      
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: cleanPhone,
        avatarUrl,
      }).unwrap()
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof error.data === 'object' &&
        error.data !== null &&
        'message' in error.data &&
        typeof error.data.message === 'string'
          ? error.data.message
          : 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => setAvatar(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Profile</h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">Manage your personal information and account settings.</p>
      </div>

      {/* Avatar Section */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 overflow-hidden border-4 border-white dark:border-secondary-800 shadow-lg">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 mx-auto mt-3 text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 cursor-pointer transition-colors">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-50">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-secondary-500 dark:text-secondary-400 capitalize">{user?.role?.toLowerCase()}</p>
              <p className="text-sm text-secondary-400 dark:text-secondary-500 mt-1">Member since {new Date().getFullYear()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              Verified Seller
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-6">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">First Name *</label>
              <input {...register('firstName')} className="input" aria-invalid={!!errors.firstName} />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Last Name *</label>
              <input {...register('lastName')} className="input" aria-invalid={!!errors.lastName} />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Email *</label>
              <input {...register('email')} type="email" className="input" aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Phone</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">+91</span>
                <input {...register('phone')} type="tel" className="input pl-10" placeholder="98765 43210" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Address</label>
              <textarea {...register('address')} rows={2} className="input" placeholder="Enter your address" />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Bio</label>
              <textarea {...register('bio')} rows={3} className="input" placeholder="Tell us about yourself..." />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-6">Account Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">User ID</p>
              <p className="font-mono text-secondary-900 dark:text-secondary-50">{user?.id}</p>
            </div>
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Role</p>
              <p className="capitalize text-secondary-900 dark:text-secondary-50">{user?.role?.toLowerCase()}</p>
            </div>
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Email Verified</p>
              <p className="flex items-center gap-1 text-secondary-900 dark:text-secondary-50">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Yes
              </p>
            </div>
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">2FA Enabled</p>
              <p className="flex items-center gap-1 text-secondary-900 dark:text-secondary-50">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                No
              </p>
            </div>
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
    </div>
  )
}