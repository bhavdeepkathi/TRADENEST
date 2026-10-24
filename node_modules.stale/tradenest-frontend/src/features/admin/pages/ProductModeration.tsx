import { useState } from 'react'
import {
  CheckSquare,
  Search,
  Check,
  X,
  Eye,
  IndianRupee,
  Layers,
  Tag,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useGetProductsQuery, useUpdateProductMutation } from '../../../app/api'
import toast from 'react-hot-toast'

export default function ProductModeration() {
  const [activeTab, setActiveTab] = useState<'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ALL'>(
    'PENDING_APPROVAL'
  )
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [previewProduct, setPreviewProduct] = useState<any | null>(null)

  const { data, isLoading } = useGetProductsQuery({
    status: activeTab !== 'ALL' ? activeTab : undefined,
    page,
    limit: 20,
    q: search.trim() || undefined,
  })
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()

  const products = data?.data || []
  const meta = data?.meta

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateProduct({ id, body: { status } }).unwrap()
      toast.success(`Product status updated to ${status}`)
      if (previewProduct?.id === id) {
        setPreviewProduct(null)
      }
    } catch {
      toast.error('Failed to update product status')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          Product Catalog Moderation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review seller listings, verify product content quality, pricing compliance, and approve marketplace listings.
        </p>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'PENDING_APPROVAL'
                ? 'Pending Moderation'
                : tab === 'ACTIVE'
                ? 'Approved & Active'
                : tab === 'REJECTED'
                ? 'Rejected'
                : 'All Listings'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading catalog items...</div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
            No products found in this status
          </p>
          <p className="text-xs text-slate-400 mt-1">
            New listings submitted by sellers will appear here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                {/* Image and Status Tag */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center">
                      <Layers className="h-8 w-8 mb-1" />
                      <span>No image provided</span>
                    </div>
                  )}

                  <span
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-500 text-white'
                        : item.status === 'REJECTED'
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider">{item.brand || 'TRADENEST'}</span>
                    <span>{item.category?.name || 'General'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2" title={item.title}>
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Pricing info */}
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {Number(item.price).toLocaleString('en-IN')}
                    </span>
                    {item.mrp && Number(item.mrp) > Number(item.price) && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{Number(item.mrp).toLocaleString('en-IN')}
                      </span>
                    )}
                    {item.discountPercent > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                        {item.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(item)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>

                <div className="flex items-center gap-1.5">
                  {item.status !== 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'ACTIVE')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </button>
                  )}
                  {item.status !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'REJECTED')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} products)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Product Preview & Details</h3>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-1/2 aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {previewProduct.images?.[0] ? (
                    <img
                      src={previewProduct.images[0]}
                      alt={previewProduct.title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Layers className="h-12 w-12 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      {previewProduct.brand} • {previewProduct.category?.name}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {previewProduct.title}
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      ₹{Number(previewProduct.price).toLocaleString('en-IN')}
                    </span>
                    {previewProduct.mrp && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{Number(previewProduct.mrp).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Description:</p>
                    <p className="whitespace-pre-line leading-relaxed">{previewProduct.description}</p>
                  </div>

                  {previewProduct.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {previewProduct.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(previewProduct.id, 'REJECTED')}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50"
              >
                Reject Listing
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(previewProduct.id, 'ACTIVE')}
                disabled={isUpdating}
                className="px-4 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
