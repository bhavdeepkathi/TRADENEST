import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForgotPasswordMutation } from '../../../app/api'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    try {
      const res = await forgotPassword({ email: data.email }).unwrap()
      setSubmittedEmail(data.email)
      if (res.devResetToken) {
        setDevToken(res.devResetToken)
      }
      toast.success(res.message || 'Password reset link sent to your email!')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send reset link. Please try again.')
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
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 mb-3 shadow-inner">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Forgot Password?</h1>
            <p className="mt-1 text-sm text-secondary-500">
              No worries! Enter your registered email and we'll send you instructions to reset your password.
            </p>
          </div>

          {submittedEmail ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Check Your Email</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  We've sent a password reset token and link to{' '}
                  <strong className="font-mono">{submittedEmail}</strong>. Please check your inbox and follow the instructions.
                </p>
              </div>

              {devToken && (
                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-indigo-700 dark:text-indigo-400">
                      ⚡ Dev Fast-Track
                    </span>
                    <span className="font-mono text-[10px] bg-indigo-200/60 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">
                      Local Testing
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-secondary-300">
                    Your generated reset token is:
                  </p>
                  <div className="font-mono font-bold bg-white dark:bg-secondary-800 p-2 rounded border border-indigo-200 dark:border-indigo-700 break-all text-indigo-600 dark:text-indigo-400 select-all">
                    {devToken}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/reset-password?email=${encodeURIComponent(submittedEmail)}&token=${encodeURIComponent(devToken)}`
                      )
                    }
                    className="w-full btn btn-primary btn-sm flex items-center justify-center gap-1.5 mt-2 text-xs"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
                  className="btn btn-primary w-full text-sm"
                >
                  I have the Reset Token
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmittedEmail(null)}
                  className="btn btn-outline w-full text-sm"
                >
                  Resend or Try Another Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-600 dark:text-secondary-400"
                >
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoFocus
                    placeholder="name@example.com"
                    className="input w-full pl-10 text-sm"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Send Reset Link</span>
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
