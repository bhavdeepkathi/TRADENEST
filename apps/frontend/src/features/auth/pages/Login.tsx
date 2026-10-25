import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch } from '../../../app/hooks'
import { useLoginMutation, useGoogleLoginMutation } from '../../../app/api'
import { api } from '../../../app/api'
import { logout, setCredentials, setLoading } from '../authSlice'
import { GoogleLogin } from '@react-oauth/google'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

function getRoleSafeRedirect(role: string, from?: { pathname?: string; search?: string; hash?: string }): string {
  const query = `${from?.search ?? ''}${from?.hash ?? ''}`
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    if (from?.pathname && from.pathname.startsWith('/admin')) {
      return `${from.pathname}${query}`
    }
    return '/admin/dashboard'
  }
  if (role === 'SELLER') {
    if (from?.pathname && from.pathname.startsWith('/seller')) {
      return `${from.pathname}${query}`
    }
    return '/seller/dashboard'
  }
  if (from?.pathname && !from.pathname.startsWith('/admin') && !from.pathname.startsWith('/seller') && from.pathname !== '/login') {
    return `${from.pathname}${query}`
  }
  return '/'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [login] = useLoginMutation()
  const [googleLoginMutation] = useGoogleLoginMutation()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    dispatch(setLoading(true))
    try {
      const result = await login(data).unwrap()
      const payload = JSON.parse(atob(result.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      dispatch(api.util.resetApiState())
      
      const tempUser = {
        id: payload.sub,
        email: data.email,
        firstName: '',
        lastName: '',
        role: payload.role as 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN',
      }
      dispatch(setCredentials({
        user: tempUser,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }))
      
      const meResult = await dispatch(
        api.endpoints.getMe.initiate(undefined, { forceRefetch: true })
      ).unwrap()
      if (meResult.id !== payload.sub || meResult.email.toLowerCase() !== data.email.toLowerCase()) {
        throw new Error('The signed-in account profile did not match the login')
      }
      dispatch(setCredentials({
        user: {
          id: meResult.id,
          email: meResult.email,
          firstName: meResult.firstName,
          lastName: meResult.lastName,
          role: meResult.role as typeof tempUser.role,
          avatarUrl: meResult.avatarUrl ?? undefined,
          phone: meResult.phone ?? undefined,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }))
      
      toast.success('Welcome back!')
      
      const from = location.state?.from as { pathname?: string; search?: string; hash?: string } | undefined
      const safePath = getRoleSafeRedirect(payload.role, from)
      navigate(safePath, { replace: true })
    } catch (error) {
      dispatch(logout())
      dispatch(api.util.resetApiState())
      const message =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof error.data === 'object' &&
        error.data !== null &&
        'message' in error.data &&
        typeof error.data.message === 'string'
          ? error.data.message
          : 'Unable to sign in. Please try again.'
      toast.error(message)

      if (message.toLowerCase().includes('verify your email')) {
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, { replace: true })
        }, 800)
      }
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
      dispatch(api.util.resetApiState())
      toast.success(`Welcome back, ${res.user.firstName || 'User'}!`)
      const from = location.state?.from as { pathname?: string; search?: string; hash?: string } | undefined
      const safePath = getRoleSafeRedirect(res.user.role, from)
      navigate(safePath, { replace: true })
    } catch (error: any) {
      const message = error?.data?.message || 'Google authentication failed'
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
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Welcome Back</h1>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">Sign in to your TRADENEST account</p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2">
              Quick Fill Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'superadmin@tradenest.local')
                  setValue('password', 'SuperAdmin@123')
                }}
                className="px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-center"
              >
                ⚡ Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'admin@tradenest.local')
                  setValue('password', 'Admin@123')
                }}
                className="px-2 py-1.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-center"
              >
                🛡️ Admin User
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'seller@tradenest.local')
                  setValue('password', 'Seller@123')
                }}
                className="px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-center"
              >
                🏪 Seller Store
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'customer@tradenest.local')
                  setValue('password', 'Customer@123')
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center"
              >
                🛒 Customer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-12"
                  placeholder="••••••••"
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-500" role="alert">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-200 dark:border-secondary-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-secondary-800 text-secondary-500">Or continue with</span>
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
                text="continue_with"
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-secondary-600 dark:text-secondary-400">
            Don't have an account? <Link to="/register" className="font-medium text-primary-600 hover:underline">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}