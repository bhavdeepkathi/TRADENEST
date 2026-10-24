import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch } from '../../../app/hooks'
import { useRegisterMutation, useGoogleLoginMutation } from '../../../app/api'
import { setCredentials, setLoading } from '../authSlice'
import { GoogleLogin } from '@react-oauth/google'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Enter a valid phone number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['CUSTOMER', 'SELLER']),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registerMutation] = useRegisterMutation()
  const [googleLoginMutation] = useGoogleLoginMutation()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER' },
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    dispatch(setLoading(true))
    try {
      // Clean phone number: remove spaces, dashes, parentheses, keep only digits and leading +
      const cleanPhone = data.phone ? data.phone.replace(/[^\d+]/g, '') : undefined
      const res = await registerMutation({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: cleanPhone,
        role: data.role,
      }).unwrap()

      const devOtp = res?.devOtp
      toast.success(devOtp ? `Account created! (Dev OTP: ${devOtp})` : 'Account created! Please verify your email.')
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}&role=${data.role}${devOtp ? `&otp=${devOtp}` : ''}`, { replace: true })
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
          : 'Registration failed. Please try again.'
      toast.error(message)
    } finally {
      setIsLoading(false)
      dispatch(setLoading(false))
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      toast.error('No credential received from Google')
      return
    }
    setIsLoading(true)
    dispatch(setLoading(true))
    try {
      const res = await googleLoginMutation({ credential: credentialResponse.credential }).unwrap()
      const user = {
        id: res.user.id,
        email: res.user.email,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        phone: res.user.phone ?? undefined,
        avatarUrl: res.user.avatarUrl ?? undefined,
        role: res.user.role as 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN',
      }
      dispatch(setCredentials({
        user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      }))
      toast.success(`Account ready with Google! Welcome, ${res.user.firstName || 'User'}!`)
      const redirectPath = res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN'
        ? '/admin/dashboard'
        : res.user.role === 'SELLER'
        ? '/seller/dashboard'
        : '/'
      navigate(redirectPath, { replace: true })
    } catch (error: any) {
      const message = error?.data?.message || 'Google registration failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
      dispatch(setLoading(false))
    }
  }

  const handleGoogleError = () => {
    toast.error('Google Sign-In was cancelled or failed')
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Create Account</h1>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">Join TRADENEST today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  First Name
                </label>
                <input
                  {...register('firstName')}
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="input"
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="input"
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Phone (Optional)
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                autoComplete="tel"
                className="input"
                placeholder="+91 98765 43210"
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pr-12"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">Register as</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('role')} type="radio" value="CUSTOMER" className="h-4 w-4 text-primary-600 border-secondary-300 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Customer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('role')} type="radio" value="SELLER" className="h-4 w-4 text-primary-600 border-secondary-300 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Seller</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input {...register('terms')} type="checkbox" className="mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  I agree to the <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.terms && <p className="mt-1 text-sm text-red-500">{errors.terms.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-200 dark:border-secondary-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-secondary-800 text-secondary-500">Or sign up with</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                shape="rectangular"
                width="384"
                text="signup_with"
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-secondary-600 dark:text-secondary-400">
            Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}