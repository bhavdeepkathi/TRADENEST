import { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Search,
  Filter,
  Store,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  IndianRupee,
  Package,
} from 'lucide-react'
import { useGetAdminSellersQuery, useUpdateSellerKycMutation } from '../../../app/api'
import toast from 'react-hot-toast'

export default function KycApprovals() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [search, setSearch] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data, isLoading, refetch } = useGetAdminSellersQuery(
    activeTab !== 'ALL' ? { kycStatus: activeTab } : undefined
  )
  const [updateKyc, { isLoading: isUpdating }] = useUpdateSellerKycMutation()

  const sellers = data?.data || []

  const filteredSellers = sellers.filter((s) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      s.storeName?.toLowerCase().includes(term) ||
      s.user?.email?.toLowerCase().includes(term) ||
      s.user?.firstName?.toLowerCase().includes(term) ||
      s.user?.lastName?.toLowerCase().includes(term) ||
      s.gstin?.toLowerCase().includes(term)
    )
  })

  const handleApprove = async (sellerId: string) => {
    try {
      await updateKyc({ sellerId, status: 'APPROVED' }).unwrap()
      toast.success('Seller KYC approved successfully')
      refetch()
    } catch {
      toast.error('Failed to approve seller KYC')
    }
  }

  const handleOpenReject = (sellerId: string) => {
    setSelectedSellerId(sellerId)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!selectedSellerId) return
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }

    try {
      await updateKyc({
        sellerId: selectedSellerId,
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      }).unwrap()
      toast.success('Seller KYC rejected and reason logged')
      refetch()
      setRejectModalOpen(false)
      setSelectedSellerId(null)
    } catch {
      toast.error('Failed to reject seller KYC')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Seller KYC Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review merchant onboarding records, verify GSTIN certificates, and approve store publishing privileges.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Merchants' : tab === 'PENDING' ? 'Pending Review' : tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store, name, email, GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Sellers List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading sellers...</div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No merchants found in {activeTab.toLowerCase()} category
            </p>
            <p className="text-xs text-slate-400 mt-1">Try switching tabs or adjusting search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Merchant Store</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">GSTIN & Verification</th>
                  <th className="py-3.5 px-4">Catalog & GMV</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredSellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {seller.storeName || 'Unnamed Store'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ID: {seller.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {seller.user?.firstName} {seller.user?.lastName}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="h-3 w-3" />
                          <span>{seller.user?.email}</span>
                        </div>
                        {seller.user?.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="h-3 w-3" />
                            <span>{seller.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 font-mono font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          <FileText className="h-3 w-3 text-slate-500" />
                          {seller.gstin || 'GSTIN Pending'}
                        </div>
                        {seller.kycRejectionReason && (
                          <div className="text-[11px] text-rose-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Reason: {seller.kycRejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                          <Package className="h-3.5 w-3.5 text-slate-400" />
                          <span>{seller._count?.products || 0} Products</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <IndianRupee className="h-3 w-3" />
                          <span>₹{(seller.totalRevenue || 0).toLocaleString('en-IN')} GMV</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          seller.kycStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : seller.kycStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {seller.kycStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {seller.kycStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(seller.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        )}
                        {seller.kycStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleOpenReject(seller.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-xs transition-colors disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Reject Seller KYC
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide a clear reason for rejecting this merchant KYC application so they can correct their documents.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid GSTIN format or business name mismatch with tax invoice."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isUpdating}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
