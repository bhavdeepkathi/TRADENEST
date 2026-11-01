import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownLeft, Building2, Smartphone, CheckCircle, Clock, AlertCircle, Loader2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { useGetWalletQuery, useRequestWalletWithdrawalMutation, useGetWalletPayoutsQuery } from '../../../app/api'

export default function Payouts() {
  const { data: wallet, isLoading: isWalletLoading, refetch: refetchWallet } = useGetWalletQuery()
  const { data: payouts, isLoading: isPayoutsLoading, refetch: refetchPayouts } = useGetWalletPayoutsQuery()
  const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWalletWithdrawalMutation()

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [method, setMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI')
  const [upiId, setUpiId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  const balance = Number(wallet?.balance || 0)

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amt > balance) {
      toast.error(`Amount exceeds available balance (₹${balance.toLocaleString('en-IN')})`)
      return
    }

    if (method === 'UPI' && (!upiId || !upiId.includes('@'))) {
      toast.error('Please enter a valid UPI ID (e.g. name@okhdfcbank)')
      return
    }

    if (method === 'BANK_TRANSFER' && (!accountNumber || !ifsc)) {
      toast.error('Please enter your account number and IFSC code')
      return
    }

    try {
      const res = await requestWithdrawal({
        amount: amt,
        method,
        upiId: method === 'UPI' ? upiId.trim() : undefined,
        bankDetails: method === 'BANK_TRANSFER' ? { accountNumber: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase(), accountHolder: accountHolder.trim() } : undefined,
      }).unwrap()

      toast.success(res.message || 'Withdrawal initiated successfully!')
      setWithdrawAmount('')
      refetchWallet()
      refetchPayouts()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to process withdrawal request')
    }
  }

  const transactions = wallet?.transactions || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Payouts & Wallet</h1>
        <p className="text-sm text-secondary-500">Manage earnings, bank transfers, and withdrawal history</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-gradient-to-br from-primary-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Available for Payout</span>
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black tracking-tight">
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 text-xs text-white/80">
            Instant payouts via UPI or IMPS
          </div>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-500">Total Withdrawals</span>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-secondary-900 dark:text-secondary-100">
            ₹{(payouts || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-secondary-500">{(payouts || []).length} successful payout(s)</p>
        </div>

        <div className="rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-500">Payout Status</span>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2 text-blue-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-lg font-bold text-secondary-900 dark:text-secondary-100">
            Verified Account
          </p>
          <p className="mt-2 text-xs text-secondary-500">Zero fee direct settlement</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-1">Request Withdrawal</h2>
          <p className="text-xs text-secondary-500 mb-5">Funds are credited to your bank/UPI within minutes</p>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1.5">
                Withdrawal Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-secondary-400 font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  max={balance}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 pl-8 pr-16 py-2.5 text-sm font-bold text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(balance.toString())}
                  className="absolute right-2 top-2 rounded-lg bg-primary-100 dark:bg-primary-950/60 px-2 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:bg-primary-200"
                >
                  MAX
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-1.5">
                Payout Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    method === 'UPI'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Smartphone className="h-4 w-4" /> UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('BANK_TRANSFER')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    method === 'BANK_TRANSFER'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Building2 className="h-4 w-4" /> Bank Account
                </button>
              </div>
            </div>

            {method === 'UPI' ? (
              <div>
                <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  UPI VPA ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okaxis"
                  className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="As in bank records"
                    className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-3.5 py-2 text-sm uppercase text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isWithdrawing || balance <= 0 || !withdrawAmount}
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4 disabled:opacity-50"
            >
              {isWithdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isWithdrawing ? 'Processing...' : 'Withdraw to Bank / UPI'}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-3 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-1">Transaction History</h2>
            <p className="text-xs text-secondary-500 mb-4">Earnings, margin credits, and payout debits</p>

            {transactions.length === 0 ? (
              <div className="py-12 text-center text-secondary-400 text-sm">
                No transactions yet. Earnings from customer sales will appear here automatically.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {transactions.map((tx: any) => {
                  const isCredit = tx.type === 'CREDIT'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                            {tx.description}
                          </p>
                          <p className="text-[11px] text-secondary-400">
                            {new Date(tx.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {tx.reference && ` • Ref: ${tx.reference}`}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
