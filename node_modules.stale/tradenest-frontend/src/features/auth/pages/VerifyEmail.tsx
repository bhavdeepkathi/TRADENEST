import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch } from '../../../app/hooks'
import { useVerifyOtpMutation } from '../../../app/api'
import { setCredentials, setLoading } from '../authSlice'

const verifySchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
})

type VerifyForm = z.infer<typeof verifySchema>

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const email = searchParams.get('email') || ''

  const [verifyOtp] = useVerifyOtpMutation()

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  })

  const otpValue = watch('otp') || ''

  const handleResend = async () => {
    if (resendCountdown > 0) return
    try {
      // In a real app, you'd call a resend OTP endpoint
      // For now, just show the OTP from console (dev only)
      toast.success('Check console for OTP (dev mode)')
      setResendCountdown(60)
      const interval = setInterval(() => {
        setResendCountdown(c => {
          if (c <= 1) {
            clearInterval(interval)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch {
      toast.error('Failed to resend OTP')
    }
  }

  const onSubmit = async (data: VerifyForm) => {
    setIsLoading(true)
    dispatch(setLoading(true))
    try {
      const result = await verifyOtp({ email, otp: data.otp }).unwrap()
      const payload = JSON.parse(atob(result.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      const user = {
        id: payload.sub,
        email,
        firstName: '',
        lastName: '',
        role: payload.role as 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN',
      }
      dispatch(setCredentials({
        user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }))
      setIsVerified(true)
      toast.success('Email verified successfully!')
      
      setTimeout(() => {
        const redirectPath = user.role === 'SELLER' ? '/seller/dashboard' : '/'
        navigate(redirectPath, { replace: true })
      }, 1500)
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
          : 'Invalid or expired OTP. Please try again.'
      toast.error(message)
    } finally {
      setIsLoading(false)
      dispatch(setLoading(false))
    }
  }

  if (isVerified) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Email Verified!</h1>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">Redirecting you to your dashboard...</p>
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mt-6" />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <Link to="/register" className="inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700 mb-6" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="mb-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Verify Your Email</h1>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">
              We&apos;ve sent a 6-digit code to <strong className="text-secondary-900 dark:text-secondary-50">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden input for form submission */}
            <input type="hidden" {...register('otp')} />
            
            <div className="flex gap-2 justify-center" role="group" aria-label="OTP code">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]"
                  value={otpValue[i] || ''}
                  onChange={(e) => {
                    const digits = otpValue.split('')
                    digits[i] = e.target.value
                    const newValue = digits.join('')
                    setValue('otp', newValue, { shouldValidate: true })
                    if (e.target.value && i < 5) {
                      const nextInput = document.querySelector(`input[aria-label="Digit ${i + 2}"]`) as HTMLInputElement
                      nextInput?.focus()
                    } else if (!e.target.value && i > 0) {
                      const prevInput = document.querySelector(`input[aria-label="Digit ${i}"]`) as HTMLInputElement
                      prevInput?.focus()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpValue[i] && i > 0) {
                      e.preventDefault()
                      const prevInput = document.querySelector(`input[aria-label="Digit ${i}"]`) as HTMLInputElement
                      prevInput?.focus()
                    }
                  }}
                  className="w-10 h-12 text-center text-xl font-medium input rounded-lg"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {errors.otp && (
              <p className="text-center text-sm text-red-500" role="alert">{errors.otp.message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Didn&apos;t receive the code?
              <button
                onClick={handleResend}
                disabled={resendCountdown > 0}
                className="ml-2 text-primary-600 hover:underline disabled:text-secondary-400"
              >
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : 'Resend OTP'}
              </button>
            </p>
            <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
              <strong>Dev Mode:</strong> Check backend console for OTP
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-secondary-600 dark:text-secondary-400">
            <Link to="/register" className="font-medium text-primary-600 hover:underline">Register with different email</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}