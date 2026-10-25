import { PlusCircle, Search, Edit, Trash2, ChevronDown, ChevronUp, Loader2, RotateCcw, Save, AlertTriangle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetSellerProductsQuery, useDeleteProductMutation, useUpdateProductMutation, useGetMySellerStatusQuery } from '../../../app/api'
import toast from 'react-hot-toast'

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  INACTIVE: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  OUT_OF_STOCK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOW_STOCK: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const productIcons: Record<string, string> = {
  'Electronics': '🎧',
  'Fashion': '👕',
  'Home & Kitchen': '🏠',
  'Beauty & Personal Care': '💄',
  'Sports & Outdoors': '⚽',
  'Books': '📚',
  'Toys & Games': '🧸',
  'Automotive': '🚗',
  'General': '📦',
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [stockValues, setStockValues] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useGetSellerProductsQuery({ page, limit: 10, status: statusFilter !== 'all' ? statusFilter : undefined })
  const { data: sellerStatus } = useGetMySellerStatusQuery()
  const [deleteProduct] = useDeleteProductMutation()
  const [updateProduct, { isLoading: isUpdatingStock }] = useUpdateProductMutation()

  const products = data?.data || []
  const meta = data?.meta

  const filteredProducts = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig) return 0
      const aVal = a[sortConfig.key as keyof typeof a]
      const bVal = b[sortConfig.key as keyof typeof b]
      if (aVal == null || bVal == null) return 0
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const SortIcon = ({ sortKey }: { sortKey: string }) => {
    if (sortConfig?.key !== sortKey) return <ChevronDown className="h-4 w-4 text-secondary-400" />
    return sortConfig?.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-primary-600" /> : <ChevronDown className="h-4 w-4 text-primary-600" />
  }

  const getStockStatus = (product: typeof products[0]) => {
    const qty = product.inventory?.quantity ?? 0
    const threshold = 10
    if (qty === 0) return 'OUT_OF_STOCK'
    if (qty <= threshold) return 'LOW_STOCK'
    return product.status
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(id).unwrap()
      toast.success('Product deleted successfully')
      refetch()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/seller/products/${id}/edit`)
  }

  const handleUpdateStock = async (id: string, currentQuantity: number) => {
    const quantity = Number(stockValues[id] ?? currentQuantity)
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error('Enter a valid non-negative stock quantity')
      return
    }

    try {
      await updateProduct({ id, body: { stockQuantity: quantity } }).unwrap()
      setStockValues((values) => {
        const nextValues = { ...values }
        delete nextValues[id]
        return nextValues
      })
      toast.success('Stock updated successfully')
    } catch {
      toast.error('Failed to update stock')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Inventory</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Manage your product catalog and stock levels.</p>
        </div>
        <Link
          to="/seller/products/add"
          className={clsx('btn btn-primary', sellerStatus?.kycStatus !== 'APPROVED' && 'opacity-70')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Link>
      </div>

      {sellerStatus?.kycStatus === 'REJECTED' && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 text-red-800 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Seller KYC Verification Rejected</h3>
              <p className="text-sm mt-1">
                Your seller KYC verification was rejected by administration.
                {sellerStatus?.kycRejectionReason && (
                  <span className="font-medium"> Reason: {sellerStatus.kycRejectionReason}</span>
                )}
              </p>
              <p className="text-xs mt-1 text-red-700 dark:text-red-400">
                All your products have been hidden from customer marketplace searches and product pages. Adding and updating products is disabled until KYC approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {sellerStatus?.kycStatus === 'PENDING' && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">KYC Status: Pending Review</h3>
              <p className="text-sm mt-1">
                Your seller KYC verification is currently being reviewed by administrators. Your products will not be visible to customers until your account is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 pr-4"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REJECTED">Rejected</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <button onClick={() => refetch()} disabled={isLoading} className="btn btn-outline flex items-center gap-2">
            <RotateCcw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>Failed to load products</p>
            <button onClick={() => refetch()} className="btn btn-outline mt-2">Retry</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                  <tr className="border-b border-secondary-200 dark:border-secondary-700">
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Product</th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button onClick={() => handleSort('categoryId')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Category <SortIcon sortKey="categoryId" /></button>
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Price <SortIcon sortKey="price" /></button>
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button onClick={() => handleSort('inventory')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Stock <SortIcon sortKey="inventory" /></button>
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                    <th className="text-right p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-secondary-500">No products found</td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-800 text-2xl">
                              {product.category?.name ? productIcons[product.category.name] || '📦' : '📦'}
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900 dark:text-secondary-50 truncate max-w-xs">{product.title}</p>
                              <p className="text-xs text-secondary-500 dark:text-secondary-400">ID: {product.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{product.category?.name || 'General'}</td>
                        <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">₹{product.price.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={stockValues[product.id] ?? String(product.inventory?.quantity ?? 0)}
                              onChange={(event) => setStockValues((values) => ({ ...values, [product.id]: event.target.value }))}
                              className="input w-20"
                              aria-label={`Stock quantity for ${product.title}`}
                            />
                            <button
                              onClick={() => handleUpdateStock(product.id, product.inventory?.quantity ?? 0)}
                              disabled={isUpdatingStock}
                              className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-50"
                              aria-label={`Save stock quantity for ${product.title}`}
                            >
                              <Save className="h-4 w-4 text-primary-600" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[getStockStatus(product)])}>
                            {getStockStatus(product).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(product.id)} className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="Edit product"><Edit className="h-4 w-4 text-secondary-500" /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="Delete product"><Trash2 className="h-4 w-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, meta.total)} of {meta.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages || isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}