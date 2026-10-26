import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useResetPasswordMutation } from '../../../app/api'

const resetSchema = z
  .object({
    token: z.string().min(6, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultToken = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: defaultToken,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ResetForm) => {
    try {
      const res = await resetPassword({
        token: data.token.trim(),
        password: data.password,
      }).unwrap()

      setIsSuccess(true)
      toast.success(res.message || 'Password has been reset successfully!')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err: any) {
      toast.error(err?.data?.message || 'Invalid or expired reset token. Please request a new one.')
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-white dark:bg-secondary-900 shadow-xl border border-secondary-200 dark:border-secondary-800 rounded-2xl"
        >
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Set New Password</h1>
            <p className="mt-1 text-sm text-secondary-500">
              {emailParam ? (
                <>
                  Creating new password for <span className="font-semibold text-secondary-700 dark:text-secondary-300">{emailParam}</span>
                </>
              ) : (
                'Enter your reset token and your new password below.'
              )}
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                Password Reset Successfully!
              </h2>
              <p className="text-xs text-secondary-500">
                You can now log in with your updated credentials. Redirecting to login...
              </p>
              <Link to="/login" className="btn btn-primary w-full text-sm mt-3">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="token"
                  className="block mb-1 text-xs font-semibold uppercase tracking-wider text-secondary-600 dark:text-secondary-400"
                >
                  Reset Token
                </label>
                <input
                  {...register('token')}
                  id="token"
                  type="text"
                  placeholder="Paste your reset token"
                  className="input w-full font-mono text-sm"
                  aria-invalid={!!errors.token}
                />
                {errors.token && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.token.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block mb-1 text-xs font-semibold uppercase tracking-wider text-secondary-600 dark:text-secondary-400"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    className="input w-full pr-10 text-sm"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-1 text-xs font-semibold uppercase tracking-wider text-secondary-600 dark:text-secondary-400"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className="input w-full pr-10 text-sm"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-secondary-200 dark:border-secondary-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
